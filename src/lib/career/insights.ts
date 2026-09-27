import { z } from "zod";
export const storedMatchSchema = z.object({ overall: z.number().nullable(), availableWeight: z.number(), missingSkills: z.array(z.string()), components: z.array(z.object({ name: z.string(), score: z.number().nullable(), effectiveWeight: z.number() })) });
export function applicationMetrics(jobs: { applied: boolean; appliedDate: Date | null; Status: { value: string }; Interview: { id: string }[] }[]) {
  const applications = jobs.filter(j => j.applied || j.appliedDate !== null || ["applied", "interview", "offer"].includes(j.Status.value));
  const interviewed = applications.filter(j => j.Interview.length > 0 || ["interview", "offer"].includes(j.Status.value)).length;
  return { applications: applications.length, interviews: interviewed, conversion: applications.length ? Math.round(interviewed / applications.length * 1000) / 10 : null, explanation: "Interview conversion = applications with a recorded interview or current interview/offer status ÷ recorded applications. Historical interviews without records cannot be recovered from current status alone." };
}
export function summarizeMatches(analyses: { jobId: string | null; jobTitle: string | null; result: unknown }[]) {
  const seen = new Set<string>();
  const frequencies = new Map<string, number>();
  const roles = new Map<string, { total: number; count: number }>();
  for (const analysis of analyses) {
    if (!analysis.jobId || seen.has(analysis.jobId)) continue;
    seen.add(analysis.jobId);
    const parsed = storedMatchSchema.safeParse(analysis.result);
    if (!parsed.success) continue;
    for (const skill of new Set(parsed.data.missingSkills.map(s => s.trim().toLowerCase()))) frequencies.set(skill, (frequencies.get(skill) || 0) + 1);
    // Compare roles only when all weighted components were available.
    if (parsed.data.overall !== null && parsed.data.availableWeight === 100 && analysis.jobTitle) {
      const key = analysis.jobTitle.trim().toLowerCase();
      const value = roles.get(key) || { total: 0, count: 0 };
      value.total += parsed.data.overall; value.count++;
      roles.set(key, value);
    }
  }
  return {
    analyzedJobs: seen.size,
    missingSkills: [...frequencies].map(([skill, jobs]) => ({ skill, jobs })).sort((a,b) => b.jobs - a.jobs || a.skill.localeCompare(b.skill)).slice(0,10),
    bestFitRoles: [...roles].map(([role, value]) => ({ role, score: Math.round(value.total / value.count), sample: value.count })).sort((a,b) => b.score - a.score).slice(0,5),
    explanation: "Latest saved match per job, across selected resume versions. Missing means not evidenced in that resume. Best-fit roles include only complete-weight analyses of your saved jobs; they are not market-wide recommendations. Learning priorities rank these observed gaps by job count.",
  };
}
