jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { $queryRaw: jest.fn() },
}));
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

import prisma from "@/lib/db";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("reports the backend as UP when the database is reachable", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([{ ok: 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "UP" });
  });

  it("reports the backend as DOWN when the database is unavailable", async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error("db unavailable"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "DOWN" });
  });
});
