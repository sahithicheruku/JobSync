import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CareerWorkspace from "@/components/CareerWorkspace";
const data = { resumes: [{ id: "r", title: "Resume version 1" }], jobs: [{ id: "j", JobTitle: { label: "Engineer" }, Company: { label: "Example" } }], history: [], insights: { applications: 0, interviews: 0, conversion: null, analyzedJobs: 0, missingSkills: [], bestFitRoles: [], explanation: "Based on saved jobs." } };
it("shows Demo insights when empty and submits selected IDs for explainable matching", async () => {
  const original = global.fetch;
  global.fetch = jest.fn().mockImplementation(async (_url, options) => ({ ok: true, json: async () => options ? { matching_score: 0, detailed_analysis: [{ category: "skills: 0/100", value: ["No resume evidence found"] }] } : data }));
  try {
    render(<CareerWorkspace />);
    await screen.findByText("Demo insights");
    expect(screen.getByText("91% match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explain job fit" })).toBeDisabled();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Resume"), "r");
    await user.selectOptions(screen.getByLabelText("Target job"), "j");
    await user.click(screen.getByRole("button", { name: "Explain job fit" }));
    await screen.findByText("No resume evidence found");
    expect(screen.getByText(/0\/100/, { selector: "p" })).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/ai/resume/match", expect.objectContaining({ body: expect.stringContaining('"resumeId":"r"') })));
  } finally { global.fetch = original; }
});

it("hides Demo insights when real analysis exists", async () => {
  const original = global.fetch;
  const realData = { resumes: [], jobs: [], history: [{ id: "a", kind: "match", resumeTitle: "Resume", jobTitle: "Engineer", createdAt: "2026-01-01", model: "test", rubric: "career-v1", result: {} }], insights: { applications: 0, interviews: 0, conversion: null, analyzedJobs: 1, missingSkills: [{ skill: "sql", jobs: 1 }], bestFitRoles: [], explanation: "Based on saved jobs." } };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => realData });
  try {
    render(<CareerWorkspace />);
    await screen.findByText("sql — not evidenced in 1 analyzed job");
    expect(screen.queryByText("Demo insights")).not.toBeInTheDocument();
    expect(screen.queryByText("91% match")).not.toBeInTheDocument();
  } finally { global.fetch = original; }
});
