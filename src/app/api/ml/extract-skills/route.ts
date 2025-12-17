import { NextRequest, NextResponse } from "next/server";
import { mlService } from "@/lib/mlService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const result = await mlService.extractSkills(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in extract-skills API:", error);
    return NextResponse.json(
      { error: "Failed to extract skills", details: String(error) },
      { status: 500 }
    );
  }
}
