import prisma from "@/lib/db";
export async function rateLimit(key: string, limit = 12) {
  const now = new Date();
  const bucket = `${key}:${Math.floor(now.getTime() / 60000)}`;
  const record = await prisma.requestLimit.upsert({ where: { key: bucket }, create: { key: bucket, count: 1, expiresAt: new Date(now.getTime() + 120000) }, update: { count: { increment: 1 } } });
  await prisma.requestLimit.deleteMany({ where: { expiresAt: { lt: now } } });
  if (record.count > limit) throw Object.assign(new Error("Too many requests. Try again in a minute."), { status: 429 });
}
