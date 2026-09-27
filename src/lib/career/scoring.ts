import { z } from "zod";

export const RUBRIC = "career-v1";
export const requirementSchema = z.object({
  requirement: z.string().min(1).max(200),
  jobEvidence: z.string().min(1).max(1500),
  resumeEvidence: z.string().max(1500),
  assessment: z.enum(["met", "partial", "missing", "unknown"]),
  explanation: z.string().max(1500),
});
export const extractionSchema = z.object({
  skills: z.array(requirementSchema).max(60),
  experience: z.array(requirementSchema).max(30),
  education: z.array(requirementSchema).max(20),
});
export type Extraction = z.infer<typeof extractionSchema>;
export type Requirement = z.infer<typeof requirementSchema>;
const normalize = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
export function verifyEvidence(items: Requirement[], resume: string, job: string) {
  const seen = new Set<string>();
  return items.map(item => {
    const key = normalize(item.requirement);
    if (seen.has(key)) throw new Error("Duplicate extracted requirement");
    seen.add(key);
    if (!normalize(item.jobEvidence) || !normalize(job).includes(normalize(item.jobEvidence))) throw new Error("Unverifiable job evidence");
    if (item.resumeEvidence && !normalize(resume).includes(normalize(item.resumeEvidence))) throw new Error("Unverifiable resume evidence");
    if (["met", "partial"].includes(item.assessment) && !item.resumeEvidence.trim()) throw new Error("Positive assessment needs evidence");
    return item;
  });
}
export function scoreMatch(extraction: Extraction, semantic: number | null) {
  const weights = { skills: 40, experience: 25, education: 10, semantic: 25 };
  const components = Object.entries(weights).map(([name, weight]) => {
    if (name === "semantic") return { name, weight, score: semantic === null ? null : Math.round(Math.max(0, Math.min(100, semantic))), assessed: semantic === null ? 0 : 1, total: 1 };
    const requirements = extraction[name as keyof Extraction];
    const known = requirements.filter(r => r.assessment !== "unknown");
    return { name, weight, score: known.length ? Math.round(100 * known.reduce((n, r) => n + (r.assessment === "met" ? 1 : r.assessment === "partial" ? 0.5 : 0), 0) / known.length) : null, assessed: known.length, total: requirements.length };
  });
  const availableWeight = components.reduce((n, c) => n + (c.score === null ? 0 : c.weight), 0);
  return {
    components: components.map(c => ({ ...c, effectiveWeight: c.score === null ? 0 : c.weight / availableWeight })),
    overall: availableWeight ? Math.round(components.reduce((n, c) => n + (c.score ?? 0) * c.weight, 0) / availableWeight) : null,
    availableWeight,
    missingSkills: extraction.skills.filter(r => r.assessment === "missing").map(r => r.requirement),
    explanation: "Rubric v1: skills 40%, experience 25%, education 10%, semantic similarity 25%. Met = 1, partial = 0.5, missing = 0. Unknown requirements are excluded. Unavailable components are excluded and remaining weights normalized. This is a guidance score, not a hiring probability. Evidence interpretation is AI-generated; review the cited text.",
  };
}
export function atsChecks(text: string) {
  const checks = [
    { label: "Contact email", passed: /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text) },
    { label: "Experience section", passed: /\b(experience|employment|work history|job title)\b/i.test(text) },
    { label: "Education section", passed: /\b(education|degree|university|institution)\b/i.test(text) },
    { label: "Skills or project evidence", passed: /\b(skills|technologies|projects|built|developed)\b/i.test(text) },
    { label: "Dated experience or education", passed: /\b(19|20)\d{2}\b/.test(text) },
  ];
  return { score: checks.filter(c => c.passed).length / checks.length * 100, checks, explanation: "Text-readiness heuristic: five equally weighted checks. This does not measure an ATS vendor's score or inspect PDF layout, columns, fonts, or parsing compatibility." };
}
