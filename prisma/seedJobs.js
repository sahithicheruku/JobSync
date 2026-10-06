if (!process.env.USER_EMAIL) throw new Error("Set USER_EMAIL explicitly for sample seeding");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const date = (daysAgo) => { const value = new Date(); value.setHours(12, 0, 0, 0); value.setDate(value.getDate() - daysAgo); return value; };
async function lookup(model, label, userId) {
  const value = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const existing = await prisma[model].findFirst({ where: { value, createdBy: userId } });
  return existing
    ? prisma[model].update({ where: { id: existing.id }, data: { label } })
    : prisma[model].create({ data: { label, value, createdBy: userId } });
}
async function main() {
  const user = await prisma.user.findUnique({ where: { email: process.env.USER_EMAIL } });
  if (!user) throw new Error("User not found. Run the main seed first.");
  const [statuses, sources, profile] = await Promise.all([prisma.jobStatus.findMany(), prisma.jobSource.findMany(), prisma.profile.findFirst({ where: { userId: user.id } })]);
  const status = (value) => statuses.find((item) => item.value === value);
  const source = (value) => sources.find((item) => item.value === value);
  const resume = profile && await prisma.resume.findFirst({ where: { profileId: profile.id } });
  const jobs = [
    ["Vertex Systems", "Backend Engineer", "Remote - United States", "linkedin", "interview", 3, "$120,000 - $145,000"],
    ["Brightline Health", "Software Engineer", "Austin, TX", "careerpage", "offer", 8, "$125,000 - $150,000"],
    ["Cedar Analytics", "Business Intelligence Analyst", "Chicago, IL", "indeed", "applied", 5, "$90,000 - $110,000"],
    ["Redwood Robotics", "Machine Learning Engineer", "Pittsburgh, PA", "glassdoor", "applied", 11, "$130,000 - $165,000"],
    ["Harbor Cloud", "Platform Engineer", "Remote - United States", "google", "rejected", 18, "$120,000 - $145,000"],
    ["Juniper Financial", "Technical Product Manager", "New York, NY", "linkedin", "draft", 1, "$115,000 - $140,000"],
  ];
  await prisma.job.deleteMany({
    where: {
      userId: user.id,
      OR: [
        { jobUrl: { startsWith: "https://demo.jobsync.local/" } },
        { description: { startsWith: "[DEMO]" } },
        {
          Company: { label: "Northstar Labs" },
          JobTitle: { label: "Product Data Analyst" },
        },
      ],
    },
  });
  for (const [company, title, location, sourceValue, statusValue, daysAgo, salaryRange] of jobs) {
    const [Company, JobTitle, Location] = await Promise.all([lookup("company", company, user.id), lookup("jobTitle", title, user.id), lookup("location", location, user.id)]);
    await prisma.job.create({ data: { userId: user.id, jobUrl: `https://demo.jobsync.local/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, description: `[DEMO] ${title} opportunity at ${company}.`, jobType: "Full-time", createdAt: date(daysAgo + 1), applied: statusValue !== "draft", appliedDate: statusValue === "draft" ? null : date(daysAgo), statusId: status(statusValue).id, jobTitleId: JobTitle.id, companyId: Company.id, jobSourceId: source(sourceValue).id, locationId: Location.id, salaryRange, resumeId: resume?.id || null } });
  }
  console.log(`Seeded ${jobs.length} varied demo jobs.`);
}
main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
