# Emergent.sh-Inspired Approach & Assumptions

> This file documents how OtsAI's architecture and product philosophy were shaped by patterns visibly associated with Emergent.sh, plus our assumptions where public information is limited.

## Confirmed Patterns (observable from Emergent platform)

| Pattern | How OtsAI Adopts It |
|---|---|
| **Single `/api/*` ingress prefix** | All backend routes prefixed; trivially proxied through k8s ingress |
| **Supervisor-managed processes** | Backend (uvicorn) + frontend (yarn start) under supervisor with hot reload |
| **Env-driven config** | URLs, secrets, model IDs, admin email — all in `.env`, no hardcoded fallbacks |
| **Universal LLM Key abstraction** | Single `EMERGENT_LLM_KEY` powers OpenAI/Anthropic/Gemini calls — credit metering at the platform level |
| **Mongo-first data layer** | Schema-flexible; UUID-prefixed string IDs; `_id` always excluded |
| **Modular page architecture** | Each route is a self-contained `.jsx` page with co-located logic |
| **Design-token system** | Brand tokens in JSON (`/app/design_guidelines.json`) drive Tailwind config |

## Inferred Patterns (assumption-flagged)

| Inference | Assumption Basis |
|---|---|
| **AI-assisted spec → implementation pipeline** | Emergent's "build with AI" positioning suggests treating LLM outputs as first-class artifacts; OtsAI projects mirror this with ledgered generations |
| **Iterative shipping > big-bang launches** | OtsAI MVP intentionally narrow; backlog items P0/P1/P2 ranked for incremental cycles |
| **DX-first** | Hot reload, clear error messages, single-file initial backend for fast onboarding |
| **Production-shaped from day one** | Audit logs, RBAC, credit ledger reconciliation present in MVP — not deferred |
| **Mobile-portable APIs** | Pure REST under `/api`, no server-rendered HTML — API can power web, mobile, CLI, future plugins |

## Where Our Approach Diverges From "Generic SaaS"

1. **Audit-first credit system** — most SaaS treats credits as a counter. OtsAI ships a *ledger* (txn rows + admin_adjustments + audit_logs) on day one because the founder explicitly asked for transparency and traceability.
2. **No payment scaffolding** — but the credit txn system is structurally ready to accept a `purchase` type with zero migration.
3. **Both auth methods on day one** — JWT email/password AND Google OAuth, sharing one user document. Most projects pick one.
4. **Anti-AI-slop visual identity** — design system explicitly rejects purple gradients, Inter, centered card grids. Green-emerald + Geist + JetBrains Mono.

## How These Influence Architecture

| Decision | Driver |
|---|---|
| Single-file `server.py` (700 lines) | DX/iteration speed; modularize at 1500+ |
| MongoDB over Postgres | Schema flexibility for prompt I/O; faster iteration |
| `emergentintegrations` library | Lock-in is acceptable trade for unified key + provider abstraction |
| Tailwind + custom tokens | Aesthetic precision without Vercel-template look |
| `data-testid` everywhere | Enables agent-driven E2E testing without DOM fragility |

## Open Questions / Assumption Flags

- **Public Emergent SDKs and pricing tiers** — not publicly documented at depth; we assume Universal Key billing is per-credit and treat the user's balance as authoritative.
- **Long-term Emergent compute primitives** (background jobs, queues) — assumed forthcoming; OtsAI uses synchronous LLM calls today, would migrate to a queue when streaming or long-running outputs are added.
- **Mobile app build pipeline** — assumed Expo + EAS would be the path; design tokens in JSON make port direct.

## Practical Outcome

OtsAI ships in one session as:
- a real working web app (signup → generate → credit ledger → admin)
- with 30/30 backend tests passing
- a comprehensive doc set (this file + PRD + TDD + Schema + API Ref + Checklists)
- ready for the next iteration to add streaming, templates, mobile, billing — all without architectural rewrites.
