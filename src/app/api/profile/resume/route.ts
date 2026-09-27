import { NextRequest, NextResponse } from "next/server";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import prisma from "@/lib/db";
import { apiError, ApiError, requireUser } from "@/lib/career/http";
const storageRoot = () => path.resolve(process.env.NODE_ENV === "production" ? "/data/files/resumes" : "data/files/resumes");
export async function POST(req: NextRequest) {
  let written: string | undefined;
  try {
    const userId = await requireUser();
    if (Number(req.headers.get("content-length")) > 11 * 1024 * 1024) throw new ApiError(413, "Upload exceeds 10 MB.");
    const form = await req.formData();
    const title = String(form.get("title") || "").trim();
    const id = String(form.get("id") || "");
    if (!title || title.length > 200) throw new ApiError(400, "Provide a title under 200 characters.");
    const existing = id ? await prisma.resume.findFirst({ where: { id, profile: { userId } }, include: { File: true } }) : null;
    if (id && !existing) throw new ApiError(404, "Resume not found.");
    const file = form.get("file");
    let upload: { fileName: string; filePath: string; fileType: string } | undefined;
    if (file instanceof File && file.size) {
      if (file.size > 10 * 1024 * 1024) throw new ApiError(413, "Upload exceeds 10 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (new TextDecoder().decode(bytes.slice(0,4)) !== "%PDF") throw new ApiError(400, "Upload a PDF resume.");
      await mkdir(storageRoot(), { recursive: true });
      written = path.join(storageRoot(), `${randomUUID()}.pdf`);
      await writeFile(written, bytes, { flag: "wx", mode: 0o600 });
      upload = { fileName: path.basename(file.name).slice(0,200), filePath: written, fileType: "resume" };
    }
    const resume = await prisma.$transaction(async tx => {
      if (existing) return tx.resume.update({ where: { id: existing.id, profile: { userId } }, data: { title, ...(upload ? { File: { create: upload } } : {}) } });
      let profile = await tx.profile.findFirst({ where: { userId } });
      if (!profile) profile = await tx.profile.create({ data: { userId } });
      return tx.resume.create({ data: { title, profile: { connect: { id: profile.id } }, ...(upload ? { File: { create: upload } } : {}) } });
    });
    written = undefined; // Keep committed upload even if old-file cleanup fails.
    if (upload && existing?.File) {
      const oldPath = path.resolve(existing.File.filePath);
      if (oldPath.startsWith(storageRoot() + path.sep)) await unlink(oldPath).catch(() => undefined);
      await prisma.file.delete({ where: { id: existing.File.id } }).catch(() => undefined);
    }
    return NextResponse.json({ success: true, data: resume }, { status: existing ? 200 : 201 });
  } catch (error) { if (written) await unlink(written).catch(() => undefined); return apiError(error); }
}
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser();
    const requested = req.nextUrl.searchParams.get("filePath");
    if (!requested) throw new ApiError(400, "File path is required.");
    const file = await prisma.file.findFirst({ where: { filePath: requested, Resume: { profile: { userId } } } });
    if (!file) throw new ApiError(404, "File not found.");
    const resolved = path.resolve(file.filePath);
    if (!resolved.startsWith(storageRoot() + path.sep)) throw new ApiError(404, "File not found.");
    const contents = await readFile(resolved);
    return new NextResponse(new Uint8Array(contents), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return apiError(error); }
}
