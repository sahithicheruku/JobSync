import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewResume } from "@/lib/career/analysis";
import { apiError, modelSchema, rateLimit, readBody, requireUser } from "@/lib/career/http";
import { AiModel } from "@/models/ai.model";
export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    const body = z.object({ resumeId: z.string().min(1).max(100), jobId: z.string().min(1).max(100).optional(), selectedModel: modelSchema }).parse(await readBody(req));
    await rateLimit(`ai:${userId}`);
    return NextResponse.json(await reviewResume(userId, body.resumeId, body.jobId, body.selectedModel as AiModel | undefined));
  } catch (error) { return apiError(error); }
}
