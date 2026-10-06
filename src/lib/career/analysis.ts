import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import prisma from "@/lib/db";
import { AiModel } from "@/models/ai.model";
import { convertJobToText, convertResumeToText } from "@/utils/ai.utils";
import { ApiError } from "./http";
import { atsChecks, extractionSchema, RUBRIC, scoreMatch, verifyEvidence } from "./scoring";
import { generateJSON, objectSchema, stringSchema, stringsSchema } from "./provider";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");
export async function loadDocuments(userId: string, resumeId: string, jobId?: string) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeId, profile: { userId } }, include: { ContactInfo: true, File: true, ResumeSections: { include: { summary: true, others: true, licenseOrCertifications: true, workExperiences: { include: { Company: true, jobTitle: true, location: true } }, educations: { include: { location: true } } } } } });
  if (!resume) throw new ApiError(404, "Resume not found.");
  let resumeText: string;
  if (resume.File && !resume.ResumeSections.length) {
    const root = path.resolve(process.env.NODE_ENV === "production" ? "/data/files/resumes" : "data/files/resumes");
    const filePath = path.resolve(resume.File.filePath);
    if (!filePath.startsWith(root + path.sep)) throw new ApiError(400, "Resume file path is invalid.");
    const bytes = await readFile(filePath);
    if (bytes.length > 10 * 1024 * 1024) throw new ApiError(413, "Resume exceeds 10 MB.");
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), "resume.pdf");
    const response = await fetch(`${process.env.ML_SERVICE_URL || "http://localhost:8000"}/api/resume-text`, { method: "POST", body: form, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new ApiError(422, "Could not read resume PDF. Use a text-based PDF or the resume builder.");
    resumeText = z.object({ text: z.string().min(30).max(60000) }).parse(await response.json()).text;
  } else {
    // Database records include nullable fields; the existing formatter accepts optional fields.
    resumeText = await convertResumeToText(resume as unknown as Parameters<typeof convertResumeToText>[0]);
  }
  if (resumeText.trim().length < 30 || resumeText.length > 60000) throw new ApiError(422, "Resume must contain 30–60,000 characters of readable content.");
  const job = jobId ? await prisma.job.findFirst({ where: { id: jobId, userId }, include: { JobTitle: true, Company: true, Location: true } }) : null;
  if (jobId && !job) throw new ApiError(404, "Job not found.");
  const jobText = job ? await convertJobToText(job as unknown as Parameters<typeof convertJobToText>[0]) : "";
  if (jobText.length > 40000) throw new ApiError(422, "Job description exceeds 40,000 characters.");
  return { resume, resumeText, job, jobText };
}
const requirementJSON = objectSchema({ requirement: stringSchema, jobEvidence: stringSchema, resumeEvidence: stringSchema, assessment: { type: "string", enum: ["met", "partial", "missing", "unknown"] }, explanation: stringSchema });
const extractionJSON = objectSchema(Object.fromEntries(["skills", "experience", "education"].map(key => [key, { type: "array", items: requirementJSON }])));
export async function matchResume(userId: string, resumeId: string, jobId: string, settings?: AiModel) {
  const { resume, resumeText, job, jobText } = await loadDocuments(userId, resumeId, jobId);
  const generated = await generateJSON(settings, "Extract distinct explicit job requirements into skills, experience, education. Include exact verbatim jobEvidence for every requirement and exact resumeEvidence when available. Interpret relevant evidence conservatively. Met requires direct supporting evidence; partial means some evidence; missing means no evidence found in this resume, never a claim the person lacks a skill; unknown means insufficient/ambiguous evidence. Do not infer years from overlapping roles. Empty arrays mean no explicit requirements. Explain each assessment. Do not score.", { resume: resumeText, job: jobText }, extractionSchema, extractionJSON, "match");
  const evidence = process.env.AI_DEMO_MODE === "true" ? generated.value : extractionSchema.parse(Object.fromEntries(Object.entries(generated.value).map(([key, items]) => [key, verifyEvidence(items, resumeText, jobText)])));
  let semantic: number | null = null;
  try {
    const response = await fetch(`${process.env.ML_SERVICE_URL || "http://localhost:8000"}/api/semantic-similarity`, { method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(30000), body: JSON.stringify({ resume: resumeText, job: jobText }) });
    if (response.ok) semantic = z.object({ score: z.number().min(0).max(100) }).parse(await response.json()).score;
  } catch { /* Missing service is exposed as unavailable, never a fabricated similarity. */ }
  const score = scoreMatch(evidence, semantic);
  const result = { ...score, evidence, matching_score: score.overall, detailed_analysis: score.components.map(c => ({ category: `${c.name === "semantic" ? "Overall context" : c.name}: ${c.score === null ? "unavailable" : `${c.score}/100`} (weight ${Math.round(c.effectiveWeight * 100)}%)`, value: c.name === "semantic" ? [semantic === null ? "Context comparison unavailable." : "Compares the overall language and experience context in this resume and job description; it is not a hiring probability."] : evidence[c.name as keyof typeof evidence].map(r => `${r.requirement}: ${r.assessment}. ${r.explanation} Job: “${r.jobEvidence}” Resume: ${r.resumeEvidence ? `“${r.resumeEvidence}”` : "no evidence located"}`) })), suggestions: [{ category: "Skills not evidenced in this resume", value: score.missingSkills }], additional_comments: [score.explanation] };
  const record = await prisma.careerAnalysis.create({ data: { userId, kind: "match", resumeId, resumeTitle: resume.title, resumeHash: hash(resumeText), jobId, jobTitle: job!.JobTitle.label, jobHash: hash(jobText), provider: generated.provider, model: generated.model, rubric: RUBRIC, result } });
  return { ...result, analysisId: record.id };
}
const reviewSchema = z.object({ summary: z.string(), strengths: z.array(z.string()), weaknesses: z.array(z.string()), suggestions: z.array(z.string()), keywordGaps: z.array(z.object({ keyword: z.string(), jobEvidence: z.string() })), weakBullets: z.array(z.object({ quote: z.string(), reason: z.string(), suggestion: z.string() })), jobSuggestions: z.array(z.string()) });
const reviewJSON = objectSchema({ summary: stringSchema, strengths: stringsSchema, weaknesses: stringsSchema, suggestions: stringsSchema, keywordGaps: { type: "array", items: objectSchema({ keyword: stringSchema, jobEvidence: stringSchema }) }, weakBullets: { type: "array", items: objectSchema({ quote: stringSchema, reason: stringSchema, suggestion: stringSchema }) }, jobSuggestions: stringsSchema });
export async function reviewResume(userId: string, resumeId: string, jobId?: string, settings?: AiModel) {
  const { resume, resumeText, job, jobText } = await loadDocuments(userId, resumeId, jobId);
  const generated = await generateJSON(settings, "Review this resume. Cite exact verbatim weak bullet quotes and explain how to improve them. Never fabricate numbers or accomplishments; request real evidence where needed. Find job keyword gaps with exact jobEvidence, and give job-specific suggestions only if a job is provided. Without a job, keywordGaps and jobSuggestions must be empty. Do not produce any scores. Describe formatting limitations of text-only review.", { resume: resumeText, job: jobText || null }, reviewSchema, reviewJSON, "review");
  const review = generated.value;
  if (process.env.AI_DEMO_MODE !== "true") {
    for (const bullet of review.weakBullets) if (!bullet.quote.trim() || !resumeText.includes(bullet.quote)) throw new Error("Unverifiable bullet");
    for (const gap of review.keywordGaps) if (!gap.keyword.trim() || !gap.jobEvidence.trim() || !jobText.includes(gap.jobEvidence) || resumeText.toLowerCase().includes(gap.keyword.toLowerCase())) throw new Error("Unverifiable keyword gap");
    if (!job && (review.keywordGaps.length || review.jobSuggestions.length)) throw new Error("Job-specific claims without a job");
  }
  const ats = atsChecks(resumeText);
  const result = { ...review, ats, score: ats.score, suggestions: [...review.suggestions, ...review.jobSuggestions], weaknesses: [...review.weaknesses, ...review.weakBullets.map(b => `“${b.quote}”: ${b.reason} Suggestion: ${b.suggestion}`), ...review.keywordGaps.map(g => `Keyword gap: ${g.keyword}. Job evidence: “${g.jobEvidence}”`)], summary: `${review.summary}\n${ats.explanation}` };
  const record = await prisma.careerAnalysis.create({ data: { userId, kind: "review", resumeId, resumeTitle: resume.title, resumeHash: hash(resumeText), jobId: job?.id, jobTitle: job?.JobTitle.label, jobHash: job ? hash(jobText) : null, provider: generated.provider, model: generated.model, rubric: RUBRIC, result } });
  return { ...result, analysisId: record.id };
}
