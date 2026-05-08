import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Wand2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, Badge } from "../components/ui/card";
import { projects as projectsApi } from "../lib/api";

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try { const r = await projectsApi.get(id); setData(r); }
      catch { nav("/projects"); }
    })();
  }, [id, nav]);

  if (!data) return <div className="p-12 text-ink-muted">Loading…</div>;

  const { project, generations } = data;

  return (
    <div className="p-8 lg:p-12 max-w-6xl">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink-primary mb-8" data-testid="back-to-projects">
        <ArrowLeft className="w-4 h-4" /> All projects
      </Link>

      <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
        <div>
          <Badge variant={project.status === "active" ? "brand" : "default"}>{project.status}</Badge>
          <h1 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest">{project.title}</h1>
          {project.description && <p className="mt-3 text-ink-secondary max-w-2xl">{project.description}</p>}
          <div className="mt-4 text-xs text-ink-muted">
            {project.generation_count} generations · created {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>
        <Button onClick={() => nav(`/generate?project=${project.project_id}`)} data-testid="project-generate-btn">
          <Wand2 className="w-4 h-4 mr-2" /> New generation
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Generations</h2>
        {generations.length === 0 ? (
          <Card>
            <div className="border border-dashed border-line p-12 text-center">
              <div className="text-brand font-mono text-3xl mb-4">◬</div>
              <div className="text-ink-primary">No generations in this project yet.</div>
              <Button size="sm" className="mt-6" onClick={() => nav(`/generate?project=${project.project_id}`)}>Generate something</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {generations.map((g) => (
              <Card key={g.generation_id} data-testid={`gen-${g.generation_id}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand">{g.model}</Badge>
                    <span className="text-xs text-ink-muted">{new Date(g.created_at).toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-ink-muted">{g.credits_used} credits</span>
                </div>
                <div className="text-sm text-ink-primary">{g.prompt}</div>
                <div className="mt-4 pt-4 border-t border-line font-mono text-sm text-ink-secondary whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {g.output || g.error || "—"}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
