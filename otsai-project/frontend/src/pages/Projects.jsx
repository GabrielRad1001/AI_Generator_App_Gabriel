import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Plus, FolderKanban, Trash2, Archive, ArchiveRestore } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, Badge } from "../components/ui/card";
import { Input, Textarea, Label } from "../components/ui/input";
import { projects as projectsApi } from "../lib/api";

export default function Projects() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const r = await projectsApi.list(); setItems(r.projects); } catch {}
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await projectsApi.create({ title, description: desc });
      toast.success("Project created.");
      setTitle(""); setDesc(""); setOpen(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  };

  const toggleArchive = async (p) => {
    await projectsApi.update(p.project_id, { status: p.status === "active" ? "archived" : "active" });
    load();
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete project "${p.title}" and all its generations?`)) return;
    await projectsApi.remove(p.project_id);
    toast.success("Deleted.");
    load();
  };

  return (
    <div className="p-8 lg:p-12 max-w-6xl">
      <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
        <div>
          <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Projects</span>
          <h1 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest">Your projects</h1>
          <p className="mt-3 text-ink-secondary">Group related generations into a project.</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="projects-new-btn">
          <Plus className="w-4 h-4 mr-2" /> New project
        </Button>
      </div>

      {open && (
        <Card className="mb-8" data-testid="new-project-form">
          <form onSubmit={create} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required data-testid="project-title" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} data-testid="project-desc" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} data-testid="project-cancel-btn">Cancel</Button>
              <Button disabled={busy} data-testid="project-create-btn">{busy ? "Creating…" : "Create"}</Button>
            </div>
          </form>
        </Card>
      )}

      {items.length === 0 ? (
        <Card>
          <div className="border border-dashed border-line p-12 text-center">
            <FolderKanban className="w-8 h-8 text-brand mx-auto" strokeWidth={1.5} />
            <div className="mt-4 text-ink-primary font-medium">No projects yet</div>
            <p className="mt-2 text-sm text-ink-secondary max-w-sm mx-auto">
              Projects organize your generations. Think of them as folders for your prompts and outputs.
            </p>
            <Button size="sm" className="mt-6" onClick={() => setOpen(true)}>Create first project</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.project_id} className="bg-bg-surface border border-line p-6 hover:border-line-hover transition-all group" data-testid={`project-card-${p.project_id}`}>
              <div className="flex items-center justify-between mb-3">
                <Badge variant={p.status === "active" ? "brand" : "default"}>{p.status}</Badge>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleArchive(p)} className="p-1.5 text-ink-muted hover:text-brand" title={p.status === "active" ? "Archive" : "Unarchive"} data-testid={`project-archive-${p.project_id}`}>
                    {p.status === "active" ? <Archive className="w-3.5 h-3.5" /> : <ArchiveRestore className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => remove(p)} className="p-1.5 text-ink-muted hover:text-brand-danger" title="Delete" data-testid={`project-delete-${p.project_id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <Link to={`/projects/${p.project_id}`}>
                <h3 className="text-lg font-medium tracking-tight text-ink-primary hover:text-brand transition-colors">{p.title}</h3>
              </Link>
              {p.description && <p className="mt-2 text-sm text-ink-secondary line-clamp-2">{p.description}</p>}
              <div className="mt-6 pt-4 border-t border-line text-xs text-ink-muted flex items-center justify-between">
                <span>{p.generation_count} generations</span>
                <span>{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
