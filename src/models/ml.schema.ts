import { z } from "zod";

const text = z.string().trim().min(1).max(50_000);
const skills = z.array(z.string().trim().min(1).max(200)).max(200);
const topN = z.number().int().min(1).max(50).default(10);

export const extractSkillsSchema = z.object({ text });
export const analyzeJobSchema = z.object({
  jobDescription: text,
  resumeSkills: skills,
  topN,
  jobId: z.string().min(1).optional(),
});
export const recommendCoursesSchema = z.object({ missingSkills: skills, topN });
export const searchCoursesSchema = z.object({ query: text, topN });
