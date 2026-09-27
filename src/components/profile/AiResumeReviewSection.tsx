"use client";
import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Resume } from "@/models/profile.model";
import { defaultModel } from "@/models/ai.model";
import { getFromLocalStorage } from "@/utils/localstorage.utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { AiResumeReviewResponseContent } from "./AiResumeReviewResponseContent";
export default function AiResumeReviewSection({ resume }: { resume: Resume }) {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false);
  const [content, setContent] = useState(""), [error, setError] = useState("");
  const request = useRef<AbortController | undefined>(undefined);
  async function review() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError(""); setContent("");
    try {
      const response = await fetch("/api/ai/resume/review", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ resumeId: resume.id, selectedModel: getFromLocalStorage("aiSettings", defaultModel) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Analysis failed");
      setContent(JSON.stringify(body));
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Analysis failed"); }
    finally { if (request.current === controller) setLoading(false); }
  }
  return <Sheet open={open} onOpenChange={value => { setOpen(value); if (!value) request.current?.abort(); }}><SheetTrigger asChild><Button size="sm" variant="outline" className="ml-2 h-8 gap-1" disabled={!resume.id}><Sparkles className="h-3.5 w-3.5" />Review</Button></SheetTrigger><SheetContent className="overflow-y-auto"><SheetHeader><SheetTitle>AI resume review</SheetTitle><SheetDescription>Review uses your saved resume and selected AI provider. Open Career Intelligence for job-specific review and version comparisons.</SheetDescription></SheetHeader><Button className="my-4" onClick={review} disabled={loading}>{loading ? "Analyzing…" : "Generate review"}</Button>{error && <p role="alert">{error}</p>}<AiResumeReviewResponseContent content={content} /></SheetContent></Sheet>;
}
