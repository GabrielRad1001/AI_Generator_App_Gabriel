import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

function Glyph() {
  return (<span className="inline-block w-7 h-7 grid place-items-center bg-brand text-bg-base font-mono text-base font-bold leading-none">◬</span>);
}

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const u = await signup({ name, email, password });
      toast.success(`Welcome to OtsAI, ${u.name.split(" ")[0]}. Here are 100 credits to start.`);
      nav("/dashboard");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const googleSignup = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 lg:p-16 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-12">
            <Link to="/" className="flex items-center gap-2.5 text-ink-primary"><Glyph /><span className="font-medium tracking-tight">OtsAI</span></Link>
          </div>
          <h2 className="text-3xl font-medium tracking-tight">Create your workspace</h2>
          <p className="mt-2 text-ink-secondary text-sm">Already in? <Link to="/login" className="text-brand hover:underline" data-testid="link-login">Sign in</Link></p>

          <form onSubmit={submit} className="mt-10 space-y-5" data-testid="signup-form">
            <div>
              <Label>Name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" data-testid="signup-name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" data-testid="signup-email" />
            </div>
            <div>
              <Label>Password <span className="text-ink-muted">— min 8 chars</span></Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" data-testid="signup-password" />
            </div>
            <Button className="w-full" disabled={busy} data-testid="signup-submit-btn">{busy ? "Creating workspace…" : "Create account"}</Button>
            <p className="text-xs text-ink-muted leading-relaxed">By continuing you agree to our (forthcoming) terms. 100 starter credits will be issued on signup.</p>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">or</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <Button type="button" variant="secondary" className="w-full" onClick={googleSignup} data-testid="google-signup-btn">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.93h5.27c-.23 1.27-.93 2.34-1.98 3.06v2.54h3.2c1.87-1.72 2.95-4.26 2.95-7.27 0-.65-.06-1.27-.17-1.87z"/><path d="M12.18 21c2.67 0 4.91-.88 6.55-2.39l-3.2-2.48c-.89.6-2.04.96-3.35.96-2.58 0-4.76-1.74-5.54-4.08H3.33v2.56C4.96 18.78 8.27 21 12.18 21z"/><path d="M6.64 13.01a5.43 5.43 0 010-3.43V7.02H3.33a9 9 0 000 8.07l3.31-2.08z"/><path d="M12.18 5.94c1.45 0 2.76.5 3.79 1.48l2.84-2.84C16.93 3.04 14.83 2.18 12.18 2.18c-3.91 0-7.22 2.22-8.85 5.46l3.31 2.56c.78-2.34 2.96-4.26 5.54-4.26z"/></svg>
            Continue with Google
          </Button>
        </div>
      </div>

      <div className="hidden lg:flex relative bg-bg-surface border-l border-line p-12 flex-col justify-between overflow-hidden order-1 lg:order-2">
        <div className="absolute inset-0 -z-0" style={{ background: "radial-gradient(circle at 70% 30%, rgba(0,255,163,0.18), transparent 60%)" }} />
        <Link to="/" className="flex items-center gap-2.5 text-ink-primary z-10" data-testid="brand-link"><Glyph /><span className="font-medium tracking-tight text-lg">OtsAI</span></Link>
        <div className="z-10 max-w-md">
          <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Get started</span>
          <h1 className="mt-6 text-5xl font-medium tracking-tightest leading-[1.05]">
            Generate<br />
            <span className="text-brand">anything.</span>
          </h1>
          <ul className="mt-10 space-y-4 text-ink-secondary">
            <li className="flex items-start gap-3"><span className="text-brand font-mono text-sm pt-1">✓</span> 100 starter credits</li>
            <li className="flex items-start gap-3"><span className="text-brand font-mono text-sm pt-1">✓</span> 3 frontier models in one workspace</li>
            <li className="flex items-start gap-3"><span className="text-brand font-mono text-sm pt-1">✓</span> Project history, credit ledger, audit log</li>
            <li className="flex items-start gap-3"><span className="text-brand font-mono text-sm pt-1">✓</span> No card. No payments. Yet.</li>
          </ul>
        </div>
        <div className="z-10 text-xs uppercase tracking-[0.2em] text-ink-muted">v1.0 · alpha</div>
      </div>
    </div>
  );
}
