import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mlService } from "@/lib/mlService";
import { recommendCoursesSchema } from "@/models/ml.schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const parsed = recommendCoursesSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { missingSkills, topN } = parsed.data;
    if (missingSkills.length === 0) {
      return NextResponse.json({ success: true, courses: [], count: 0 });
    }
    const result = await mlService.recommendCourses(missingSkills, topN);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to recommend courses", error);
    return NextResponse.json({ error: "Failed to recommend courses" }, { status: 500 });
  }
}
