import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Wand2, ChevronDown, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea, Label } from "../components/ui/input";
import { Card, Badge } from "../components/ui/card";
import { generate as genApi, projects as projectsApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Generate() {
  const { user, refresh } = useAuth();
  const [params] = useSearchParams();
  const presetProject = params.get("project") || "";
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("gpt-5.2");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [projectId, setProjectId] = useState(presetProject);
  const [copied, setCopied] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, p] = await Promise.all([genApi.models(), projectsApi.list()]);
        setModels(m.models);
        setAllProjects(p.projects);
      } catch {}
    })();
  }, []);

  const run = async () => {
    if (!prompt.trim()) { toast.error("Type a prompt first."); return; }
    setBusy(true);
    setOutput("");
    setCreditsUsed(null);
    try {
      const res = await genApi.run({ prompt, model, project_id: projectId || null });
      if (res.generation.status === "success") {
        setOutput(res.generation.output);
        setCreditsUsed(res.generation.credits_used);
        toast.success(`Generated. ${res.generation.credits_used} credits used.`);
        await refresh();
      } else {
        toast.error(res.generation.error || "Generation failed");
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const presets = [
    "Write a 7-day launch plan for an indie SaaS targeting solo founders.",
    "Draft a Postgres schema for a multi-tenant note-taking app.",
    "Generate 5 startup ideas at the intersection of AI and home robotics.",
    "Summarize quantum computing for a busy product manager — 5 bullet points.",
  ];

  return (
    <div className="p-8 lg:p-12 max-w-6xl">
      <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Generate</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest">Describe it. Ship it.</h1>
          <p className="mt-3 text-ink-secondary">Pick a model, prompt anything. OtsAI generates.</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Balance</div>
          <div className="text-2xl text-brand font-medium" data-testid="generate-balance">{user?.credits ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <Label>Model</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6" data-testid="model-selector">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`text-left p-4 border transition-all ${
                  model === m.id ? "border-brand bg-bg-elevated" : "border-line hover:border-line-hover"
                }`}
                data-testid={`model-${m.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-ink-primary font-medium text-sm">{m.label}</span>
                  <span className="text-xs text-brand font-mono">{m.credits}c</span>
                </div>
                <div className="mt-1 text-xs text-ink-muted uppercase tracking-[0.18em]">{m.provider}</div>
              </button>
            ))}
          </div>

          <Label>Project (optional)</Label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-bg-base border border-line text-ink-primary px-4 py-3 text-sm focus:outline-none focus:border-brand mb-6"
            data-testid="project-selector"
          >
            <option value="">— No project —</option>
            {allProjects.map((p) => (
              <option key={p.project_id} value={p.project_id}>{p.title}</option>
            ))}
          </select>

          <Label>Prompt</Label>
          <Textarea
            rows={8}
            placeholder="Describe what you want OtsAI to generate…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            data-testid="generate-prompt"
            className="min-h-[180px]"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {presets.map((p, i) => (
              <button
                key={i}
                onClick={() => setPrompt(p)}
                className="text-xs px-3 py-1.5 border border-line text-ink-secondary hover:border-brand hover:text-brand transition-colors"
                data-testid={`preset-${i}`}
              >
                {p.length > 50 ? p.slice(0, 50) + "…" : p}
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-ink-muted">
              Cost: <span className="text-brand font-medium">{models.find((m) => m.id === model)?.credits || 0} credits</span>
            </div>
            <Button onClick={run} disabled={busy} data-testid="generate-run-btn">
              {busy ? "Generating…" : (<><Sparkles className="w-4 h-4 mr-2" /> Generate</>)}
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-5 bg-bg-base">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold">Output</span>
              {creditsUsed != null && <Badge variant="brand">{creditsUsed} credits</Badge>}
            </div>
            {output && (
              <button onClick={copy} className="text-xs text-ink-muted hover:text-brand flex items-center gap-1.5" data-testid="copy-output-btn">
                {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            )}
          </div>
          <div className="font-mono text-sm text-ink-secondary whitespace-pre-wrap min-h-[300px]" data-testid="generate-output">
            {busy && !output && (
              <div className="text-ink-muted cursor-blink">OtsAI is thinking</div>
            )}
            {!busy && !output && (
              <div className="text-ink-muted text-center py-20">Output appears here.</div>
            )}
            {output}
          </div>
        </Card>
      </div>
    </div>
  );
}
