import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, ShieldCheck, Users, FolderKanban, Wand2, Coins, ScrollText, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, Badge } from "../components/ui/card";
import { Input, Textarea, Label } from "../components/ui/input";
import { admin as adminApi } from "../lib/api";

const TABS = [
  { id: "overview", label: "Overview", icon: ShieldCheck },
  { id: "users", label: "Users & credits", icon: Users },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "audit", label: "Audit log", icon: ScrollText },
];

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [q, setQ] = useState("");
  const [adjustTarget, setAdjustTarget] = useState(null);

  const loadStats = async () => { try { setStats(await adminApi.stats()); } catch {} };
  const loadUsers = async (query = "") => { try { const r = await adminApi.users(query); setUsers(r.users); } catch {} };
  const loadAudit = async () => { try { const r = await adminApi.audit(); setAudit(r.logs); } catch {} };
  const loadProjects = async () => { try { const r = await adminApi.projects(); setAllProjects(r.projects); } catch {} };

  useEffect(() => {
    loadStats();
    loadUsers();
    loadAudit();
    loadProjects();
  }, []);

  return (
    <div className="p-8 lg:p-12 max-w-7xl">
      <div className="flex items-center gap-3 mb-2">
        <Badge variant="admin">Owner-only</Badge>
        <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Admin</span>
      </div>
      <h1 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest">Control room</h1>
      <p className="mt-3 text-ink-secondary">Manage users, credits, projects, and audit history.</p>

      {/* Tabs */}
      <div className="mt-10 flex gap-1 border-b border-line overflow-x-auto" data-testid="admin-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap ${
                active ? "border-brand text-ink-primary" : "border-transparent text-ink-muted hover:text-ink-primary"
              }`}
              data-testid={`admin-tab-${t.id}`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {tab === "overview" && <Overview stats={stats} />}
        {tab === "users" && (
          <UsersPanel
            users={users}
            onSearch={(query) => { setQ(query); loadUsers(query); }}
            q={q}
            onAdjust={(u) => setAdjustTarget(u)}
            onSetRole={async (u, role) => {
              await adminApi.setRole(u.user_id, role);
              toast.success(`Role updated → ${role}`);
              loadUsers(q);
              loadAudit();
            }}
          />
        )}
        {tab === "projects" && <ProjectsPanel projects={allProjects} />}
        {tab === "audit" && <AuditPanel logs={audit} />}
      </div>

      {adjustTarget && (
        <AdjustModal
          target={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onDone={() => {
            setAdjustTarget(null);
            loadUsers(q);
            loadStats();
            loadAudit();
            toast.success("Credit adjustment recorded.");
          }}
        />
      )}
    </div>
  );
}

function Overview({ stats }) {
  if (!stats) return <div className="text-ink-muted">Loading…</div>;
  const cards = [
    { label: "Users", value: stats.users, icon: Users },
    { label: "Projects", value: stats.projects, icon: FolderKanban },
    { label: "Generations", value: stats.generations, icon: Wand2 },
    { label: "Successful", value: stats.successful_generations, icon: ShieldCheck },
    { label: "Credits in circulation", value: stats.total_credits_in_circulation, icon: Coins, accent: true },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="admin-overview">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="bg-bg-surface border border-line p-6">
            <Icon className="w-5 h-5 text-ink-muted" strokeWidth={1.5} />
            <div className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ink-muted">{c.label}</div>
            <div className={`mt-2 text-3xl font-medium ${c.accent ? "text-brand" : "text-ink-primary"}`}>{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}

function UsersPanel({ users, onSearch, q, onAdjust, onSetRole }) {
  const [val, setVal] = useState(q);
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <Input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Search by email, name, or user ID…"
            className="pl-10"
            data-testid="admin-users-search"
          />
        </div>
        <Button variant="secondary" onClick={() => onSearch(val)} data-testid="admin-users-search-btn">Search</Button>
      </div>

      <div className="bg-bg-surface border border-line overflow-x-auto">
        <table className="w-full text-sm" data-testid="admin-users-table">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-ink-muted border-b border-line">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Credits</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-b border-line/60 hover:bg-bg-elevated/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-ink-primary">{u.name}</div>
                  <div className="text-xs text-ink-muted">{u.email}</div>
                </td>
                <td className="px-4 py-3 text-ink-secondary text-xs uppercase tracking-[0.18em]">{u.auth_provider}</td>
                <td className="px-4 py-3">{u.role === "admin" ? <Badge variant="admin">admin</Badge> : <Badge>user</Badge>}</td>
                <td className="px-4 py-3 text-right font-mono text-brand">{u.credits}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onAdjust(u)} data-testid={`admin-adjust-${u.user_id}`}>Adjust credits</Button>
                    <Button size="sm" variant="ghost" onClick={() => onSetRole(u, u.role === "admin" ? "user" : "admin")} data-testid={`admin-role-${u.user_id}`}>
                      {u.role === "admin" ? "Make user" : "Make admin"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">No users.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectsPanel({ projects }) {
  return (
    <div className="bg-bg-surface border border-line overflow-x-auto">
      <table className="w-full text-sm" data-testid="admin-projects-table">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-ink-muted border-b border-line">
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Generations</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.project_id} className="border-b border-line/60">
              <td className="px-4 py-3"><div className="text-ink-primary">{p.title}</div></td>
              <td className="px-4 py-3 text-xs text-ink-muted font-mono">{p.user_id}</td>
              <td className="px-4 py-3"><Badge variant={p.status === "active" ? "brand" : "default"}>{p.status}</Badge></td>
              <td className="px-4 py-3 text-right font-mono text-ink-primary">{p.generation_count}</td>
              <td className="px-4 py-3 text-xs text-ink-muted">{new Date(p.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {projects.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-muted">No projects.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function AuditPanel({ logs }) {
  return (
    <div className="bg-bg-surface border border-line overflow-x-auto">
      <table className="w-full text-sm" data-testid="admin-audit-table">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-ink-muted border-b border-line">
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Target</th>
            <th className="px-4 py-3">Metadata</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.log_id} className="border-b border-line/60">
              <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
              <td className="px-4 py-3 text-ink-primary">{l.actor_email}</td>
              <td className="px-4 py-3"><Badge variant="brand">{l.action}</Badge></td>
              <td className="px-4 py-3 text-xs font-mono text-ink-secondary">{l.target_id || "—"}</td>
              <td className="px-4 py-3 text-xs font-mono text-ink-muted max-w-md truncate">{JSON.stringify(l.metadata)}</td>
            </tr>
          ))}
          {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-muted">No audit entries.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function AdjustModal({ target, onClose, onDone }) {
  const [type, setType] = useState("add");
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error("Reason required."); return; }
    setBusy(true);
    try {
      await adminApi.adjust({
        target_user_id: target.user_id,
        amount: Number(amount),
        adjustment_type: type,
        reason,
        note: note || null,
      });
      onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Adjustment failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm" data-testid="adjust-modal">
      <div className="bg-bg-surface border border-line w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="text-xs uppercase tracking-[0.22em] text-brand font-bold">Credit adjustment</span>
            <h3 className="mt-2 text-2xl font-medium tracking-tight">{target.name}</h3>
            <div className="text-xs text-ink-muted mt-1">{target.email} · current: <span className="text-brand font-mono">{target.credits}</span></div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-primary" data-testid="adjust-close-btn"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {["add", "deduct", "promo", "correction", "test"].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-2 text-xs uppercase tracking-[0.18em] border ${type === t ? "border-brand text-brand bg-brand/5" : "border-line text-ink-secondary hover:border-line-hover"}`}
                  data-testid={`adjust-type-${t}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Amount {type === "correction" && <span className="text-ink-muted normal-case">(use negative to decrease)</span>}</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required data-testid="adjust-amount" />
          </div>
          <div>
            <Label>Reason (required)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Onboarding bonus" required data-testid="adjust-reason" />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} data-testid="adjust-note" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} data-testid="adjust-cancel">Cancel</Button>
            <Button disabled={busy} data-testid="adjust-submit">{busy ? "Applying…" : "Apply adjustment"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
