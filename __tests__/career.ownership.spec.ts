/** @jest-environment node */
import { loadDocuments } from "@/lib/career/analysis";
import prisma from "@/lib/db";
jest.mock("server-only", () => ({}));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({ __esModule: true, default: { resume: { findFirst: jest.fn() }, job: { findFirst: jest.fn() } } }));
it("cannot read a resume owned by another account", async () => {
  (prisma.resume.findFirst as jest.Mock).mockResolvedValue(null);
  await expect(loadDocuments("owner", "foreign-resume")).rejects.toMatchObject({ status: 404 });
  expect(prisma.resume.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "foreign-resume", profile: { userId: "owner" } } }));
  expect(prisma.job.findFirst).not.toHaveBeenCalled();
});
