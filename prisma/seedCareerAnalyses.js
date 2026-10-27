const SEED_EMAIL = process.env.DEMO_USER_EMAIL || process.env.USER_EMAIL;
if (!SEED_EMAIL) throw new Error("Set DEMO_USER_EMAIL explicitly for demo seeding");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const result = (score, focus) => ({
  overall: score,
  availableWeight: 100,
  missingSkills: ["Stakeholder communication", "Observability"],
  components: [
    { name: "skills", score, effectiveWeight: 0.6 },
    { name: "experience", score: Math.max(0, score - 4), effectiveWeight: 0.4 },
  ],
  matching_score: score,
  summary: `This analysis highlights ${focus}.`,
  strengths: [`Relevant experience is visible for ${focus}.`],
  weaknesses: ["Add more measurable outcomes for the target role."],
  suggestions: ["Tailor the summary and strongest bullets to this job."],
  detailed_analysis: [{ category: "Skills-based matching", value: [`The resume shows a solid foundation for ${focus}.`] }],
  additional_comments: ["AI-powered similarity analysis is based on the saved resume and job description."],
});

async function main() {
  const user = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (!user) throw new Error("User not found. Run the main seed first.");
  const profile = await prisma.profile.findFirst({ where: { userId: user.id } });
  if (!profile) throw new Error("Profile not found. Run seedResume first.");

  const resumes = await prisma.resume.findMany({ where: { profileId: profile.id }, orderBy: { createdAt: "asc" } });
  const jobs = await prisma.job.findMany({
    where: { userId: user.id, jobUrl: { startsWith: "https://demo.jobsync.local/" } },
    include: { JobTitle: true },
    orderBy: { createdAt: "asc" },
    take: 24,
  });
  if (resumes.length < 2 || jobs.length < 10) throw new Error("Seed resumes and ten demo jobs before analyses.");

  await prisma.careerAnalysis.deleteMany({ where: { userId: user.id, provider: "demo-seed" } });
  const analyses = [
    [resumes[0], jobs[0], "match", 91, "SQL, experimentation, and product insights"],
    [resumes[1], jobs[0], "match", 83, "Python services and cloud systems"],
    [resumes[1], jobs[1], "match", 84, "Python services and cloud systems"],
    [resumes[1], jobs[2], "match", 78, "data pipelines and reporting"],
    [resumes[0], jobs[3], "match", 73, "backend engineering and distributed systems"],
    [resumes[1], jobs[4], "review", 88, "platform reliability and automation"],
    [resumes[0], jobs[5], "match", 67, "React, TypeScript, and frontend delivery"],
    [resumes[1], jobs[6], "match", 90, "cloud architecture and Python services"],
    [resumes[0], jobs[7], "match", 61, "product analytics and stakeholder communication"],
    [resumes[1], jobs[8], "review", 76, "data engineering and operational reliability"],
    [resumes[0], jobs[9], "match", 58, "machine learning fundamentals and experimentation"],
    [resumes[1], jobs[10], "match", 86, "Java services, APIs, and PostgreSQL"],
    [resumes[0], jobs[11], "review", 64, "resume clarity and measurable outcomes"],
    [resumes[1], jobs[12], "match", 89, "AI service design and cloud deployment"],
    [resumes[0], jobs[13], "match", 72, "data visualization and stakeholder reporting"],
    [resumes[1], jobs[14], "review", 82, "platform operations and incident response"],
    [resumes[0], jobs[15], "match", 56, "program planning and executive communication"],
    [resumes[1], jobs[16], "match", 87, "distributed systems and API ownership"],
    [resumes[0], jobs[17], "review", 69, "machine learning project framing"],
    [resumes[1], jobs[18], "match", 79, "analytics engineering and SQL"],
    [resumes[0], jobs[19], "match", 91, "platform reliability and automation"],
  ];
  for (const [resume, job, kind, score, focus] of analyses) {
    const text = `${resume.title}:${job.id}:${focus}`;
    await prisma.careerAnalysis.create({
      data: {
        userId: user.id, kind, resumeId: resume.id, resumeTitle: resume.title,
        resumeHash: hash(`${resume.id}:${resume.title}`), jobId: job.id,
        jobTitle: job.JobTitle.label, jobHash: hash(job.id), provider: "demo-seed",
        model: "demo", rubric: "Demo portfolio analysis", result: kind === "review"
          ? { score, summary: `Resume review focused on ${focus}.`, strengths: ["Clear technical foundation."], weaknesses: ["Add role-specific outcomes."], suggestions: ["Prioritize the most relevant accomplishments."] }
          : result(score, focus),
      },
    });
  }
  console.log(`Seeded ${analyses.length} distinct demo analyses.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
