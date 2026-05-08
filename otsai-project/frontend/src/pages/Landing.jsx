import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Shield, Layers, Brain, Code2, Wand2 } from "lucide-react";
import { Button } from "../components/ui/button";

const HERO_BG = "https://images.unsplash.com/photo-1777789062450-d2c57cb8b15b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbmVvbiUyMGdyZWVuJTIwbGlnaHQlMjBhYnN0cmFjdHxlbnwwfHx8fDE3NzgyMzYzNzN8MA&ixlib=rb-4.1.0&q=85";

function Glyph() {
  return (
    <span className="inline-block w-7 h-7 grid place-items-center bg-brand text-bg-base font-mono text-base font-bold leading-none">
      ◬
    </span>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-bg-base/60 backdrop-blur-xl border-b border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-ink-primary" data-testid="brand-link">
          <Glyph />
          <span className="font-medium tracking-tight text-lg">OtsAI</span>
          <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] text-ink-muted ml-2">v1.0 · alpha</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-ink-secondary">
          <a href="#features" className="hover:text-ink-primary transition-colors" data-testid="nav-features">Features</a>
          <a href="#how" className="hover:text-ink-primary transition-colors" data-testid="nav-how">How it works</a>
          <a href="#faq" className="hover:text-ink-primary transition-colors" data-testid="nav-faq">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" size="sm" data-testid="nav-login-btn">Sign in</Button></Link>
          <Link to="/signup"><Button size="sm" data-testid="nav-signup-btn">Get started <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="relative pt-40 pb-32 overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg-base via-bg-base/70 to-bg-base/20" />
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 18% 60%, rgba(0,255,163,0.18), transparent 55%)" }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 border border-line px-3 py-1.5 mb-8 text-xs uppercase tracking-[0.2em] text-brand">
            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
            New · OtsAI Multi-model engine
          </div>
          <h1 className="font-medium tracking-tightest text-5xl sm:text-7xl lg:text-8xl leading-[0.95] text-ink-primary text-balance">
            Generate <span className="text-brand">anything</span><br />
            <span className="text-ink-secondary">from a single prompt.</span>
          </h1>
          <p className="mt-8 text-lg text-ink-secondary max-w-2xl leading-relaxed">
            OtsAI is a builder-grade workspace that turns plain language into plans, code, content, ideas, and entire projects — powered by GPT-5.2, Claude Sonnet 4.5, and Gemini 3 Pro, in one place.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/signup"><Button size="lg" data-testid="hero-cta-signup">Start generating <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
            <Link to="/login"><Button variant="secondary" size="lg" data-testid="hero-cta-login">I have an account</Button></Link>
            <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">100 free credits · no card required</span>
          </div>

          <div className="mt-16 flex items-center gap-8 text-xs uppercase tracking-[0.18em] text-ink-muted">
            <span>Trusted by builders worldwide</span>
            <span className="w-px h-4 bg-line" />
            <span>SOC2-ready architecture</span>
            <span className="hidden md:inline w-px h-4 bg-line" />
            <span className="hidden md:inline">Multi-model · One workspace</span>
          </div>
        </div>

        <div className="lg:col-span-4 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <PromptPreview />
        </div>
      </div>
    </header>
  );
}

function PromptPreview() {
  return (
    <div className="bg-bg-surface border border-line p-6 glow-ring">
      <div className="flex items-center gap-2 text-xs text-ink-muted uppercase tracking-[0.2em] mb-4">
        <span className="w-2 h-2 bg-brand rounded-full" /> ots-engine.live
      </div>
      <div className="font-mono text-sm leading-relaxed">
        <span className="text-ink-muted">$ ots</span> <span className="text-ink-primary">generate</span>
        <div className="mt-2 text-ink-secondary">→ "build me a 7-day launch plan for an indie SaaS"</div>
        <div className="mt-4 border-t border-line pt-4 text-ink-secondary">
          <span className="text-brand">Day 1.</span> Tighten positioning and ICP.<br/>
          <span className="text-brand">Day 2.</span> Ship landing v1 + waitlist.<br/>
          <span className="text-brand">Day 3.</span> 10 outbound conversations.<br/>
          <span className="text-brand">Day 4.</span> Cohort launch on PH/HN.
        </div>
        <div className="mt-3 text-ink-muted text-xs cursor-blink">streaming</div>
      </div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: Brain, t: "Three frontier models", d: "Switch between GPT-5.2, Claude Sonnet 4.5, and Gemini 3 Pro per generation. Pick the best brain for the task." },
    { icon: Layers, t: "Project workspaces", d: "Group prompts, outputs, and iterations into projects. Archive, rename, and export when ready." },
    { icon: Wand2, t: "Universal generator", d: "Plans, code, copy, schemas, ideas, frameworks, prose — if you can describe it, OtsAI can draft it." },
    { icon: Zap, t: "Credit-based metering", d: "Transparent ledger. See every credit spent, every generation logged. No hidden meters." },
    { icon: Shield, t: "Auditable admin", d: "Every credit adjustment, role change and login is logged with reason and timestamp. Built for trust." },
    { icon: Code2, t: "API-ready core", d: "REST endpoints under /api. Mobile and CLI parity from day one. Bring your own integrations." },
  ];
  return (
    <section id="features" className="py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-5">
            <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Capabilities</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest text-ink-primary">
              One workspace.<br />
              <span className="text-ink-secondary">Every model. Every output.</span>
            </h2>
          </div>
          <p className="md:col-span-6 md:col-start-7 text-ink-secondary text-lg leading-relaxed self-end">
            OtsAI is the place builders go when they need a plan, a draft, a schema, a roadmap, or a finished artifact — fast, structured, and shareable. No prompt-engineering ceremony.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {items.map((it, i) => {
            const span = i === 0 ? "md:col-span-7" : i === 1 ? "md:col-span-5" : i === 2 ? "md:col-span-5" : i === 3 ? "md:col-span-7" : "md:col-span-6";
            const Icon = it.icon;
            return (
              <div key={it.t} className={`bg-bg-surface border border-line p-8 hover:border-line-hover transition-all hover:-translate-y-1 ${span}`} data-testid={`feature-card-${i}`}>
                <Icon className="w-6 h-6 text-brand" strokeWidth={1.5} />
                <h3 className="mt-6 text-xl font-medium text-ink-primary tracking-tight">{it.t}</h3>
                <p className="mt-3 text-ink-secondary text-sm leading-relaxed">{it.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Describe what you need", d: "A plan, a schema, a UI, a poem, a roadmap. Anything. OtsAI doesn't care about the genre — only the clarity." },
    { n: "02", t: "Pick your model", d: "GPT-5.2 for crisp reasoning. Claude Sonnet 4.5 for nuance. Gemini 3 Pro for breadth. One credit ledger across all three." },
    { n: "03", t: "Save, iterate, ship", d: "Every generation lands in a project. Audit history, version drafts, export when ready." },
  ];
  return (
    <section id="how" className="py-32 border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-end justify-between mb-16">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Workflow</span>
            <h2 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest">How it works</h2>
          </div>
          <span className="hidden md:inline text-xs text-ink-muted uppercase tracking-[0.2em]">Three steps. Zero ceremony.</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line">
          {steps.map((s) => (
            <div key={s.n} className="bg-bg-base p-10">
              <div className="font-mono text-brand text-sm">{s.n}</div>
              <h3 className="mt-6 text-2xl font-medium tracking-tight text-ink-primary">{s.t}</h3>
              <p className="mt-4 text-ink-secondary leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { q: "OtsAI replaced four tools in my stack. Now my docs, plans, and copy live in one place.", a: "Maya K.", r: "Solo founder" },
    { q: "Switching models per task is a superpower. The credit ledger means I always know what I'm spending.", a: "Devin R.", r: "Engineer" },
    { q: "The audit log on admin actions is the kind of thing I'd build last. OtsAI ships with it.", a: "Priya S.", r: "Ops lead" },
  ];
  return (
    <section className="py-32 border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— Voices</span>
        <h2 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest">Builders, on OtsAI.</h2>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((t, i) => (
            <div key={i} className="bg-bg-surface border border-line p-8">
              <div className="text-brand text-3xl leading-none mb-6">"</div>
              <p className="text-ink-primary leading-relaxed">{t.q}</p>
              <div className="mt-8 pt-6 border-t border-line">
                <div className="text-ink-primary font-medium">{t.a}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-ink-muted mt-1">{t.r}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-ink-muted">Testimonials are illustrative; OtsAI is in alpha.</p>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "Is OtsAI free to try?", a: "Yes. Every account starts with 100 credits. No card required." },
    { q: "Which models are available?", a: "GPT-5.2 (OpenAI), Claude Sonnet 4.5 (Anthropic), and Gemini 3 Pro (Google). You pick per generation." },
    { q: "Do you keep my prompts and outputs?", a: "Stored privately in your workspace. You own them, can export them, and delete projects at any time." },
    { q: "Can I use OtsAI for code, copy, planning, schemas, ideas?", a: "Yes — that's the point. OtsAI is a universal generator. If you can describe it, OtsAI drafts it." },
    { q: "Will there be paid plans?", a: "We are not charging during alpha. The credit system is designed so paid tiers can be added later without friction." },
    { q: "Is there a mobile app?", a: "Mobile parity is on the roadmap. The API and design system are already mobile-ready." },
  ];
  return (
    <section id="faq" className="py-32 border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <span className="text-xs uppercase tracking-[0.25em] text-brand font-bold">— FAQ</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-medium tracking-tightest">Quick answers.</h2>
          <p className="mt-6 text-ink-secondary leading-relaxed">Still curious? <a href="mailto:hello@otsai.app" className="text-brand hover:underline">hello@otsai.app</a></p>
        </div>
        <div className="md:col-span-8 divide-y divide-line border-y border-line">
          {items.map((it, i) => (
            <details key={i} className="group p-6">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-ink-primary font-medium">{it.q}</span>
                <span className="text-brand font-mono text-sm group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-ink-secondary leading-relaxed">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32 border-t border-line">
      <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <h2 className="text-5xl md:text-6xl font-medium tracking-tightest text-ink-primary text-balance">
          Stop wrangling tools.<br />
          <span className="text-brand">Start generating.</span>
        </h2>
        <p className="mt-6 text-ink-secondary max-w-xl mx-auto">100 credits on the house. Three frontier models. One workspace.</p>
        <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-4">
          <Link to="/signup"><Button size="lg" data-testid="footer-cta-signup">Create your workspace <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
          <Link to="/login"><Button size="lg" variant="secondary" data-testid="footer-cta-login">Sign in</Button></Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-2.5">
          <Glyph />
          <span className="font-medium tracking-tight">OtsAI</span>
          <span className="text-xs text-ink-muted ml-3">© {new Date().getFullYear()} OtsAI Labs.</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-ink-muted">
          <a href="#features" className="hover:text-ink-primary">Features</a>
          <a href="#how" className="hover:text-ink-primary">How it works</a>
          <a href="#faq" className="hover:text-ink-primary">FAQ</a>
          <a href="/login" className="hover:text-ink-primary">Sign in</a>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div>
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
