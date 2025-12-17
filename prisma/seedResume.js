const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedResume() {
  try {
    // Get the admin user
    const user = await prisma.user.findUnique({
      where: { email: process.env.USER_EMAIL || "admin@example.com" },
    });

    if (!user) {
      console.error("User not found. Please run the main seed first.");
      return;
    }

    console.log("Found user:", user.email);

    // Check if profile exists, create if not
    let profile = await prisma.profile.findFirst({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
        },
      });
      console.log("Created profile for user");
    } else {
      console.log("Profile already exists");
    }

    // Check if resume already exists
    const existingResume = await prisma.resume.findFirst({
      where: {
        profileId: profile.id,
        title: "Praveen Potnuri - Full Stack Developer",
      },
    });

    if (existingResume) {
      console.log("Resume already exists. Skipping...");
      return;
    }

    // Create Companies
    const fournineCompany = await prisma.company.upsert({
      where: { value: "fournine-cloud-solutions" },
      update: {},
      create: {
        label: "Fournine Cloud Solutions",
        value: "fournine-cloud-solutions",
        createdBy: user.id,
      },
    });

    const kaarCompany = await prisma.company.upsert({
      where: { value: "kaar-technologies" },
      update: {},
      create: {
        label: "Kaar Technologies",
        value: "kaar-technologies",
        createdBy: user.id,
      },
    });

    // Create Job Titles
    const fullStackEngTitle = await prisma.jobTitle.upsert({
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

    // Create Locations
    const hyderabadLocation = await prisma.location.create({
      data: {
        label: "Hyderabad, India",
        value: "hyderabad-india",
        stateProv: "Telangana",
        country: "India",
        createdBy: user.id,
      },
    });

    const chennaiLocation = await prisma.location.create({
      data: {
        label: "Chennai, India",
        value: "chennai-india",
        stateProv: "Tamil Nadu",
        country: "India",
        createdBy: user.id,
      },
    });

    // Create Summary
    const summary = await prisma.summary.create({
      data: {
        content:
          "Innovative Full Stack Developer with a strong background in backend and cloud-based development, specializing in Golang and Python. Proven track record of designing and implementing robust, user-friendly applications, building scalable microservices, and automating critical workflows.",
      },
    });

    // Create Resume with all sections
    const resume = await prisma.resume.create({
      data: {
        profileId: profile.id,
        title: "Praveen Potnuri - Full Stack Developer",
        ContactInfo: {
          create: {
            firstName: "Praveen",
            lastName: "Potnuri",
            headline: "Full Stack Developer",
            email: "potnuripraveen284@gmail.com",
            phone: "+91 9959301876",
            address: "Hyderabad, India",
          },
        },
        ResumeSections: {
          create: [
            // Summary Section
            {
              sectionTitle: "Professional Summary",
              sectionType: "summary",
              summaryId: summary.id,
            },
            // Work Experience Section
            {
              sectionTitle: "Work Experience",
              sectionType: "experience",
              workExperiences: {
                create: [
                  {
                    companyId: fournineCompany.id,
                    jobTitleId: fullStackEngTitle.id,
                    locationId: hyderabadLocation.id,
                    startDate: new Date("2022-05-01"),
                    description: `• Developed an end-to-end in-house product, DbSAM (Database Secure Access Management), using Django and React, enabling secure and streamlined access to internal cloud-hosted databases. The system supports over 200 active users.
• Designed and implemented scalable backend systems with Django, leveraging Django REST Framework for robust API development, Celery for asynchronous task processing, and modular app architecture for maintainability.
• Built a user management web application for DbSAM using Django (with Django REST Framework and Django ORM) and React, delivering secure API endpoint routing, database interactions, and a dynamic, user-friendly frontend interface.
• Implemented role-based access control (RBAC) by designing custom middleware in Django, utilizing JWT (via djangorestframework-simplejwt) for authentication and extending role and permission management using Django's built-in permissions framework and custom decorators.
• Using Jenkins and GitHub Actions, automating testing, containerization, and deployment of DbSAM services. Reduced manual intervention in deployments by 90%, ensuring faster feature releases.
• Migrated report monitoring systems from MySQL to BigQuery by developing cloud functions in Python, ensuring seamless data transformation and integration.
• Automated environment setup and deployment pipelines using Python scripts and Django management commands to ensure consistent and error-free deployments, cutting onboarding time for new developers by 30%.
• Implemented Prometheus and Grafana dashboards to monitor Kubernetes clusters and DbSAM's microservices. Optimized resource utilization by tuning pod configurations, reducing cloud costs by 20%.
• Migrated the production app from server to serverless using AWS Amplify and AWS Lambda.
• Developed GCP cloud functions to generate reports from BigQuery and GCP Buckets.`,
                  },
                  {
                    companyId: kaarCompany.id,
                    jobTitleId: pythonDevTitle.id,
                    locationId: chennaiLocation.id,
                    startDate: new Date("2021-08-01"),
                    endDate: new Date("2022-04-30"),
                    description: `• Built a high-performance API gateway in Golang to handle concurrent SAP system requests from the Python chatbot, utilizing goroutines and channels to process 500+ simultaneous API calls with sub-100ms response times.
• Automated asynchronous data transfer job tracking using Python with AWS AppFlow, employing error handling, logging frameworks, and event-driven programming, reducing issue resolution time to under 5 minutes.
• Developed a Golang-based message queue consumer to process SAP webhook events in real-time, handling data transformation and routing to appropriate Python services for business logic processing.
• Created Golang workers for batch processing SAP reports, enabling parallel data extraction and transformation that reduced report generation time from 2 hours to 15 minutes compared to Python-only implementation.
• Performed testing and debugging using advanced Python testing tools like pytest and unittest, ensuring high code quality and reliability across the hybrid Python-Golang architecture.
• Designed and developed a chatbot using Python, leveraging advanced concepts such as object-oriented programming (OOP), multi-threading, and asynchronous programming to integrate with SAP systems and cloud platforms seamlessly.
• Implemented RESTful APIs using Python libraries such as requests, json, and pandas for robust backend development, while developing Golang microservices for real-time data synchronization between SAP modules and external cloud services.`,
                  },
                ],
              },
            },
            // Education Section
            {
              sectionTitle: "Education",
              sectionType: "education",
              educations: {
                create: [
                  {
                    institution: "Sathyabama Institute of Science and Technology",
                    degree: "Bachelor of Technology (B.Tech.)",
                    fieldOfStudy: "Computer Science",
                    locationId: chennaiLocation.id,
                    startDate: new Date("2017-07-01"),
                    endDate: new Date("2021-05-31"),
                    description: "CGPA: 9.04",
                  },
                ],
              },
            },
            // Skills Section
            {
              sectionTitle: "Skills",
              sectionType: "other",
              others: {
                create: [
                  {
                    title: "Languages & Frameworks",
                    content:
                      "Golang, Python, React, JavaScript, TypeScript, GIN, Django, Flask API, Gen AI",
                  },
                  {
                    title: "Development",
                    content:
                      "RESTful API, gRPC, Error Handling, Go Modules, Goroutines, Testing",
                  },
                  {
                    title: "DevOps & Cloud",
                    content:
                      "GCP, AWS (EC2, LAMBDA, API GATEWAY, AMPLIFY, ECS/EKS), Docker, Kubernetes, CI/CD, Prometheus, Grafana",
                  },
                  {
                    title: "Databases",
                    content: "MySQL, PostgreSQL, DynamoDB, MongoDB",
                  },
                  {
                    title: "Other",
                    content: "Linux, Bash, Scripting, Automation, Logging and Monitoring",
                  },
                ],
              },
            },
            // Certifications Section
            {
              sectionTitle: "Certifications",
              sectionType: "certification",
              licenseOrCertifications: {
                create: [
                  {
                    title: "Professional GCP Cloud Architect Certification",
                    organization: "Google Cloud Platform",
                    issueDate: new Date("2023-05-02"),
                    expirationDate: new Date("2026-05-02"),
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        ContactInfo: true,
        ResumeSections: {
          include: {
            summary: true,
            workExperiences: true,
            educations: true,
            licenseOrCertifications: true,
            others: true,
          },
        },
      },
    });

    console.log("✅ Resume seeded successfully!");
    console.log(`Resume ID: ${resume.id}`);
    console.log(`Resume Title: ${resume.title}`);
    console.log(`Total Sections: ${resume.ResumeSections.length}`);
  } catch (error) {
    console.error("❌ Error seeding resume:", error);
    throw error;
  }
}

async function main() {
  await seedResume();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
