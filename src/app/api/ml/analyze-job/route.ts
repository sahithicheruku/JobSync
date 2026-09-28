import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mlService } from "@/lib/mlService";
import { analyzeJobSchema } from "@/models/ml.schema";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  let step = "authentication";

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    step = "request JSON parsing";

    const parsed = analyzeJobSchema.safeParse(
      await request.json().catch(() => null)
    );

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { jobDescription, resumeSkills, topN, jobId } = parsed.data;

    let effectiveResumeSkills = resumeSkills;

    if (effectiveResumeSkills.length === 0) {
      try {
        step = "resume skill extraction";

        const job = jobId
          ? await prisma.job.findFirst({
              where: {
                id: jobId,
                userId: session.user.id,
              },
              select: {
                resumeId: true,
              },
            })
          : null;

        const resume = await prisma.resume.findFirst({
          where: {
            profile: {
              userId: session.user.id,
            },
            ...(job?.resumeId ? { id: job.resumeId } : {}),
          },
          include: {
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
          orderBy: {
            updatedAt: "desc",
          },
        });

        if (resume) {
          const resumeText = resume.ResumeSections.flatMap((section) => [
            section.summary?.content || "",
            ...section.workExperiences.map(
              (item) => item.description || ""
            ),
            ...section.educations.map(
              (item) => item.description || ""
            ),
            ...section.licenseOrCertifications.map(
              (item) => `${item.title} ${item.organization}`
            ),
            ...section.others.map(
              (item) => `${item.title} ${item.content}`
            ),
          ])
            .filter(Boolean)
            .join("\n");

          if (resumeText.trim()) {
            const extracted = await mlService.extractSkills(resumeText);
            effectiveResumeSkills = extracted.skills;
          }
        }
      } catch (resumeError) {
        console.error(
          JSON.stringify({
            event: "resume_skill_extraction_failed",
            step,
            errorType:
              resumeError instanceof Error
                ? resumeError.name
                : "Unknown",
          })
        );
      }
    }

    try {
      step = "FastAPI analyze-job request/response JSON";

      const result = await mlService.analyzeJob(
        jobDescription,
        effectiveResumeSkills,
        topN
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "analyze_fastapi_failed",
          step,
          errorType:
            error instanceof Error ? error.name : "Unknown",
        })
      );

      let recommendations: Array<{
        course: {
          courseName: string;
          provider: string;
          skillsGained: string;
          rating: number | null;
          levelDuration: string | null;
          courseUrl: string;
          courseImage: string | null;
          providerImage: string | null;
        };
        matchScore: number | null;
      }> = [];

      if (jobId) {
        try {
          step = "PostgreSQL fallback job lookup";

          recommendations =
            await prisma.courseRecommendation.findMany({
              where: {
                userId: session.user.id,
                jobId,
              },
              include: {
                course: true,
              },
              orderBy: {
                matchScore: "desc",
              },
              take: topN,
            });
        } catch (fallbackError) {
          console.error(
            JSON.stringify({
              event: "analyze_fallback_failed",
              step,
              errorType:
                fallbackError instanceof Error
                  ? fallbackError.name
                  : "Unknown",
            })
          );
        }
      }

      return NextResponse.json({
        success: true,
        recommended_courses: recommendations.map(
          ({ course, matchScore }) => ({
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
          })
        ),
      });
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "analyze_request_failed",
        step,
        errorType:
          error instanceof Error ? error.name : "Unknown",
      })
    );

    return NextResponse.json(
      { error: "Failed to analyze job" },
      { status: 500 }
    );
  }
}