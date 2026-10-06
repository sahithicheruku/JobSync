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
    update: {
      label: "Job Application",
      description: "Job application activity",
    },
    create: {
      label: "Job Application",
      value: "job-application",
      description: "Job application activity",
      createdBy: user.id,
    },
  });

  await prisma.activity.deleteMany({
    where: {
      userId: user.id,
      description: {
        startsWith: "[DEMO-CALENDAR]",
      },
    },
  });

  const dates2026 = [
    "2026-01-05","2026-01-12","2026-01-19","2026-01-27",
    "2026-02-03","2026-02-10","2026-02-17","2026-02-24",
    "2026-03-04","2026-03-11","2026-03-18","2026-03-25",
    "2026-04-02","2026-04-09","2026-04-16","2026-04-23",
    "2026-05-05","2026-05-12","2026-05-19","2026-05-26",
    "2026-06-03","2026-06-10","2026-06-17","2026-06-24",
    "2026-07-02","2026-07-09","2026-07-16","2026-07-23",
    "2026-08-04","2026-08-11","2026-08-18","2026-08-25",
    "2026-09-03","2026-09-08","2026-09-14","2026-09-21","2026-09-28",
    "2026-10-01","2026-10-02","2026-10-03"
  ];

  const demoDates = [...dates2026];

  for (let i = 0; i < demoDates.length; i++) {
    const date = demoDates[i];
    const hour = 9 + (i % 7);
    const startTime = new Date(
      `${date}T${String(hour).padStart(2, "0")}:00:00`
    );

    const duration = 20 + (i % 4) * 10;
    const endTime = new Date(
      startTime.getTime() + duration * 60 * 1000
    );

    await prisma.activity.create({
      data: {
        userId: user.id,
        activityName: `Job Application ${i + 1}`,
        activityTypeId: applicationType.id,
        startTime,
        endTime,
        duration,
        description:
          "[DEMO-CALENDAR] Portfolio dashboard job application activity",
      },
    });
  }

  console.log(`✅ Seeded ${demoDates.length} calendar activities`);
  console.log(`2026: ${dates2026.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
