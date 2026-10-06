import { NextResponse } from "next/server";
import prisma from "@/lib/db";
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "UP" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "DOWN" }, { status: 503 });
  }
}
