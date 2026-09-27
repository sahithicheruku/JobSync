if (!process.env.USER_EMAIL) {
  throw new Error("Set USER_EMAIL explicitly before running this seed");
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: process.env.USER_EMAIL },
  });

  if (!user) {
    throw new Error(`User not found: ${process.env.USER_EMAIL}`);
  }

  console.log("Found user:", user.email);

  const applicationType = await prisma.activityType.upsert({
    where: { value: "job-application" },
    update: {},
    create: {
      label: "Job Application",
      value: "job-application",
      description: "Job application activity",
      createdBy: user.id,
    },
  });

  const interviewType = await prisma.activityType.upsert({
    where: { value: "interview-preparation" },
    update: {},
    create: {
      label: "Interview Preparation",
      value: "interview-preparation",
      description: "Interview preparation activity",
      createdBy: user.id,
    },
  });

  const networkingType = await prisma.activityType.upsert({
    where: { value: "networking" },
    update: {},
    create: {
      label: "Networking",
      value: "networking",
      description: "Networking and recruiter outreach",
      createdBy: user.id,
    },
  });

  // Remove only demo activities created by this script.
  await prisma.activity.deleteMany({
    where: {
      userId: user.id,
      description: {
        startsWith: "[DEMO]",
      },
    },
  });

  const now = new Date();

  const activityTemplates = Array.from({ length: 260 }, (_, index) => {
    const daysAgo = index < 70 ? index % 30 : 30 + (index * 13) % 150;
    const types = [applicationType, interviewType, networkingType];
    const type = types[index % types.length];
    return [`${type.label} activity ${index + 1}`, type.id, daysAgo, 20 + (index % 5) * 15];
  });

  for (const [activityName, activityTypeId, daysAgo, duration] of activityTemplates) {
    const startTime = new Date(now);
    startTime.setDate(now.getDate() - daysAgo);
    startTime.setHours(10 + (daysAgo % 6), 0, 0, 0);

    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    await prisma.activity.create({
      data: {
        userId: user.id,
        activityName,
        activityTypeId,
        startTime,
        endTime,
        duration,
        description: "[DEMO] Portfolio dashboard sample activity",
      },
    });
  }

  console.log(`✅ Seeded ${activityTemplates.length} activities`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
