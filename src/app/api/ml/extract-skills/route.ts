import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mlService } from "@/lib/mlService";
import { extractSkillsSchema } from "@/models/ml.schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const parsed = extractSkillsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { text } = parsed.data;
    const result = await mlService.extractSkills(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to extract skills", error);
    return NextResponse.json({ error: "Failed to extract skills" }, { status: 500 });
  }
}
