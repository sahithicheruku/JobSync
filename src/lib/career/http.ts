import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/db";
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function requireUser() {
  const session = await auth();
  const id = session?.accessToken?.sub;
  if (!session?.user || !id) throw new ApiError(401, "Please sign in.");
  return id as string;
}
export { rateLimit } from "@/lib/rate-limit";
export async function readBody(req: Request) {
  if (Number(req.headers.get("content-length")) > 100000) throw new ApiError(413, "Request is too large.");
  const text = await req.text();
  if (text.length > 100000) throw new ApiError(413, "Request is too large.");
  try { return JSON.parse(text); } catch { throw new ApiError(400, "Invalid JSON."); }
}
export function apiError(error: unknown) {
  const requestId = crypto.randomUUID();
  const status = error instanceof ApiError ? error.status : error instanceof z.ZodError ? 400 : error instanceof Error && "status" in error && error.status === 429 ? 429 : 503;
  // Never log resumes, prompts, credentials, provider bodies, or database URLs.
  console.error(JSON.stringify({ event: "career_request_failed", requestId, status, errorType: error instanceof Error ? error.name : "Unknown" }));
  return NextResponse.json({ error: error instanceof ApiError ? error.message : status === 400 ? "Invalid request fields." : "Analysis is unavailable. Check service configuration or try again.", requestId }, { status, headers: status === 429 ? { "Retry-After": "60" } : undefined });
}
export const modelSchema = z.object({ provider: z.enum(["openai", "ollama"]), model: z.string().max(100).optional() }).optional();
