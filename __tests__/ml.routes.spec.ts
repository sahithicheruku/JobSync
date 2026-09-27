/** @jest-environment node */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { mlService } from "@/lib/mlService";
import { POST as extract } from "@/app/api/ml/extract-skills/route";
import { POST as analyze } from "@/app/api/ml/analyze-job/route";
import { POST as recommend } from "@/app/api/ml/recommend-courses/route";
import { POST as search } from "@/app/api/ml/search-courses/route";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/mlService", () => ({ mlService: {
  extractSkills: jest.fn(), analyzeJob: jest.fn(), recommendCourses: jest.fn(), searchCourses: jest.fn(),
} }));
const session = auth as jest.Mock;
const request = (body: unknown) => new NextRequest("http://localhost/api/ml/test", {
  method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
});
const cases = [
  { name: "extract", handler: extract, service: mlService.extractSkills, body: { text: "Python" }, args: ["Python"], invalid: { text: "x".repeat(50_001) } },
  { name: "analyze", handler: analyze, service: mlService.analyzeJob, body: { jobDescription: "Python", resumeSkills: ["Python"] }, args: ["Python", ["Python"], 10], invalid: { jobDescription: "Python", resumeSkills: [42] } },
  { name: "recommend", handler: recommend, service: mlService.recommendCourses, body: { missingSkills: ["Python"] }, args: [["Python"], 10], invalid: { missingSkills: ["Python"], topN: 51 } },
  { name: "search", handler: search, service: mlService.searchCourses, body: { query: "Python" }, args: ["Python", 10], invalid: { query: "Python", topN: -1 } },
];

beforeEach(() => { jest.resetAllMocks(); });

describe.each(cases)("$name ML route", ({ name, handler, service, body, args, invalid }) => {
  test("denies anonymous requests before forwarding or parsing", async () => {
    session.mockResolvedValue(null);
    const req = request(body);
    const read = jest.spyOn(req, "json");
    expect((await handler(req)).status).toBe(401);
    expect(read).not.toHaveBeenCalled();
    expect(service).not.toHaveBeenCalled();
  });
  test("forwards valid authenticated requests with defaults", async () => {
    session.mockResolvedValue({ user: { id: "user-a" } });
    (service as jest.Mock).mockResolvedValue({ success: true });
    const response = await handler(request(body));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(service).toHaveBeenCalledWith(...args);
  });
  test("rejects malformed JSON and invalid inputs without calling ML", async () => {
    session.mockResolvedValue({ user: { id: "user-a" } });
    const malformed = new NextRequest("http://localhost/api/ml/test", { method: "POST", body: "{" });
    expect((await handler(malformed)).status).toBe(400);
    expect((await handler(request(invalid))).status).toBe(400);
    expect(service).not.toHaveBeenCalled();
  });
  test("does not expose internal service errors", async () => {
    session.mockResolvedValue({ user: { id: "user-a" } });
    (service as jest.Mock).mockRejectedValue(new Error("private service details"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await handler(request(body));
      expect(response.status).toBe(name === "analyze" ? 200 : 500);
      expect(await response.text()).not.toContain("private service details");
    } finally { log.mockRestore(); }
  });
});

test("empty missing-skills input returns no recommendations without calling ML", async () => {
  session.mockResolvedValue({ user: { id: "user-a" } });
  const response = await recommend(request({ missingSkills: [] }));
  expect(await response.json()).toEqual({ success: true, courses: [], count: 0 });
  expect(mlService.recommendCourses).not.toHaveBeenCalled();
});
