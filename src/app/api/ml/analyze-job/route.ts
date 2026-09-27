import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mlService } from "@/lib/mlService";
import { analyzeJobSchema } from "@/models/ml.schema";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  let step = "authentication";
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    step = "request JSON parsing";
    const parsed = analyzeJobSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { jobDescription, resumeSkills, topN, jobId } = parsed.data;
    try {
      step = "FastAPI analyze-job request/response JSON";
      const result = await mlService.analyzeJob(jobDescription, resumeSkills, topN);
      return NextResponse.json(result);
    } catch (error) {
      console.error(JSON.stringify({ event: "analyze_fastapi_failed", step, errorType: error instanceof Error ? error.name : "Unknown" }));
      let recommendations: Array<{ course: { courseName: string; provider: string; skillsGained: string; rating: number | null; levelDuration: string | null; courseUrl: string; courseImage: string | null; providerImage: string | null }; matchScore: number | null }> = [];
      if (jobId && session.user.id) {
        try {
          step = "PostgreSQL fallback job lookup";
          recommendations = await prisma.courseRecommendation.findMany({
            where: { userId: session.user.id, jobId },
            include: { course: true },
            orderBy: { matchScore: "desc" },
            take: topN,
          });
        } catch (fallbackError) {
          console.error(JSON.stringify({ event: "analyze_fallback_failed", step, errorType: fallbackError instanceof Error ? fallbackError.name : "Unknown" }));
        }
      } else {
        console.error(JSON.stringify({ event: "analyze_fallback_skipped", step: "PostgreSQL fallback job lookup", reason: "missing jobId or authenticated user id" }));
      }

      return NextResponse.json({
        success: true,
        recommended_courses: recommendations.map(({ course, matchScore }) => ({
          course_name: course.courseName,
          provider: course.provider,
          skills_gained: course.skillsGained,
          rating: course.rating,
          level_duration: course.levelDuration || "N/A",
          course_url: course.courseUrl,
          course_image: course.courseImage || "",
          provider_image: course.providerImage || "",
          similarity_score: matchScore || 0,
          match_percentage: (matchScore || 0) * 100,
        })),
      });
    }
  } catch (error) {
    console.error(JSON.stringify({ event: "analyze_request_failed", step, errorType: error instanceof Error ? error.name : "Unknown" }));
    return NextResponse.json({ error: "Failed to analyze job" }, { status: 500 });
  }
}
