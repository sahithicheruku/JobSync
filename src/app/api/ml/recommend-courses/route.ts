import { NextRequest, NextResponse } from "next/server";
import { mlService } from "@/lib/mlService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { missingSkills, topN = 10 } = body;

    if (!missingSkills || !Array.isArray(missingSkills)) {
      return NextResponse.json(
        { error: "Missing skills array is required" },
        { status: 400 }
      );
    }

    if (missingSkills.length === 0) {
      return NextResponse.json({
        success: true,
        courses: [],
        count: 0,
        message: "No missing skills provided"
      });
    }

    const recommendations = await mlService.recommendCourses(missingSkills, topN);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error in recommend-courses API:", error);
    return NextResponse.json(
      { error: "Failed to recommend courses", details: String(error) },
      { status: 500 }
    );
  }
}
