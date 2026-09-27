/** @jest-environment node */
import { z } from "zod";
import { generateJSON, objectSchema, stringSchema } from "@/lib/career/provider";
import { AiProvider } from "@/models/ai.model";
jest.mock("server-only", () => ({}));
const schema = z.object({ answer: z.string() });
const format = objectSchema({ answer: stringSchema });
const originalFetch = global.fetch;
beforeEach(() => { global.fetch = jest.fn(); process.env.OPENAI_API_KEY = "test-only"; process.env.OPENAI_MODEL = "configured-model"; });
afterEach(() => { global.fetch = originalFetch; delete process.env.OPENAI_API_KEY; delete process.env.OPENAI_MODEL; });
it("uses Responses structured output, disables storage, and ignores browser model overrides", async () => {
  (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ status: "completed", output: [{ content: [{ type: "output_text", text: '{"answer":"Evidence-based reply"}' }] }] }) });
  expect((await generateJSON({ provider: AiProvider.OPENAI, model: "arbitrary-model" }, "Career task", {}, schema, format)).value.answer).toBe("Evidence-based reply");
  const body = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
  expect(body).toMatchObject({ model: "configured-model", store: false, text: { format: { type: "json_schema", strict: true } } });
});
it("supports Ollama without an OpenAI key", async () => {
  delete process.env.OPENAI_API_KEY;
  (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ message: { content: '{"answer":"Local reply"}' } }) });
  expect((await generateJSON({ provider: AiProvider.OLLAMA, model: "llama3.1" }, "Career task", {}, schema, format)).provider).toBe("ollama");
});
it.each([
  { status: "incomplete", output: [] },
  { status: "completed", output: [{ content: [{ type: "refusal", refusal: "No" }] }] },
  { status: "completed", output: [{ content: [{ type: "output_text", text: '{"answer":12}' }] }] },
])("rejects incomplete, refused and invalid provider results", async body => {
  (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => body });
  await expect(generateJSON(undefined, "Career task", {}, schema, format)).rejects.toThrow();
});
