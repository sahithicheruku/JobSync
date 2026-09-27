/** @jest-environment node */
import { POST as match } from "@/app/api/ai/resume/match/route";
import { POST as review } from "@/app/api/ai/resume/review/route";
import { auth } from "@/auth";
import { matchResume, reviewResume } from "@/lib/career/analysis";
import { rateLimit } from "@/lib/rate-limit";
jest.mock("server-only", () => ({}));
jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({ __esModule: true, default: {} }));
jest.mock("@/lib/rate-limit", () => ({ rateLimit: jest.fn() }));
jest.mock("@/lib/career/analysis", () => ({ matchResume: jest.fn(), reviewResume: jest.fn() }));
const request = (body: unknown) => new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { jest.resetAllMocks(); (auth as jest.Mock).mockResolvedValue({ user: {}, accessToken: { sub: "owner" } }); });
it("requires authentication before analysis", async () => {
  (auth as jest.Mock).mockResolvedValue(null);
  expect((await match(request({}))).status).toBe(401);
  expect(matchResume).not.toHaveBeenCalled();
});
it("rejects invalid JSON and invalid provider selections", async () => {
  expect((await match(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(400);
  expect((await review(request({ resumeId: "r", selectedModel: { provider: "unknown" } }))).status).toBe(400);
  expect(reviewResume).not.toHaveBeenCalled();
});
it("uses the authenticated owner and selected record IDs", async () => {
  (matchResume as jest.Mock).mockResolvedValue({ overall: 0 });
  const response = await match(request({ resumeId: "r", jobId: "j", userId: "victim" }));
  expect(response.status).toBe(200);
  expect(matchResume).toHaveBeenCalledWith("owner", "r", "j", undefined);
  expect(rateLimit).toHaveBeenCalledWith("ai:owner");
});
it("does not disclose provider errors or secrets", async () => {
  (reviewResume as jest.Mock).mockRejectedValue(new Error("secret-provider-body"));
  const response = await review(request({ resumeId: "r" }));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("secret-provider-body");
});
