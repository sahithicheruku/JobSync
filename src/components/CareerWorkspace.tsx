"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { defaultModel } from "@/models/ai.model";
import { getFromLocalStorage } from "@/utils/localstorage.utils";

type Result = { matching_score?: number | null; score?: number; summary?: string; explanation?: string; strengths?: string[]; weaknesses?: string[]; suggestions?: (string | { category: string; value: string[] })[]; detailed_analysis?: { category: string; value: string[] }[]; additional_comments?: string[]; ats?: { explanation: string; checks: { label: string; passed: boolean }[] } };
type Analysis = { id: string; kind: string; resumeTitle: string; jobTitle: string | null; createdAt: string; model: string; rubric: string; result: Result };
type Data = { resumes: { id: string; title: string }[]; jobs: { id: string; JobTitle: { label: string }; Company: { label: string } }[]; history: Analysis[]; insights: { applications: number; interviews: number; conversion: number | null; analyzedJobs: number; missingSkills: { skill: string; jobs: number }[]; bestFitRoles: { role: string; score: number; sample: number }[]; explanation: string } };
const demoInsights = { learning: ["Build stronger SQL querying skills", "Practice behavioral interview storytelling", "Learn production monitoring basics"], roles: [{ role: "Product Data Analyst", match: 91 }, { role: "Technical Program Manager", match: 86 }, { role: "Business Intelligence Analyst", match: 82 }], gaps: ["SQL", "Stakeholder communication", "Observability"], resume: ["Lead with measurable outcomes in each experience bullet", "Add a concise skills section near the top", "Tailor the summary to the target role"] };
function AnalysisResult({ value }: { value: Result }) {
  const score = value.matching_score !== undefined ? value.matching_score : value.score;
  return <div className="space-y-4 text-sm">
    <p className="text-2xl font-semibold">{score === null || score === undefined ? "Score unavailable" : `${score}/100`} <span className="text-sm font-normal">{value.ats ? "ATS text readiness" : "Weighted job fit"}</span></p>
    {value.summary && <p className="whitespace-pre-wrap">{value.summary}</p>}
    {value.ats && <ul>{value.ats.checks.map(c => <li key={c.label}>{c.passed ? "✓" : "Missing:"} {c.label}</li>)}</ul>}
    {value.detailed_analysis?.map(c => <section key={c.category}><h3 className="font-semibold">{c.category}</h3><ul className="list-disc pl-5 space-y-2">{c.value.map((v,i) => <li key={i}>{v}</li>)}</ul></section>)}
    {(["strengths", "weaknesses", "suggestions"] as const).map(key => value[key]?.length ? <section key={key}><h3 className="font-semibold capitalize">{key}</h3><ul className="list-disc pl-5 space-y-2">{value[key]!.map((item,i) => <li key={i}>{typeof item === "string" ? item : `${item.category}: ${item.value.join(", ") || "None found"}`}</li>)}</ul></section> : null)}
    {value.additional_comments?.map((text,i) => <p key={i} className="text-muted-foreground">{text}</p>)}
  </div>;
}
export default function CareerWorkspace() {
  const [data, setData] = useState<Data>();
  const [resumeId, setResumeId] = useState(""); const [jobId, setJobId] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [result, setResult] = useState<Result>();
  const [beforeId, setBeforeId] = useState(""); const [afterId, setAfterId] = useState("");
  const [comparison, setComparison] = useState<{ before: Analysis; after: Analysis; delta: number | null; sameResumeContent: boolean; explanation: string }>();
  const [question, setQuestion] = useState(""); const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const refresh = async () => { const response = await fetch("/api/career"); const body = await response.json(); if (!response.ok) throw new Error(body.error); setData(body); };
  useEffect(() => { refresh().catch(e => setError(e.message)); }, []);
  async function request(url: string, payload: unknown) {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = await response.json(); if (!response.ok) throw new Error(body.error || "Request failed"); return body;
  }
  async function run(kind: "match" | "review") {
    setBusy(true); setError(""); setResult(undefined);
    try { setResult(await request(`/api/ai/resume/${kind}`, { resumeId, jobId: jobId || undefined, selectedModel: getFromLocalStorage("aiSettings", defaultModel) })); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Analysis failed"); } finally { setBusy(false); }
  }
  async function compare() {
    setBusy(true); setError(""); setComparison(undefined);
    try { setComparison(await request("/api/career", { action: "compare", beforeId, afterId })); }
    catch (e) { setError(e instanceof Error ? e.message : "Comparison failed"); } finally { setBusy(false); }
  }
  async function ask(event: React.FormEvent) {
    event.preventDefault(); if (!question.trim()) return;
    setBusy(true); setError("");
    const next = [...messages.slice(-6), { role: "user" as const, content: question }];
    try { const reply = await request("/api/career", { action: "assistant", resumeId, jobId: jobId || undefined, selectedModel: getFromLocalStorage("aiSettings", defaultModel), messages: next.map(m => ({ ...m, content: m.content.slice(0,3000) })) }); setMessages([...next, { role: "assistant", content: `${reply.answer}\n\nEvidence:\n${reply.evidence.join("\n")}\n\nNext steps:\n${reply.nextSteps.join("\n")}` }]); setQuestion(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Assistant unavailable"); } finally { setBusy(false); }
  }
  const selectClass = "w-full rounded-md border bg-background p-2 text-sm";
  const hasRealInsights = !!data && (data.history.length > 0 || data.insights.analyzedJobs > 0);
  return <section className="col-span-full mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
    <div><p className="text-sm text-muted-foreground">JobSync · Career Intelligence</p><h1 className="text-3xl font-bold">Turn your job search into a learning plan</h1><p className="mt-2 text-muted-foreground">Understand your fit, improve your resume, and track outcomes using your own records.</p></div>
    {error && <p role="alert" className="rounded border border-destructive p-3 text-destructive">{error}</p>}
    {!data ? <p role="status">{error ? "Career data could not load." : "Loading career data…"}</p> : <>
      <div className="grid gap-4 sm:grid-cols-3">{[["Recorded applications", data.insights.applications], ["Interviewed applications", data.insights.interviews], ["Application → interview", data.insights.conversion === null ? "No data yet" : `${data.insights.conversion}%`]].map(([title,value]) => <Card key={title}><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{value}</CardContent></Card>)}</div>
      <p className="text-sm text-muted-foreground">Conversion counts recorded interviews or current interview/offer status among applications. Past interviews without records may be missing.</p>
      {hasRealInsights ? <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Learning priorities</CardTitle></CardHeader><CardContent>{data.insights.missingSkills.length ? <ol className="list-decimal pl-5 space-y-2">{data.insights.missingSkills.map(s => <li key={s.skill}>{s.skill} — not evidenced in {s.jobs} analyzed job{s.jobs === 1 ? "" : "s"}</li>)}</ol> : <p>No observed gaps yet. Match a resume against a saved job.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Best-fit saved roles</CardTitle></CardHeader><CardContent>{data.insights.bestFitRoles.length ? <ul className="space-y-2">{data.insights.bestFitRoles.map(r => <li key={r.role}>{r.role}: {r.score}/100 · {r.sample} job{r.sample === 1 ? "" : "s"}</li>)}</ul> : <p>Run matches with all scoring components available to compare roles.</p>}</CardContent></Card></div> : <div className="space-y-2"><p className="text-sm font-semibold">Demo insights</p><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Learning priorities</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-2">{demoInsights.learning.map(item => <li key={item}>{item}</li>)}</ul></CardContent></Card><Card><CardHeader><CardTitle>Best-fit roles</CardTitle></CardHeader><CardContent><ul className="space-y-2">{demoInsights.roles.map(role => <li key={role.role}>{role.role}: {role.match}% match</li>)}</ul></CardContent></Card><Card><CardHeader><CardTitle>Skill gaps</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-2">{demoInsights.gaps.map(item => <li key={item}>{item}</li>)}</ul></CardContent></Card><Card><CardHeader><CardTitle>Resume improvement insights</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-2">{demoInsights.resume.map(item => <li key={item}>{item}</li>)}</ul></CardContent></Card></div></div>}
      <p className="text-sm text-muted-foreground">{data.insights.explanation}</p>
      <Card><CardHeader><CardTitle>Analyze your resume</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2"><label>Resume<select className={selectClass} value={resumeId} onChange={e => { setResumeId(e.target.value); setMessages([]); setResult(undefined); }}><option value="">Select a resume</option>{data.resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></label><label>Target job<select className={selectClass} value={jobId} onChange={e => { setJobId(e.target.value); setMessages([]); setResult(undefined); }}><option value="">General review (no job)</option>{data.jobs.map(j => <option key={j.id} value={j.id}>{j.JobTitle.label} · {j.Company.label}</option>)}</select></label></div>
        {!data.resumes.length && <p>Create or upload a resume from Profile to get started.</p>}
        <p className="text-sm text-muted-foreground">Analysis sends this resume and selected job to the AI provider chosen in Settings. OpenAI requests use storage disabled; Ollama runs on your configured server. Saved results are private to your account.</p>
        <div className="flex flex-wrap gap-2"><Button disabled={busy || !resumeId} onClick={() => run("review")}>Review resume</Button><Button disabled={busy || !resumeId || !jobId} onClick={() => run("match")}>Explain job fit</Button></div>
        {busy && <p role="status">Working…</p>}{result && <AnalysisResult value={result} />}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Compare resume versions</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm">Analyze versions against the same job, then compare saved snapshots. Changing a resume preserves earlier results.</p><div className="grid gap-4 md:grid-cols-2">{[["Before",beforeId,setBeforeId],["After",afterId,setAfterId]].map(([label,value,setter]) => <label key={label as string}>{label as string}<select className={selectClass} value={value as string} onChange={e => (setter as (v:string)=>void)(e.target.value)}><option value="">Choose saved analysis</option>{data.history.map(h => <option value={h.id} key={h.id}>{h.resumeTitle} · {h.kind} · {h.jobTitle || "General"} · {new Date(h.createdAt).toLocaleString()}</option>)}</select></label>)}</div><Button disabled={busy || !beforeId || !afterId} onClick={compare}>Compare snapshots</Button>{comparison && <><p>Score change: {comparison.delta === null ? "Not comparable" : `${comparison.delta > 0 ? "+" : ""}${comparison.delta} points`}{comparison.sameResumeContent ? " · Same resume content" : " · Different resume content"}</p><p className="text-sm text-muted-foreground">{comparison.explanation}</p><div className="grid gap-6 md:grid-cols-2">{[comparison.before,comparison.after].map((a,i) => <section key={a.id}><h3 className="font-semibold">{i === 0 ? "Before" : "After"}: {a.resumeTitle}</h3><p className="mb-3 text-xs">{a.model} · {a.rubric}</p><AnalysisResult value={a.result} /></section>)}</div></>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Career assistant</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm">Uses the selected resume, optional job, and recorded insights. Ask about fit, resume edits, interview preparation, or what to learn next.</p><div aria-live="polite" className="space-y-4">{messages.map((m,i) => <div key={i} className="rounded border p-3"><h3 className="font-semibold">{m.role === "user" ? "You" : "JobSync"}</h3><p className="whitespace-pre-wrap text-sm">{m.content}</p></div>)}</div><form onSubmit={ask} className="space-y-3"><label className="block" htmlFor="career-question">Your question</label><textarea id="career-question" className={selectClass} rows={3} maxLength={3000} value={question} onChange={e => setQuestion(e.target.value)} placeholder="How can I prepare for this role using my existing experience?" /><Button disabled={busy || !resumeId || !question.trim()}>Ask assistant</Button></form></CardContent></Card>
    </>}
  </section>;
}
