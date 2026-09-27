const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const csvPath = path.join(__dirname, "../ml-service/data/Coursera_Completed_Data.csv");

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { fields.push(field.trim()); field = ""; }
    else field += char;
  }
  fields.push(field.trim());
  return fields;
}

function courseData(line) {
  const fields = parseCsvLine(line);
  if (fields.length < 8 || !fields[0] || !fields[7]) return null;
  const rating = Number.parseFloat(fields[8]?.match(/[\d.]+/)?.[0] || "");
  return {
    courseName: fields[0], provider: fields[1] || "Coursera", skillsGained: fields[2] || "",
    rating: Number.isFinite(rating) ? rating : null, levelDuration: fields[4] || null,
    courseImage: fields[5] || null, providerImage: fields[6] || null, courseUrl: fields[7],
  };
}

async function main() {
  if (!process.env.USER_EMAIL) throw new Error("Set USER_EMAIL before seeding courses.");
  if (!fs.existsSync(csvPath)) throw new Error(`Course data not found: ${csvPath}`);
  const user = await prisma.user.findUnique({ where: { email: process.env.USER_EMAIL } });
  if (!user) throw new Error("User not found. Run npm run seed first.");

  const lines = fs.readFileSync(csvPath, "utf8").split(/\r?\n/).slice(1);
  const courses = [...new Map(lines.map(courseData).filter(Boolean).map((course) => [course.courseUrl, course])).values()];
  for (const course of courses.slice(0, 600)) await prisma.course.upsert({ where: { courseUrl: course.courseUrl }, update: course, create: course });

  const jobs = await prisma.job.findMany({ where: { userId: user.id }, select: { id: true } });
  const catalog = await prisma.course.findMany({ take: 12, orderBy: { courseName: "asc" } });
  for (const job of jobs) for (const [index, course] of catalog.entries()) {
    const missingSkill = course.skillsGained.split(",")[0]?.trim() || "Professional development";
    await prisma.courseRecommendation.upsert({
      where: { userId_jobId_courseId_missingSkill: { userId: user.id, jobId: job.id, courseId: course.id, missingSkill } },
      update: { matchScore: 1 - index / catalog.length },
      create: { userId: user.id, jobId: job.id, courseId: course.id, missingSkill, matchScore: 1 - index / catalog.length },
    });
  }
  console.log(`Seeded ${Math.min(courses.length, 600)} courses and recommendations for ${jobs.length} jobs.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
