import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CareerWorkspace from "@/components/CareerWorkspace";
const data = { resumes: [{ id: "r", title: "Resume version 1" }], jobs: [{ id: "j", JobTitle: { label: "Engineer" }, Company: { label: "Example" } }], history: [], insights: { applications: 0, interviews: 0, conversion: null, analyzedJobs: 0, missingSkills: [], bestFitRoles: [], explanation: "Based on saved jobs." } };
it("shows an honest empty state and submits selected IDs for explainable matching", async () => {
  const original = global.fetch;
  global.fetch = jest.fn().mockImplementation(async (_url, options) => ({ ok: true, json: async () => options ? { matching_score: 0, detailed_analysis: [{ category: "skills: 0/100", value: ["No resume evidence found"] }] } : data }));
  try {
    render(<CareerWorkspace />);
    await screen.findByText("No data yet");
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
