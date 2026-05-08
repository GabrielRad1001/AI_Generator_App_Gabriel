import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

function Glyph() {
  return (
    <span className="inline-block w-7 h-7 grid place-items-center bg-brand text-bg-base font-mono text-base font-bold leading-none">◬</span>
  );
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login({ email, password });
      toast.success(`Welcome back, ${u.name.split(" ")[0]}.`);
      nav("/dashboard");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-bg-surface border-r border-line p-12 flex-col justify-between overflow-hidden">
        <Link to="/" className="flex items-center gap-2.5 text-ink-primary z-10" data-testid="brand-link">
          <Glyph />
          <span className="font-medium tracking-tight text-lg">OtsAI</span>
        </Link>
        <div className="absolute inset-0 -z-0" style={{ background: "radial-gradient(circle at 30% 70%, rgba(0,255,163,0.16), transparent 60%)" }} />
        <div className="z-10 max-w-md">
          <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Welcome back</span>
          <h1 className="mt-6 text-5xl font-medium tracking-tightest text-ink-primary leading-[1.05]">
            Pick up where<br />you left off.
          </h1>
          <p className="mt-6 text-ink-secondary leading-relaxed">
            Your projects, generations, and credit history are exactly where you parked them.
          </p>
        </div>
        <div className="z-10 text-xs uppercase tracking-[0.2em] text-ink-muted">v1.0 · alpha</div>
      </div>

      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-12">
            <Link to="/" className="flex items-center gap-2.5 text-ink-primary"><Glyph /><span className="font-medium tracking-tight">OtsAI</span></Link>
          </div>
          <h2 className="text-3xl font-medium tracking-tight">Sign in</h2>
          <p className="mt-2 text-ink-secondary text-sm">No account? <Link to="/signup" className="text-brand hover:underline" data-testid="link-signup">Create one</Link></p>

          <form onSubmit={submit} className="mt-10 space-y-5" data-testid="login-form">
            <div>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" data-testid="login-email" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" data-testid="login-password" />
            </div>
            <Button className="w-full" disabled={busy} data-testid="login-submit-btn">{busy ? "Signing in…" : "Sign in"}</Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">or</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <Button type="button" variant="secondary" className="w-full" onClick={googleLogin} data-testid="google-login-btn">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.93h5.27c-.23 1.27-.93 2.34-1.98 3.06v2.54h3.2c1.87-1.72 2.95-4.26 2.95-7.27 0-.65-.06-1.27-.17-1.87z"/><path d="M12.18 21c2.67 0 4.91-.88 6.55-2.39l-3.2-2.48c-.89.6-2.04.96-3.35.96-2.58 0-4.76-1.74-5.54-4.08H3.33v2.56C4.96 18.78 8.27 21 12.18 21z"/><path d="M6.64 13.01a5.43 5.43 0 010-3.43V7.02H3.33a9 9 0 000 8.07l3.31-2.08z"/><path d="M12.18 5.94c1.45 0 2.76.5 3.79 1.48l2.84-2.84C16.93 3.04 14.83 2.18 12.18 2.18c-3.91 0-7.22 2.22-8.85 5.46l3.31 2.56c.78-2.34 2.96-4.26 5.54-4.26z"/></svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
