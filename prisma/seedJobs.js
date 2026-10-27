const SEED_EMAIL = process.env.DEMO_USER_EMAIL || process.env.USER_EMAIL;
if (!SEED_EMAIL) throw new Error("Set DEMO_USER_EMAIL explicitly for demo seeding");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
async function ensureLocation(data) {
  return (await prisma.location.findFirst({ where: { value: data.value, createdBy: data.createdBy } })) || prisma.location.create({ data });
}

async function seedJobs() {
  try {
    // Get the admin user
    const user = await prisma.user.findUnique({
      where: { email: SEED_EMAIL },
    });

    if (!user) {
      console.error("User not found. Please run the main seed first.");
      return;
    }

    console.log("Found user:", user.email);
    await prisma.job.deleteMany({ where: { userId: user.id, OR: [{ jobUrl: { startsWith: "https://demo.jobsync.local/" } }, ...(process.env.DEMO_USER_EMAIL ? [{ createdAt: { lt: new Date("2026-01-01") } }] : [])] } });

    // Get the resume we created earlier
    const profile = await prisma.profile.findFirst({
      where: { userId: user.id },
    });

    const resume = profile
      ? await prisma.resume.findFirst({
          where: { profileId: profile.id },
        })
      : null;

    // Get all statuses
    const statuses = await prisma.jobStatus.findMany();
    const draftStatus = statuses.find((s) => s.value === "draft");
    const appliedStatus = statuses.find((s) => s.value === "applied");
    const interviewStatus = statuses.find((s) => s.value === "interview");
    const offerStatus = statuses.find((s) => s.value === "offer");
    const rejectedStatus = statuses.find((s) => s.value === "rejected");

    // Get job sources
    const linkedinSource = await prisma.jobSource.findUnique({
      where: { value: "linkedin" },
    });
    const indeedSource = await prisma.jobSource.findUnique({
      where: { value: "indeed" },
    });
    const careerPageSource = await prisma.jobSource.findUnique({
      where: { value: "careerpage" },
    });

    // Create additional companies
    const googleCompany = await prisma.company.upsert({
      where: { value: "google" },
      update: {},
      create: {
        label: "Google",
        value: "google",
        createdBy: user.id,
      },
    });

    const amazonCompany = await prisma.company.upsert({
      where: { value: "amazon" },
      update: {},
      create: {
        label: "Amazon",
        value: "amazon",
        createdBy: user.id,
      },
    });

    const microsoftCompany = await prisma.company.upsert({
      where: { value: "microsoft" },
      update: {},
      create: {
        label: "Microsoft",
        value: "microsoft",
        createdBy: user.id,
      },
    });

    const metaCompany = await prisma.company.upsert({
      where: { value: "meta" },
      update: {},
      create: {
        label: "Meta",
        value: "meta",
        createdBy: user.id,
      },
    });

    const netflixCompany = await prisma.company.upsert({
      where: { value: "netflix" },
      update: {},
      create: {
        label: "Netflix",
        value: "netflix",
        createdBy: user.id,
      },
    });

    const stripeCompany = await prisma.company.upsert({
      where: { value: "stripe" },
      update: {},
      create: {
        label: "Stripe",
        value: "stripe",
        createdBy: user.id,
      },
    });

    const airbnbCompany = await prisma.company.upsert({
      where: { value: "airbnb" },
      update: {},
      create: {
        label: "Airbnb",
        value: "airbnb",
        createdBy: user.id,
      },
    });

    const shopifyCompany = await prisma.company.upsert({
      where: { value: "shopify" },
      update: {},
      create: {
        label: "Shopify",
        value: "shopify",
        createdBy: user.id,
      },
    });

    // Get existing companies from resume
    const fournineCompany = await prisma.company.findUnique({
      where: { value: "fournine-cloud-solutions" },
    });

    const kaarCompany = await prisma.company.findUnique({
      where: { value: "kaar-technologies" },
    });

    // Create additional job titles
    const seniorFullStackTitle = await prisma.jobTitle.upsert({
      where: { value: "senior-full-stack-engineer" },
      update: {},
      create: {
        label: "Senior Full Stack Engineer",
        value: "senior-full-stack-engineer",
        createdBy: user.id,
      },
    });

    const backendEngineerTitle = await prisma.jobTitle.upsert({
      where: { value: "backend-engineer" },
      update: {},
      create: {
        label: "Backend Engineer",
        value: "backend-engineer",
        createdBy: user.id,
      },
    });

    const frontendEngineerTitle = await prisma.jobTitle.upsert({
      where: { value: "frontend-engineer" },
      update: {},
      create: {
        label: "Frontend Engineer",
        value: "frontend-engineer",
        createdBy: user.id,
      },
    });

    const cloudEngineerTitle = await prisma.jobTitle.upsert({
      where: { value: "cloud-engineer" },
      update: {},
      create: {
        label: "Cloud Engineer",
        value: "cloud-engineer",
        createdBy: user.id,
      },
    });

    const devopsEngineerTitle = await prisma.jobTitle.upsert({
      where: { value: "devops-engineer" },
      update: {},
      create: {
        label: "DevOps Engineer",
        value: "devops-engineer",
        createdBy: user.id,
      },
    });

    const reactDeveloperTitle = await prisma.jobTitle.upsert({
      where: { value: "react-developer" },
      update: {},
      create: {
        label: "React Developer",
        value: "react-developer",
        createdBy: user.id,
      },
    });

    const goEngineerTitle = await prisma.jobTitle.upsert({
      where: { value: "golang-engineer" },
      update: {},
      create: {
        label: "Golang Engineer",
        value: "golang-engineer",
        createdBy: user.id,
      },
    });

    const fullStackTitle = await prisma.jobTitle.upsert({
  where: { value: "full-stack-engineer" },
  update: {},
  create: {
    label: "Full Stack Engineer",
    value: "full-stack-engineer",
    createdBy: user.id,
  },
});

const pythonDevTitle = await prisma.jobTitle.upsert({
  where: { value: "python-developer" },
  update: {},
  create: {
    label: "Python Developer",
    value: "python-developer",
    createdBy: user.id,
  },
});

    // Create additional locations idempotently
    const bangaloreLocation = await ensureLocation({
        label: "Bangalore, India",
        value: "bangalore-india",
        stateProv: "Karnataka",
        country: "India",
        createdBy: user.id,
    });

    const puneLocation = await ensureLocation({
        label: "Pune, India",
        value: "pune-india",
        stateProv: "Maharashtra",
        country: "India",
        createdBy: user.id,
    });

    const remoteLocation = await ensureLocation({
        label: "Remote",
        value: "remote",
        country: "Remote",
        createdBy: user.id,
    });

    const sanFranciscoLocation = await ensureLocation({
        label: "San Francisco, CA",
        value: "san-francisco-ca",
        stateProv: "California",
        country: "USA",
        createdBy: user.id,
    });

    const seattleLocation = await ensureLocation({
        label: "Seattle, WA",
        value: "seattle-wa",
        stateProv: "Washington",
        country: "USA",
        createdBy: user.id,
    });

    if (process.env.DEMO_USER_EMAIL) {
      for (const company of [
        ["Atlassian", "atlassian"], ["HubSpot", "hubspot"], ["Datadog", "datadog"], ["Snowflake", "snowflake"], ["Cloudflare", "cloudflare"], ["ServiceNow", "servicenow"], ["Vertex Systems", "vertex-systems"], ["Northstar Analytics", "northstar-analytics"],
      ]) await prisma.company.upsert({ where: { value: company[1] }, update: { label: company[0] }, create: { label: company[0], value: company[1], createdBy: user.id } });
      for (const title of [
        ["Software Engineer", "software-engineer"], ["Java Developer", "java-developer"], ["AI Engineer", "ai-engineer"],
        ["Machine Learning Engineer", "machine-learning-engineer"], ["Data Analyst", "data-analyst"], ["Senior Software Engineer", "senior-software-engineer"],
      ]) await prisma.jobTitle.upsert({ where: { value: title[1] }, update: { label: title[0] }, create: { label: title[0], value: title[1], createdBy: user.id } });
      for (const location of [
        ["Dallas, TX", "dallas-tx", "Texas", "USA"], ["Austin, TX", "austin-tx", "Texas", "USA"],
        ["New York, NY", "new-york-ny", "New York", "USA"], ["Boston, MA", "boston-ma", "Massachusetts", "USA"],
        ["Chicago, IL", "chicago-il", "Illinois", "USA"],
      ]) await ensureLocation({ label: location[0], value: location[1], stateProv: location[2], country: location[3], createdBy: user.id });
    }

    const hyderabadLocation = await prisma.location.findFirst({
      where: { value: "hyderabad-india" },
    });

    // Create sample jobs
    const jobs = [
      {
        jobUrl: "https://careers.google.com/jobs/123",
        description: `We are looking for a Senior Full Stack Engineer to join our Cloud Platform team. You will be responsible for designing and developing scalable web applications using modern technologies.

Key Responsibilities:
• Build and maintain microservices using Go and Python
• Design responsive UIs with React and TypeScript
• Work with GCP services (Cloud Run, Cloud Functions, BigQuery)
• Implement CI/CD pipelines and containerization with Docker/Kubernetes
• Collaborate with cross-functional teams

Requirements:
• 4+ years of experience in full stack development
• Strong proficiency in Golang, Python, and React
• Experience with cloud platforms (GCP/AWS)
• Knowledge of DevOps practices and tools`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-10"),
        applied: true,
        appliedDate: new Date("2024-12-11"),
        statusId: interviewStatus.id,
        jobTitleId: seniorFullStackTitle.id,
        companyId: googleCompany.id,
        jobSourceId: linkedinSource?.id,
        salaryRange: "$140,000 - $180,000",
        locationId: sanFranciscoLocation.id,
        resumeId: resume?.id,
      },
      {
        jobUrl: "https://amazon.jobs/en/jobs/234",
        description: `Amazon Web Services (AWS) is seeking a Backend Engineer to work on high-scale distributed systems.

Responsibilities:
• Design and implement scalable backend services
• Optimize database queries and improve system performance
• Build RESTful APIs and gRPC services
• Work with DynamoDB, PostgreSQL, and other AWS services
• Participate in code reviews and architectural discussions

Qualifications:
• 3+ years of backend development experience
• Proficiency in Python or Golang
• Strong understanding of distributed systems
• Experience with AWS services`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-08"),
        applied: true,
        appliedDate: new Date("2024-12-09"),
        statusId: appliedStatus.id,
        jobTitleId: backendEngineerTitle.id,
        companyId: amazonCompany.id,
        jobSourceId: careerPageSource?.id,
        salaryRange: "$130,000 - $170,000",
        locationId: seattleLocation.id,
        resumeId: resume?.id,
      },
      {
        jobUrl: "https://jobs.netflix.com/jobs/345",
        description: `Netflix is hiring a DevOps Engineer to help build and maintain our streaming infrastructure.

What you'll do:
• Build and maintain CI/CD pipelines
• Manage Kubernetes clusters at scale
• Implement monitoring and alerting with Prometheus/Grafana
• Automate infrastructure with Terraform and Python
• Ensure high availability and disaster recovery

What we're looking for:
• 4+ years of DevOps/SRE experience
• Expert knowledge of Kubernetes and Docker
• Experience with cloud platforms (AWS/GCP)
• Strong scripting skills (Python, Bash)
• Experience with monitoring tools`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-05"),
        applied: true,
        appliedDate: new Date("2024-12-06"),
        statusId: rejectedStatus.id,
        jobTitleId: devopsEngineerTitle.id,
        companyId: netflixCompany.id,
        jobSourceId: linkedinSource?.id,
        salaryRange: "$150,000 - $200,000",
        locationId: remoteLocation.id,
      },
      {
        jobUrl: "https://stripe.com/jobs/456",
        description: `Stripe is looking for a Frontend Engineer to build beautiful, accessible user interfaces.

You will:
• Build responsive web applications with React and TypeScript
• Collaborate with designers to implement pixel-perfect UIs
• Optimize application performance
• Write comprehensive tests
• Contribute to our design system

Requirements:
• 3+ years of frontend development experience
• Expert knowledge of React and TypeScript
• Strong CSS skills and attention to detail
• Experience with modern build tools (Webpack, Vite)`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-12"),
        applied: false,
        statusId: draftStatus.id,
        jobTitleId: frontendEngineerTitle.id,
        companyId: stripeCompany.id,
        jobSourceId: careerPageSource?.id,
        salaryRange: "$120,000 - $160,000",
        locationId: remoteLocation.id,
      },
      {
        jobUrl: "https://careers.microsoft.com/jobs/567",
        description: `Microsoft Azure team is seeking a Cloud Engineer to work on our cloud infrastructure.

Responsibilities:
• Design and implement cloud-native solutions on Azure
• Migrate on-premise applications to cloud
• Optimize cloud costs and performance
• Implement security best practices
• Build automation tools with Python and PowerShell

Requirements:
• 4+ years of cloud engineering experience
• Azure or GCP certification preferred
• Strong knowledge of cloud architecture patterns
• Experience with IaC (Terraform, ARM templates)`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-07"),
        applied: true,
        appliedDate: new Date("2024-12-08"),
        statusId: offerStatus.id,
        jobTitleId: cloudEngineerTitle.id,
        companyId: microsoftCompany.id,
        jobSourceId: linkedinSource?.id,
        salaryRange: "$135,000 - $175,000",
        locationId: remoteLocation.id,
        resumeId: resume?.id,
      },
      {
        jobUrl: "https://meta.com/careers/678",
        description: `Meta is hiring a Full Stack Engineer to work on our internal developer tools.

What you'll do:
• Build developer productivity tools
• Work with React, Python, and GraphQL
• Design and implement APIs
• Collaborate with engineering teams across Meta
• Improve developer experience

Preferred Qualifications:
• 3+ years of full stack development
• Experience with React and Python
• Knowledge of GraphQL
• Strong problem-solving skills`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-09"),
        applied: false,
        statusId: draftStatus.id,
        jobTitleId: fullStackTitle?.id,
        companyId: metaCompany.id,
        jobSourceId: indeedSource?.id,
        salaryRange: "$145,000 - $190,000",
        locationId: remoteLocation.id,
      },
      {
        jobUrl: "https://airbnb.com/careers/789",
        description: `Airbnb is seeking a React Developer for our host platform team.

Role:
• Build features for our host dashboard
• Work with React, TypeScript, and Next.js
• Collaborate with product and design teams
• Ensure code quality through testing
• Mentor junior developers

Qualifications:
• 4+ years of React development
• Expert in TypeScript and modern JavaScript
• Experience with Next.js or similar frameworks
• Strong testing skills (Jest, React Testing Library)`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-11"),
        applied: true,
        appliedDate: new Date("2024-12-12"),
        dueDate: new Date("2024-12-20"),
        statusId: appliedStatus.id,
        jobTitleId: reactDeveloperTitle.id,
        companyId: airbnbCompany.id,
        jobSourceId: careerPageSource?.id,
        salaryRange: "$125,000 - $165,000",
        locationId: sanFranciscoLocation.id,
        resumeId: resume?.id,
      },
      {
        jobUrl: "https://shopify.com/careers/890",
        description: `Shopify is looking for a Golang Engineer to work on our backend infrastructure.

Responsibilities:
• Build high-performance microservices in Go
• Design scalable distributed systems
• Optimize database performance
• Implement gRPC services
• Work with Kubernetes and Docker

Requirements:
• 3+ years of Go development experience
• Strong understanding of concurrency patterns
• Experience with microservices architecture
• Knowledge of database optimization (PostgreSQL, Redis)`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-06"),
        applied: false,
        statusId: draftStatus.id,
        jobTitleId: goEngineerTitle.id,
        companyId: shopifyCompany.id,
        jobSourceId: linkedinSource?.id,
        salaryRange: "$130,000 - $170,000",
        locationId: remoteLocation.id,
      },
      {
        jobUrl: null,
        description: `We are looking for a Python Developer to join our data platform team.

Key Responsibilities:
• Develop data processing pipelines
• Work with Django and FastAPI
• Build RESTful APIs
• Integrate with various databases
• Write clean, maintainable code

Requirements:
• 2+ years of Python development
• Experience with Django or Flask
• Knowledge of SQL databases
• Familiarity with cloud platforms`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-13"),
        applied: false,
        dueDate: new Date("2024-12-25"),
        statusId: draftStatus.id,
        jobTitleId: pythonDevTitle?.id,
        companyId: fournineCompany?.id,
        jobSourceId: indeedSource?.id,
        salaryRange: "₹15,00,000 - ₹25,00,000",
        locationId: hyderabadLocation?.id,
      },
      {
        jobUrl: "https://linkedin.com/jobs/901",
        description: `Seeking a Full Stack Engineer for our SaaS product team.

Responsibilities:
• Develop features end-to-end
• Work with React, Node.js, and Python
• Design database schemas
• Implement authentication and authorization
• Deploy and monitor applications

Qualifications:
• 3+ years of full stack experience
• Proficiency in React and backend frameworks
• Experience with cloud deployments
• Good communication skills`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-04"),
        applied: true,
        appliedDate: new Date("2024-12-05"),
        statusId: rejectedStatus.id,
        jobTitleId: fullStackTitle?.id,
        companyId: kaarCompany?.id,
        jobSourceId: linkedinSource?.id,
        salaryRange: "₹12,00,000 - ₹20,00,000",
        locationId: bangaloreLocation.id,
      },
      {
        jobUrl: "https://indeed.com/jobs/012",
        description: `Looking for a Senior Backend Engineer to scale our platform.

What you'll do:
• Design scalable backend architecture
• Optimize API performance
• Work with microservices
• Lead technical discussions
• Mentor team members

Requirements:
• 5+ years of backend development
• Expert in Python or Go
• Strong system design skills
• Experience with high-traffic applications`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-03"),
        applied: false,
        statusId: draftStatus.id,
        jobTitleId: backendEngineerTitle.id,
        companyId: shopifyCompany.id,
        jobSourceId: indeedSource?.id,
        salaryRange: "$140,000 - $180,000",
        locationId: remoteLocation.id,
      },
      {
        jobUrl: "https://startup.com/careers/123",
        description: `Early-stage startup looking for a Full Stack Engineer to be one of our first hires.

Role:
• Build our MVP from scratch
• Make key technical decisions
• Work across the entire stack
• Shape product and engineering culture
• Wear multiple hats

Looking for:
• 3+ years of development experience
• Startup mindset and adaptability
• Strong coding skills in JavaScript/Python
• Willingness to learn and grow`,
        jobType: "Full-time",
        createdAt: new Date("2024-12-14"),
        applied: false,
        dueDate: new Date("2024-12-30"),
        statusId: draftStatus.id,
        jobTitleId: fullStackTitle?.id,
        companyId: fournineCompany?.id,
        jobSourceId: careerPageSource?.id,
        salaryRange: "₹10,00,000 - ₹18,00,000 + Equity",
        locationId: puneLocation.id,
      },
    ];

    if (process.env.DEMO_USER_EMAIL) {
      const extraJobs = [
        ["AI Engineer", "Atlassian", "Seattle, WA", "interview", 2026, 1],
        ["Machine Learning Engineer", "Snowflake", "Remote", "applied", 2026, 2],
        ["Data Analyst", "HubSpot", "Boston, MA", "draft", 2026, 3],
        ["Business Intelligence Analyst", "Datadog", "New York, NY", "rejected", 2026, 4],
        ["Technical Program Manager", "Cloudflare", "Austin, TX", "offer", 2026, 5],
        ["Senior Software Engineer", "ServiceNow", "Dallas, TX", "applied", 2026, 6],
        ["Software Engineer", "Vertex Systems", "Chicago, IL", "draft", 2026, 7],
        ["Platform Engineer", "Northstar Analytics", "Denver, CO", "interview", 2026, 8],
      ];
      const companyByValue = await prisma.company.findMany({ where: { createdBy: user.id } });
      const titleByValue = await prisma.jobTitle.findMany({ where: { createdBy: user.id } });
      const locationByValue = await prisma.location.findMany({ where: { createdBy: user.id } });
      const statusByValue = Object.fromEntries(statuses.map((item) => [item.value, item]));
      for (const [title, company, location, status, year, month] of extraJobs) {
        const titleRecord = titleByValue.find((item) => item.label === title);
        const companyRecord = companyByValue.find((item) => item.label === company);
        const locationRecord = locationByValue.find((item) => item.label === location);
        if (!titleRecord || !companyRecord || !locationRecord) continue;
        jobs.push({
          jobUrl: `https://demo.jobsync.local/extra-${String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${month}`,
          description: `${title} opportunity focused on dependable delivery, cross-functional collaboration, and measurable product outcomes.\n\nRequirements:\n• Strong software engineering fundamentals\n• Experience collaborating across teams\n• Clear communication and practical problem solving`,
          jobType: "Full-time", createdAt: new Date(`${year}-${String(month).padStart(2, "0")}-15`),
          applied: ["applied", "interview", "offer"].includes(status),
          appliedDate: ["applied", "interview", "offer"].includes(status) ? new Date(`${year}-${String(month).padStart(2, "0")}-18`) : null,
          statusId: statusByValue[status].id, jobTitleId: titleRecord.id, companyId: companyRecord.id,
          jobSourceId: linkedinSource?.id, salaryRange: "$95,000 - $165,000", locationId: locationRecord.id, resumeId: resume?.id,
        });
      }
    }

    // Create all jobs
    let createdCount = 0;
    for (const jobData of jobs) {
      const seededJob = { ...jobData };
      if (seededJob.applied) {
        const recentDate = new Date(`2026-10-${String(20 + (createdCount % 7)).padStart(2, "0")}T10:00:00`);
        seededJob.createdAt = recentDate;
        seededJob.appliedDate = recentDate;
      }
      await prisma.job.create({
        data: {
          ...seededJob,
          jobUrl: `https://demo.jobsync.local/${jobData.jobUrl ? jobData.jobUrl.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase() : `job-${createdCount + 1}`}`,
          userId: user.id,
        },
      });
      createdCount++;
    }

    console.log(`✅ Successfully created ${createdCount} job postings!`);
    console.log("Job Status Summary:");
    console.log(
      `  - Draft: ${jobs.filter((j) => j.statusId === draftStatus.id).length}`
    );
    console.log(
      `  - Applied: ${
        jobs.filter((j) => j.statusId === appliedStatus.id).length
      }`
    );
    console.log(
      `  - Interview: ${
        jobs.filter((j) => j.statusId === interviewStatus.id).length
      }`
    );
    console.log(
      `  - Offer: ${jobs.filter((j) => j.statusId === offerStatus.id).length}`
    );
    console.log(
      `  - Rejected: ${
        jobs.filter((j) => j.statusId === rejectedStatus.id).length
      }`
    );
  } catch (error) {
    console.error("❌ Error seeding jobs:", error);
    throw error;
  }
}

async function main() {
  await seedJobs();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
