import React from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { Home, Wand2, FolderKanban, Coins, Settings as Cog, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/ui/card";
import { Button } from "../components/ui/button";

function Glyph() {
  return (<span className="inline-block w-7 h-7 grid place-items-center bg-brand text-bg-base font-mono text-base font-bold leading-none">◬</span>);
}

function NavItem({ to, icon: Icon, children, end, testid }) {
  return (
    <NavLink
      to={to}
      end={end}
      data-testid={testid}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm border-l-2 transition-colors ${
          isActive
            ? "border-brand text-ink-primary bg-bg-surface"
            : "border-transparent text-ink-secondary hover:text-ink-primary hover:bg-bg-surface/40"
        }`
      }
    >
      <Icon className="w-4 h-4" strokeWidth={1.5} />
      <span>{children}</span>
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-bg-base">
      <aside className="w-64 shrink-0 border-r border-line bg-bg-base flex flex-col">
        <div className="px-6 py-5 border-b border-line">
          <Link to="/dashboard" className="flex items-center gap-2.5 text-ink-primary" data-testid="shell-brand">
            <Glyph />
            <span className="font-medium tracking-tight text-lg">OtsAI</span>
          </Link>
        </div>
        <nav className="py-4 flex-1">
          <div className="px-6 mb-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted">Workspace</div>
          <NavItem to="/dashboard" icon={Home} end testid="nav-dashboard">Dashboard</NavItem>
          <NavItem to="/generate" icon={Wand2} testid="nav-generate">Generate</NavItem>
          <NavItem to="/projects" icon={FolderKanban} testid="nav-projects">Projects</NavItem>
          <NavItem to="/credits" icon={Coins} testid="nav-credits">Credits</NavItem>

          <div className="px-6 mt-6 mb-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted">Account</div>
          <NavItem to="/settings" icon={Cog} testid="nav-settings">Settings</NavItem>
          {user.role === "admin" && (
            <>
              <div className="px-6 mt-6 mb-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted">Owner</div>
              <NavItem to="/admin" icon={ShieldCheck} testid="nav-admin">Admin panel</NavItem>
            </>
          )}
        </nav>

        <div className="px-6 py-5 border-t border-line">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 grid place-items-center bg-bg-surface border border-line text-ink-primary text-sm font-medium">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink-primary truncate">{user.name}</div>
              <div className="text-xs text-ink-muted truncate">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            {user.role === "admin" ? <Badge variant="admin">Owner</Badge> : <Badge>User</Badge>}
            <button
              onClick={async () => { await logout(); nav("/login"); }}
              className="text-ink-muted hover:text-brand-danger transition-colors flex items-center gap-1.5 text-xs"
              data-testid="logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
