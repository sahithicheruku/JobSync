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

    {(value.strengths?.length || value.weaknesses?.length) && (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border p-3">
          <p className="font-semibold">Why you match</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            {value.strengths?.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>

        <div className="rounded border p-3">
          <p className="font-semibold">What lowers the score</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            {value.weaknesses?.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      </div>
    )}
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
  const [analysisId, setAnalysisId] = useState("");
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
    try { const reply = await request("/api/career", { action: "assistant", resumeId, jobId: jobId || undefined, analysisId: analysisId || undefined, selectedModel: getFromLocalStorage("aiSettings", defaultModel), messages: next.map(m => ({ ...m, content: m.content.slice(0,3000) })) }); setMessages([...next, { role: "assistant", content: `${reply.answer}\n\nEvidence:\n${reply.evidence.join("\n")}\n\nNext steps:\n${reply.nextSteps.join("\n")}` }]); setQuestion(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Assistant unavailable"); } finally { setBusy(false); }
  }
  const selectClass = "w-full rounded-md border bg-background p-2 text-sm";
  const hasRealInsights = !!data && (data.history.length > 0 || data.insights.analyzedJobs > 0);
  return <section className="col-span-full mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
    <div><p className="text-sm text-muted-foreground">JobSync · Career Intelligence</p><h1 className="text-3xl font-bold">Turn your job search into a learning plan</h1><p className="mt-2 text-muted-foreground">Understand your fit, improve your resume, and track outcomes using your own records.</p></div>
    {data && data.history.length === 0 && (
      <Card>
        <CardHeader><CardTitle>Getting started</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{data.resumes.length ? "✓" : "○"} Add a resume</p>
          <p>{data.jobs.length ? "✓" : "○"} Save a target job</p>
          <p>○ Analyze resume-job fit</p>
          <p>○ Review skill gaps and learning priorities</p>
          <p>○ Use Interview Prep or Career Assistant</p>
        </CardContent>
      </Card>
    )}

    {error && <p role="alert" className="rounded border border-destructive p-3 text-destructive">{error}</p>}
    {!data ? <p role="status">{error ? "Career data could not load." : "Loading career data…"}</p> : <>
      <div className="grid gap-4 sm:grid-cols-3">{[["Recorded applications", data.insights.applications], ["Interviewed applications", data.insights.interviews], ["Application → interview", data.insights.conversion === null ? "No data yet" : `${data.insights.conversion}%`]].map(([title,value]) => <Card key={title}><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{value}</CardContent></Card>)}</div>
      <p className="text-sm text-muted-foreground">Conversion counts recorded interviews or current interview/offer status among applications. Past interviews without records may be missing.</p>
      {hasRealInsights ? <div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Learning priorities</CardTitle></CardHeader><CardContent>{data.insights.missingSkills.length ? <ol className="list-decimal pl-5 space-y-2">{data.insights.missingSkills.map(s => <li key={s.skill}>{s.skill} — not evidenced in {s.jobs} analyzed job{s.jobs === 1 ? "" : "s"}</li>)}</ol> : <p>No observed gaps yet. Match a resume against a saved job.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Best-fit saved roles</CardTitle></CardHeader><CardContent>{data.insights.bestFitRoles.length ? <ul className="space-y-2">{data.insights.bestFitRoles.map(r => <li key={r.role}>{r.role}: {r.score}/100 · {r.sample} job{r.sample === 1 ? "" : "s"}</li>)}</ul> : <p>Run matches with all scoring components available to compare roles.</p>}</CardContent></Card></div> : <div className="space-y-2"><p className="text-sm font-semibold">Demo insights</p><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Learning priorities</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-2">{demoInsights.learning.map(item => <li key={item}>{item}</li>)}</ul></CardContent></Card><Card><CardHeader><CardTitle>Best-fit roles</CardTitle></CardHeader><CardContent><ul className="space-y-2">{demoInsights.roles.map(role => <li key={role.role}>{role.role}: {role.match}% match</li>)}</ul></CardContent></Card><Card><CardHeader><CardTitle>Skill gaps</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-2">{demoInsights.gaps.map(item => <li key={item}>{item}</li>)}</ul></CardContent></Card><Card><CardHeader><CardTitle>Resume improvement insights</CardTitle></CardHeader><CardContent><ul className="list-disc pl-5 space-y-2">{demoInsights.resume.map(item => <li key={item}>{item}</li>)}</ul></CardContent></Card></div></div>}
      {data.insights.missingSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skill-gap heatmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.insights.missingSkills.map((item) => {
              const max = Math.max(...data.insights.missingSkills.map(s => s.jobs), 1);
              const width = Math.max(10, Math.round((item.jobs / max) * 100));

              return (
                <div key={item.skill} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{item.skill}</span>
                    <span className="text-muted-foreground">
                      missing in {item.jobs} job{item.jobs === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded bg-muted">
                    <div
                      className="h-2 rounded bg-primary"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">{data.insights.explanation}</p>
      <Card><CardHeader><CardTitle>Analyze your resume</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2"><label>Resume<select className={selectClass} value={resumeId} onChange={e => { setResumeId(e.target.value); setMessages([]); setResult(undefined); }}><option value="">Select a resume</option>{data.resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></label><label>Target job<select className={selectClass} value={jobId} onChange={e => { setJobId(e.target.value); setMessages([]); setResult(undefined); }}><option value="">General review (no job)</option>{data.jobs.map(j => <option key={j.id} value={j.id}>{j.JobTitle.label} · {j.Company.label}</option>)}</select></label></div>
        {!data.resumes.length && <p>Create or upload a resume from Profile to get started.</p>}
        <p className="text-sm text-muted-foreground">Analysis sends this resume and selected job to the AI provider chosen in Settings. OpenAI requests use storage disabled; Ollama runs on your configured server. Saved results are private to your account.</p>
        <div className="flex flex-wrap gap-2"><Button disabled={busy || !resumeId} onClick={() => run("review")}>Review resume</Button><Button disabled={busy || !resumeId || !jobId} onClick={() => run("match")}>Explain job fit</Button></div>
        {busy && <p role="status">Working…</p>}{result && <AnalysisResult value={result} />}
      </CardContent></Card>
      <Card>
        <CardHeader><CardTitle>Match score history</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.history.filter(h =>
            h.kind === "match" &&
            (h.result.matching_score !== undefined || h.result.score !== undefined)
          ).slice(0, 6).length ? (
            data.history.filter(h =>
              h.kind === "match" &&
              (h.result.matching_score !== undefined || h.result.score !== undefined)
            ).slice(0, 6).map(h => {
              const score = h.result.matching_score ?? h.result.score ?? 0;
              return (
                <div key={h.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{h.resumeTitle} · {h.jobTitle || "General"}</span>
                    <span>{score}/100</span>
                  </div>
                  <div className="h-2 rounded bg-muted">
                    <div
                      className="h-2 rounded bg-primary"
                      style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Run job-fit analyses to build score history.
            </p>
          )}
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle>Compare resume versions</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm">Analyze versions against the same job, then compare saved snapshots. Changing a resume preserves earlier results.</p><div className="grid gap-4 md:grid-cols-2">{[["Before",beforeId,setBeforeId],["After",afterId,setAfterId]].map(([label,value,setter]) => <label key={label as string}>{label as string}<select className={selectClass} value={value as string} onChange={e => (setter as (v:string)=>void)(e.target.value)}><option value="">Choose saved analysis</option>{data.history.map(h => <option value={h.id} key={h.id}>{h.resumeTitle} · {h.kind} · {h.jobTitle || "General"} · {new Date(h.createdAt).toLocaleString()}</option>)}</select></label>)}</div><Button disabled={busy || !beforeId || !afterId} onClick={compare}>Compare snapshots</Button>{comparison && <><p>Score change: {comparison.delta === null ? "Not comparable" : `${comparison.delta > 0 ? "+" : ""}${comparison.delta} points`}{comparison.sameResumeContent ? " · Same resume content" : " · Different resume content"}</p><p className="text-sm text-muted-foreground">{comparison.explanation}</p><div className="grid gap-6 md:grid-cols-2">{[comparison.before,comparison.after].map((a,i) => <section key={a.id}><h3 className="font-semibold">{i === 0 ? "Before" : "After"}: {a.resumeTitle}</h3><p className="mb-3 text-xs">{a.model} · {a.rubric}</p><AnalysisResult value={a.result} /></section>)}</div></>}</CardContent></Card>
      <Card>
        <CardHeader><CardTitle>Interview Prep</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Generate preparation guidance from the selected resume and job.
          </p>
          <Button
            disabled={busy || !resumeId || !jobId}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const reply = await request("/api/career", {
                  action: "assistant",
                  resumeId,
                  jobId,
                  selectedModel: getFromLocalStorage("aiSettings", defaultModel),
                  messages: [{
                    role: "user",
                    content: "Create interview preparation for this job using my resume. Include likely technical topics, behavioral questions, skill gaps to prepare, and concise answer guidance grounded in my experience."
                  }]
                });
                setMessages([{
                  role: "assistant",
                  content: `${reply.answer}\n\nEvidence:\n${reply.evidence.join("\n")}\n\nNext steps:\n${reply.nextSteps.join("\n")}`
                }]);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Interview prep failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            Generate Interview Prep
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent AI analyses</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.history.slice(0, 5).length ? (
            data.history.slice(0, 5).map(item => (
              <div key={item.id} className="rounded border p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.resumeTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.jobTitle || "General resume review"} · {item.kind}
                    </p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResult(item.result)}
                    >
                      View Result
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No saved AI analyses yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Export career report</CardTitle></CardHeader>
        <CardContent>
          <Button
            disabled={!data}
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify({
                  generatedAt: new Date().toISOString(),
                  insights: data.insights,
                  analyses: data.history
                }, null, 2)],
                { type: "application/json" }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "jobsync-career-report.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export Career Report
          </Button>
        </CardContent>
      </Card>

      <Card>
  <CardHeader><CardTitle>Mock Interview</CardTitle></CardHeader>
  <CardContent>
    <Button
      disabled={busy || !resumeId || !jobId}
      onClick={() => setQuestion(
        "Act as an interviewer for this job. Ask me one realistic interview question at a time based on the job and my resume."
      )}
    >
      Start Mock Interview
    </Button>
  </CardContent>
</Card>

<Card><CardHeader><CardTitle>Career assistant</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm">Uses the selected resume, optional job, and recorded insights. Ask about fit, resume edits, interview preparation, or what to learn next.</p><label className="block">
  Saved analysis context
  <select className={selectClass} value={analysisId} onChange={e => setAnalysisId(e.target.value)}>
    <option value="">Use general career insights</option>
    {data.history.map(h => (
      <option key={h.id} value={h.id}>
        {h.resumeTitle} · {h.jobTitle || "General"} · {h.kind}
      </option>
    ))}
  </select>
</label>
<div aria-live="polite" className="space-y-4">{messages.map((m,i) => <div key={i} className="rounded border p-3"><h3 className="font-semibold">{m.role === "user" ? "You" : "JobSync"}</h3><p className="whitespace-pre-wrap text-sm">{m.content}</p></div>)}</div><div className="flex flex-wrap gap-2">
{[
  "What are my biggest skill gaps?",
  "How should I improve my resume?",
  "How should I prepare for this job?",
  "What experience should I highlight?"
].map(prompt => (
  <Button key={prompt} variant="outline" size="sm" onClick={() => setQuestion(prompt)}>
    {prompt}
  </Button>
))}
</div>
<form onSubmit={ask} className="space-y-3"><label className="block" htmlFor="career-question">Your question</label><textarea id="career-question" className={selectClass} rows={3} maxLength={3000} value={question} onChange={e => setQuestion(e.target.value)} placeholder="How can I prepare for this role using my existing experience?" /><Button disabled={busy || !resumeId || !question.trim()}>Ask assistant</Button></form></CardContent></Card>
    </>}
  </section>;
}
