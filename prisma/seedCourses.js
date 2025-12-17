const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function seedCourses() {
  try {
    console.log("Starting course seeding...");

    // Read the CSV file from ML service (try multiple paths)
    let csvPath = path.join(__dirname, "../ml-service/data/Coursera_Completed_Data.csv");

    // Try alternative paths
    if (!fs.existsSync(csvPath)) {
      csvPath = "/app/Coursera_Completed_Data.csv";
    }
    if (!fs.existsSync(csvPath)) {
      csvPath = path.join(__dirname, "../Coursera_Completed_Data.csv");
    }

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at any expected location`);
      console.log("Please make sure the ML service data files are in place.");
      return;
    }

    console.log(`Using CSV file from: ${csvPath}`);

    // Simple CSV parser (or use a library like csv-parse for production)
    const csvData = fs.readFileSync(csvPath, "utf-8");
    const lines = csvData.split("\n");
    const headers = lines[0].split(",");

    console.log(`Found ${lines.length - 1} courses in CSV`);

    // Check if courses already exist
    const existingCount = await prisma.course.count();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} courses. Skipping seeding.`);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process courses in batches for better performance
    const batchSize = 50;
    const coursesToCreate = [];

    for (let i = 1; i < Math.min(lines.length, 600); i++) { // Limit to 600 courses for now
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV line (handling quoted fields)
        const fields = parseCsvLine(line);

        if (fields.length < 8) continue;

        const courseName = fields[0]?.trim() || "Unknown Course";
        const provider = fields[1]?.trim() || "Unknown Provider";
        const skillsGained = fields[2]?.trim() || "";
        const ratingStr = fields[3]?.trim() || "";
        const levelDuration = fields[4]?.trim() || "";
        const courseImage = fields[5]?.trim() || "";
        const providerImage = fields[6]?.trim() || "";
        const courseUrl = fields[7]?.trim() || "";
        const ratingScore = fields[8]?.trim() || "";

        // Parse rating (handle formats like "4.8 stars" or just "4.8")
        let rating = null;
        if (ratingScore) {
          const match = ratingScore.match(/[\d.]+/);
          if (match) {
            rating = parseFloat(match[0]);
          }
        }

        coursesToCreate.push({
          courseName,
          provider,
          skillsGained,
          rating,
          levelDuration,
          courseUrl,
          courseImage,
          providerImage,
        });

        // Create batch when we reach batch size
        if (coursesToCreate.length >= batchSize) {
          try {
            await prisma.course.createMany({
              data: coursesToCreate,
            });
            successCount += coursesToCreate.length;
            console.log(`Seeded batch of ${coursesToCreate.length} courses...`);
            coursesToCreate.length = 0; // Clear array
          } catch (batchError) {
            console.error(`Error in batch: ${batchError.message}`);
            errorCount += coursesToCreate.length;
            coursesToCreate.length = 0;
          }
        }
      } catch (parseError) {
        console.error(`Error parsing line ${i}: ${parseError.message}`);
        errorCount++;
      }
    }

    // Create remaining courses
    if (coursesToCreate.length > 0) {
      try {
        await prisma.course.createMany({
          data: coursesToCreate,
        });
        successCount += coursesToCreate.length;
        console.log(`Seeded final batch of ${coursesToCreate.length} courses`);
      } catch (batchError) {
        console.error(`Error in final batch: ${batchError.message}`);
        errorCount += coursesToCreate.length;
      }
    }

    console.log("\n✅ Course seeding completed!");
    console.log(`   Successfully seeded: ${successCount} courses`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total courses in database: ${await prisma.course.count()}`);
  } catch (error) {
    console.error("❌ Error seeding courses:", error);
    throw error;
  }
}

// Helper function to parse CSV line handling quoted fields
function parseCsvLine(line) {
  const fields = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }

  fields.push(currentField); // Add last field
  return fields;
}

async function main() {
  await seedCourses();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
