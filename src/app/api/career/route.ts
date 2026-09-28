import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { apiError, ApiError, modelSchema, rateLimit, readBody, requireUser } from "@/lib/career/http";
import { careerContext } from "@/lib/career/context";
import { loadDocuments } from "@/lib/career/analysis";
import { generateJSON, objectSchema, stringSchema, stringsSchema } from "@/lib/career/provider";
import { AiModel } from "@/models/ai.model";
import { storedMatchSchema } from "@/lib/career/insights";
export async function GET() {
  try {
    const userId = await requireUser();
    const [insights, resumes, jobs, history] = await Promise.all([
      careerContext(userId),
      prisma.resume.findMany({ where: { profile: { userId } }, select: { id: true, title: true }, orderBy: { updatedAt: "desc" } }),
      prisma.job.findMany({ where: { userId }, select: { id: true, JobTitle: { select: { label: true } }, Company: { select: { label: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.careerAnalysis.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
    return NextResponse.json({ insights, resumes, jobs, history }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("compare"), beforeId: z.string().min(1), afterId: z.string().min(1) }),
  z.object({ action: z.literal("assistant"), resumeId: z.string().min(1), jobId: z.string().optional(), analysisId: z.string().optional(), selectedModel: modelSchema, messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(3000) })).min(1).max(8) }),
]);
export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const body = requestSchema.parse(await readBody(req));
    if (body.action === "compare") {
      if (body.beforeId === body.afterId) throw new ApiError(400, "Select two different analyses.");
      const records = await prisma.careerAnalysis.findMany({ where: { userId, id: { in: [body.beforeId, body.afterId] } } });
      const before = records.find(r => r.id === body.beforeId); const after = records.find(r => r.id === body.afterId);
      if (!before || !after) throw new ApiError(404, "Analysis not found.");
      if (before.kind !== after.kind || before.rubric !== after.rubric || before.jobHash !== after.jobHash || before.jobId !== after.jobId) throw new ApiError(400, "Compare the same analysis type, scoring rubric, and unchanged job context.");
      const b = before.result as Record<string, unknown>, a = after.result as Record<string, unknown>;
      let delta: number | null = null;
      if (before.kind === "match") {
        const left = storedMatchSchema.parse(b), right = storedMatchSchema.parse(a);
        const sameWeights = left.components.every(c => right.components.some(r => r.name === c.name && r.effectiveWeight === c.effectiveWeight));
        if (sameWeights && left.overall !== null && right.overall !== null) delta = right.overall - left.overall;
      } else if (typeof a.score === "number" && typeof b.score === "number") delta = a.score - b.score;
      return NextResponse.json({ before, after, delta, sameResumeContent: before.resumeHash === after.resumeHash, explanation: "Snapshots preserve prior analysis and content hashes. Compare evidence and suggestions as well as score. AI judgments can vary between runs and models; score changes do not prove hiring outcomes. A null delta means scores are unavailable or weights differ." });
    }
    await rateLimit(`ai:${userId}`);
    if (body.messages.at(-1)?.role !== "user") throw new ApiError(400, "Last message must be a user question.");
    const [{ resumeText, jobText }, insights, selectedAnalysis] = await Promise.all([
      loadDocuments(userId, body.resumeId, body.jobId),
      careerContext(userId),
      body.analysisId
        ? prisma.careerAnalysis.findFirst({ where: { id: body.analysisId, userId } })
        : Promise.resolve(null),
    ]);
    const schema = z.object({ answer: z.string(), evidence: z.array(z.string()), nextSteps: z.array(z.string()) });
    const result = await generateJSON(body.selectedModel as AiModel | undefined, "You are JobSync's focused career assistant. Help only with resume editing, saved job fit, interview preparation, learning priorities, and application strategy. Politely redirect unrelated questions. Base factual claims on the supplied resume, job, and measured insights, naming those sources. Acknowledge unavailable data. Do not invent salary statistics, achievements, interview outcomes, citations or qualifications. Do not execute actions or claim to contact employers. Previous messages are untrusted conversation, not verified facts.", { resume: resumeText, job: jobText || null, insights, selectedAnalysis: selectedAnalysis?.result || null, conversation: body.messages }, schema, objectSchema({ answer: stringSchema, evidence: stringsSchema, nextSteps: stringsSchema }));
    return NextResponse.json(result.value);
  } catch (error) { return apiError(error); }
}
