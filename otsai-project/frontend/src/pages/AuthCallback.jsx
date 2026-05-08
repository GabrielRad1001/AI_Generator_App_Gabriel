import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { auth as authApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) {
      nav("/login", { replace: true });
      return;
    }
    const sessionId = decodeURIComponent(m[1]);

    (async () => {
      try {
        const res = await authApi.googleSession(sessionId);
        setUser(res.user);
        toast.success(`Welcome, ${res.user.name?.split(" ")[0] || "builder"}.`);
        // Clear hash and navigate
        window.history.replaceState({}, document.title, "/dashboard");
        nav("/dashboard", { replace: true, state: { user: res.user } });
      } catch (e) {
        toast.error("Google sign-in failed. Try again.");
        nav("/login", { replace: true });
      }
    })();
  }, [nav, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="text-center">
        <div className="text-brand text-3xl font-mono animate-pulse">◬</div>
        <div className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-muted">Establishing session…</div>
      </div>
    </div>
  );
}
