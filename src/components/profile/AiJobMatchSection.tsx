"use client";
import { useEffect, useRef, useState } from "react";
import { getResumeList } from "@/actions/profile.actions";
import { Resume } from "@/models/profile.model";
import { defaultModel } from "@/models/ai.model";
import { getFromLocalStorage } from "@/utils/localstorage.utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { AiJobMatchResponseContent } from "./AiJobMatchResponseContent";
export function AiJobMatchSection({ aISectionOpen, triggerChange, jobId }: { aISectionOpen: boolean; triggerChange: (open: boolean) => void; jobId: string }) {
  const [resumes, setResumes] = useState<Resume[]>([]), [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false), [error, setError] = useState(""), [content, setContent] = useState("");
  const request = useRef<AbortController | undefined>(undefined);
  useEffect(() => {
    if (!aISectionOpen) { request.current?.abort(); return; }
    let active = true;
    getResumeList(1,100).then(result => { if (active) { if (!result?.success) setError(result?.message || "Cannot load resumes"); else setResumes(result.data); } }).catch(() => { if (active) setError("Cannot load resumes"); });
    return () => { active = false; request.current?.abort(); };
  }, [aISectionOpen]);
  async function match() {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(""); setContent("");
    try {
      const response = await fetch("/api/ai/resume/match", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ resumeId: selected, jobId, selectedModel: getFromLocalStorage("aiSettings", defaultModel) }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Analysis failed"); setContent(JSON.stringify(body));
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Analysis failed"); }
    finally { if (request.current === controller) setLoading(false); }
  }
  return <Sheet open={aISectionOpen} onOpenChange={triggerChange}><SheetContent className="overflow-y-auto"><SheetHeader><SheetTitle>Explainable job match</SheetTitle><SheetDescription>Compare your saved resume with this job using cited evidence and transparent weights.</SheetDescription></SheetHeader><label className="mt-4 block">Resume<select className="my-2 w-full rounded border bg-background p-2" value={selected} onChange={e => { setSelected(e.target.value); setContent(""); }} disabled={loading}><option value="">Select a resume</option>{resumes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select></label><Button disabled={!selected || loading} onClick={match}>{loading ? "Analyzing…" : "Analyze fit"}</Button>{error && <p role="alert">{error}</p>}<AiJobMatchResponseContent content={content} /></SheetContent></Sheet>;
}
