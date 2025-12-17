import { NextRequest, NextResponse } from "next/server";
import { mlService } from "@/lib/mlService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription, resumeSkills, topN = 10 } = body;

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    if (!resumeSkills || !Array.isArray(resumeSkills)) {
      return NextResponse.json(
        { error: "Resume skills array is required" },
        { status: 400 }
      );
    }

    const analysis = await mlService.analyzeJob(
      jobDescription,
      resumeSkills,
      topN
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error in analyze-job API:", error);
    return NextResponse.json(
      { error: "Failed to analyze job", details: String(error) },
      { status: 500 }
    );
  }
}
