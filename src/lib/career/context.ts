import prisma from "@/lib/db";
import { applicationMetrics, summarizeMatches } from "./insights";
export async function careerContext(userId: string) {
  const [jobs, analyses] = await Promise.all([
    prisma.job.findMany({ where: { userId }, include: { Status: true, Interview: { select: { id: true } } } }),
    prisma.careerAnalysis.findMany({ where: { userId, kind: "match" }, orderBy: { createdAt: "desc" }, select: { jobId: true, jobTitle: true, result: true } }),
  ]);
  const activeIds = new Set(jobs.map(j => j.id));
  return { ...applicationMetrics(jobs), ...summarizeMatches(analyses.filter(a => a.jobId && activeIds.has(a.jobId))) };
}
