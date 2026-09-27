if (!process.env.USER_EMAIL) throw new Error("Set USER_EMAIL explicitly for sample seeding");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const recentDate = (daysAgo) => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - daysAgo); return date; };

async function main() {
  const user = await prisma.user.findUnique({ where: { email: process.env.USER_EMAIL } });
  if (!user) throw new Error("User not found. Run the main seed first.");
  const [statuses, sources, companies, titles, locations, profile] = await Promise.all([
    prisma.jobStatus.findMany(), prisma.jobSource.findMany(), prisma.company.findMany({ take: 10 }),
    prisma.jobTitle.findMany({ take: 10 }), prisma.location.findMany({ take: 10 }),
    prisma.profile.findFirst({ where: { userId: user.id } }),
  ]);
  if (companies.length < 5 || titles.length < 5 || locations.length < 3 || sources.length < 3) throw new Error("Run the main seed and add lookup data before the demo seed.");
  const resume = profile && await prisma.resume.findFirst({ where: { profileId: profile.id } });
  const status = (value) => statuses.find((item) => item.value === value);
  if (!status("applied")) throw new Error("Run the main seed to create job statuses before the demo seed.");
  const statusCycle = [
    "interview", "applied", "applied", "applied", "applied", "applied",
    "follow-up", "follow-up", "follow-up", "follow-up", "follow-up", "follow-up", "follow-up",
    "stage-2", "stage-2", "stage-2", "stage-2", "stage-2",
    "rejected", "rejected", "rejected", "draft", "draft", "draft", "offer", "applied", "applied", "applied", "applied", "applied",
  ];
  const jobs = Array.from({ length: 200 }, (_, index) => {
    const daysAgo = index < 20 ? index % 7 : index < 70 ? 7 + index % 24 : 31 + (index * 11) % 150;
    const state = status(statusCycle[index % statusCycle.length]) || status("applied");
    const applied = state.value !== "draft";
    return { userId: user.id, jobUrl: `https://demo.jobsync.local/jobs/${index + 1}`, description: `[DEMO] ${titles[index % titles.length].label} opportunity at ${companies[index % companies.length].label}`, jobType: index % 9 === 0 ? "Contract" : "Full-time", createdAt: recentDate(daysAgo), applied, appliedDate: applied ? recentDate(Math.max(0, daysAgo - index % 3)) : null, dueDate: index % 5 === 0 ? recentDate(Math.max(0, daysAgo - 14)) : null, statusId: state.id, jobTitleId: titles[index % titles.length].id, companyId: companies[index % companies.length].id, jobSourceId: sources[index % sources.length].id, salaryRange: index % 2 ? "$110,000 - $155,000" : "$125,000 - $180,000", locationId: locations[index % locations.length].id, resumeId: applied && index % 4 === 0 ? resume?.id : null };
  });
  let created = 0;
  for (const data of jobs) { const existing = await prisma.job.findFirst({ where: { userId: user.id, jobUrl: data.jobUrl } }); if (existing) await prisma.job.update({ where: { id: existing.id }, data }); else { await prisma.job.create({ data }); created++; } }
  console.log(`Seeded ${created} new demo jobs and refreshed ${jobs.length - created}.`);
}
main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
