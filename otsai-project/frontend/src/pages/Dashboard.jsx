import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Wand2, FolderKanban, Coins, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { projects as projectsApi, generate as generateApi, credits as creditsApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

function StatTile({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-bg-surface border border-line p-6 flex items-start justify-between hover:border-line-hover transition-colors">
      <div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-ink-muted">{label}</div>
        <div className={`mt-3 text-4xl font-medium tracking-tight ${accent ? "text-brand" : "text-ink-primary"}`} data-testid={`stat-${label.toLowerCase().replace(/\s+/g,"-")}`}>
          {value}
        </div>
        {sub && <div className="mt-2 text-xs text-ink-muted">{sub}</div>}
      </div>
      <Icon className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
    </div>
  );
}

export default function Dashboard() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [projs, setProjs] = useState([]);
  const [recent, setRecent] = useState([]);
  const [bal, setBal] = useState(user?.credits ?? 0);

  useEffect(() => {
    (async () => {
      try {
        const [p, g, c] = await Promise.all([
          projectsApi.list(),
          generateApi.list(5),
          creditsApi.me(),
        ]);
        setProjs(p.projects || []);
        setRecent(g.generations || []);
        setBal(c.balance);
      } catch {}
    })();
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="p-8 lg:p-12 max-w-6xl">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Workspace</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest text-ink-primary">
            Hi {firstName}.
          </h1>
          <p className="mt-3 text-ink-secondary">What are we generating today?</p>
        </div>
        <Button onClick={() => nav("/generate")} data-testid="dashboard-generate-cta">
          New generation <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Credits" value={bal} sub="Refreshed live" icon={Coins} accent />
        <StatTile label="Projects" value={projs.length} sub={`${projs.filter(p => p.status === "active").length} active`} icon={FolderKanban} />
        <StatTile label="Generations" value={recent.length === 5 ? "5+" : recent.length} sub="Last 5 visible" icon={Wand2} />
        <StatTile label="Plan" value={user?.role === "admin" ? "Owner" : "Alpha"} sub="No payments yet" icon={TrendingUp} />
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7" data-testid="card-recent-generations">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Recent generations</h3>
            <Link to="/generate" className="text-xs text-brand hover:underline uppercase tracking-[0.2em]">New →</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              title="No generations yet"
              text="Describe anything — a launch plan, a SQL schema, a poem, a UI spec. OtsAI will draft it."
              cta="Open generator"
              onClick={() => nav("/generate")}
            />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((g) => (
                <li key={g.generation_id} className="py-4 flex items-start gap-4">
                  <span className="font-mono text-xs text-brand pt-1">{g.model.split("-")[0]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-ink-primary text-sm line-clamp-1">{g.prompt}</div>
                    <div className="mt-1 text-xs text-ink-muted">{new Date(g.created_at).toLocaleString()} · {g.credits_used} credits</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-[0.18em] ${g.status === "success" ? "text-brand" : "text-brand-danger"}`}>{g.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-5" data-testid="card-projects">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium">Projects</h3>
            <Link to="/projects" className="text-xs text-brand hover:underline uppercase tracking-[0.2em]">All →</Link>
          </div>
          {projs.length === 0 ? (
            <EmptyState
              title="No projects yet"
              text="Group related generations into a project for cleaner history."
              cta="Browse projects"
              onClick={() => nav("/projects")}
            />
          ) : (
            <ul className="space-y-3">
              {projs.slice(0, 5).map((p) => (
                <li key={p.project_id}>
                  <Link to={`/projects/${p.project_id}`} className="flex items-center justify-between p-3 border border-line hover:border-line-hover transition-colors group">
                    <div className="min-w-0">
                      <div className="text-ink-primary text-sm truncate">{p.title}</div>
                      <div className="text-xs text-ink-muted">{p.generation_count} generations</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-brand transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function EmptyState({ title, text, cta, onClick }) {
  return (
    <div className="border border-dashed border-line p-8 text-center">
      <div className="text-brand font-mono text-3xl mb-4">◬</div>
      <div className="text-ink-primary font-medium">{title}</div>
      <p className="mt-2 text-sm text-ink-secondary max-w-sm mx-auto">{text}</p>
      <Button size="sm" className="mt-6" onClick={onClick}>{cta}</Button>
    </div>
  );
}
