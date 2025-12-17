import { NextRequest, NextResponse } from "next/server";
import { mlService } from "@/lib/mlService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, topN = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const results = await mlService.searchCourses(query, topN);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in search-courses API:", error);
    return NextResponse.json(
      { error: "Failed to search courses", details: String(error) },
      { status: 500 }
    );
  }
}
