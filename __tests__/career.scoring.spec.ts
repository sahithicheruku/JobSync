import { atsChecks, scoreMatch, verifyEvidence, Requirement } from "@/lib/career/scoring";
import { applicationMetrics, summarizeMatches } from "@/lib/career/insights";
const requirement = (assessment: Requirement["assessment"]): Requirement => ({ requirement: "TypeScript", jobEvidence: "TypeScript required", resumeEvidence: assessment === "met" ? "Built TypeScript tools" : "", assessment, explanation: "Evidence assessment" });
it("computes the weighted score from components and preserves zero", () => {
  const result = scoreMatch({ skills: [requirement("met"), { ...requirement("missing"), requirement: "Python" }], experience: [requirement("partial")], education: [requirement("missing")] }, 80);
  expect(result.overall).toBe(53); // 50*.4 + 50*.25 + 0*.1 + 80*.25
  expect(result.components.find(c => c.name === "education")?.score).toBe(0);
  expect(result.missingSkills).toEqual(["Python"]);
});
it("does not fabricate scores for absent requirements and unavailable semantics", () => {
  const result = scoreMatch({ skills: [], experience: [requirement("unknown")], education: [] }, null);
  expect(result.overall).toBeNull(); expect(result.availableWeight).toBe(0);
  expect(result.components.every(c => c.effectiveWeight === 0)).toBe(true);
});
it("normalizes available weights and reports partial coverage", () => {
  const result = scoreMatch({ skills: [requirement("missing")], experience: [], education: [] }, null);
  expect(result.overall).toBe(0); expect(result.availableWeight).toBe(40);
  expect(result.components[0].effectiveWeight).toBe(1);
});
it("rejects fabricated evidence and unsupported positive judgments", () => {
  expect(() => verifyEvidence([requirement("met")], "Different resume", "TypeScript required")).toThrow();
  expect(() => verifyEvidence([requirement("missing")], "Resume", "Other job")).toThrow();
  expect(() => verifyEvidence([{ ...requirement("met"), resumeEvidence: "" }], "Resume", "TypeScript required")).toThrow();
  expect(verifyEvidence([requirement("met")], "Built TypeScript tools", "TypeScript required")).toHaveLength(1);
});
it("labels ATS results as a heuristic and checks observable text", () => {
  expect(atsChecks("").score).toBe(0);
  expect(atsChecks("email@example.org Experience 2024 Education Skills").score).toBe(100);
  expect(atsChecks("text").explanation).toContain("heuristic");
});
it("uses an explicit application denominator and has a real empty state", () => {
  expect(applicationMetrics([]).conversion).toBeNull();
  const result = applicationMetrics([
    { applied: true, appliedDate: null, Status: { value: "rejected" }, Interview: [{ id: "interview" }] },
    { applied: true, appliedDate: null, Status: { value: "applied" }, Interview: [] },
    { applied: false, appliedDate: null, Status: { value: "draft" }, Interview: [] },
  ]);
  expect(result).toMatchObject({ applications: 2, interviews: 1, conversion: 50 });
});
it("counts only the latest match per job and excludes incomplete scores from role ranking", () => {
  const match = (weight: number, skills: string[]) => ({ overall: 60, availableWeight: weight, missingSkills: skills, components: [] });
  const result = summarizeMatches([
    { jobId: "a", jobTitle: "Engineer", result: match(100, ["Python", "python"]) },
    { jobId: "a", jobTitle: "Engineer", result: match(100, ["Java"]) },
    { jobId: "b", jobTitle: "Designer", result: match(40, ["Python"]) },
  ]);
  expect(result.missingSkills).toEqual([{ skill: "python", jobs: 2 }]);
  expect(result.bestFitRoles).toEqual([{ role: "engineer", score: 60, sample: 1 }]);
});
