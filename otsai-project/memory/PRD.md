# OtsAI — Product Requirements Document (PRD)

> **Version**: 1.0 — MVP shipped (Jan 2026)
> **Owner**: Gabriel (admin email `gabriel.rad1001@gmail.com`)
> **Status**: Alpha

---

## 1. Original Problem Statement

Build OtsAI — a production-ready, AI-native platform that can evolve into a fullstack web app, mobile apps, and high-converting landing pages. It must function as a universal **AI generator of anything** (text, code, plans, schemas, ideas) with real, functional features. No payment integration yet. Owner must have an admin-managed credit system with full audit trail. Architecture must be modular, scalable, SaaS-ready, and prepared for future monetization without major refactoring.

User explicit choices (recorded in this session):
- **Brand vibe**: green
- **Positioning**: "an AI generator of anything"
- **Models**: GPT-5.2, Claude Sonnet 4.5, Gemini 3 Pro (via Emergent Universal LLM Key)
- **Auth**: Email/password (JWT) **AND** Emergent-managed Google OAuth
- **Admin**: `gabriel.rad1001@gmail.com` / `OtsAI@Admin2026!`
- **Mobile**: deferred (architecture mobile-ready)

---

## 2. Executive Vision

**OtsAI** is a builder-grade workspace that turns plain-language prompts into anything — plans, code, schemas, copy, prose, frameworks, roadmaps — across three frontier models in a single workspace. It serves solo founders, engineers, and operators who currently juggle multiple AI tools and want one credit-metered, project-organized, audit-trailed home for their generation work.

**Differentiators**
1. **Multi-model native** — GPT-5.2, Claude Sonnet 4.5, Gemini 3 Pro, picked per generation.
2. **Audit-grade credit ledger** — every credit movement logged, balance reconciled.
3. **Owner-controlled credits** — admin can manually adjust credits with reason + audit log.
4. **Premium aesthetic** — distinctive dark-emerald visual identity, not generic AI-slop.
5. **API-ready core** — clean `/api/*` REST surface, mobile/CLI parity from day one.

---

## 3. Target Users (Personas)

| Persona | Goals | OtsAI Hook |
|---|---|---|
| **Maya** — solo founder | Plan launches, write copy, draft schemas, ship fast | One workspace replaces 4 tools |
| **Devin** — full-stack engineer | Generate code skeletons, SQL, regex, doc drafts | Switch model per task; credit transparency |
| **Priya** — ops lead | Frameworks, SOPs, ticket templates | Audit trail + admin controls |
| **Gabriel** — owner/admin | Run the platform | Full admin: users, credits, audit log |

---

## 4. Scope

### MVP (shipped now)
- Marketing landing page (hero, features, how-it-works, testimonials, FAQ, CTA, footer)
- Email/password auth (JWT) + Emergent Google OAuth
- User dashboard (credits, projects, recent generations)
- Projects (create / archive / delete / detail)
- Universal AI generation (3 models, project tagging, history)
- Credit ledger (transparent transactions)
- Admin panel (overview / users & credits / projects / audit log)
- Manual admin credit adjustments (5 types: add, deduct, promo, correction, test) with reason + note + audit log
- RBAC (`user`, `admin`)

### Post-MVP (next iterations)
- Streaming generation (SSE)
- Prompt templates library
- Generation export (Markdown / PDF)
- Collaboration (shared projects)
- Notifications system
- Email digests
- Feature flags table
- Rate limiting (per-IP, per-user)
- Brute-force protection on `/auth/login`

### Future Vision
- Mobile apps (Expo/React Native) with parity
- Public OtsAI API + API keys
- Stripe billing (architecture-ready, drop-in)
- Team workspaces & seats
- Plugins/integrations (Slack, Notion, GitHub)
- Image & video generation (Nano Banana, Sora)
- Custom fine-tunes

---

## 5. User Roles

| Role | Permissions | Default Credits |
|---|---|---|
| **Visitor** | Browse landing, signup/login | n/a |
| **Registered User** | Own projects, generations, credit ledger | 100 |
| **Power User** *(future)* | Templates library, export, higher rate limits | 500 |
| **Admin / Owner** | All `/admin/*`, credit adjustments, role changes, audit log | 10,000 |

---

## 6. What's Implemented (Jan 2026)

- Backend: FastAPI + MongoDB (Motor async), 8 collections, JWT + Google OAuth, Emergent LLM integration
- Frontend: React 18 + Tailwind, custom design system, 9 pages, 50+ data-testid coverage
- Real LLM calls to GPT-5.2, Claude Sonnet 4.5, Gemini 3 Pro via `emergentintegrations`
- Admin auto-seeded on boot with 10,000 credits
- 30/30 backend tests passing (real LLM call validated, credit ledger consistency verified)
- Premium green-emerald dark theme matching design guidelines spec

---

## 7. Backlog / Next Tasks

### P0 (critical for production)
1. Rate limiting on `/auth/login` and `/auth/signup`
2. Restrict CORS `allow_origins` to known frontend hosts
3. Atomic credit deduction with `findOneAndUpdate` + `$inc` (race-condition safe)
4. Rotate `JWT_SECRET` for production

### P1 (next iteration)
5. Streaming generation (SSE)
6. Prompt templates library
7. Markdown rendering of LLM output (currently plain mono)
8. Notifications system + digest email
9. Generation export
10. Refresh-token flow

### P2 (future)
11. Mobile app (Expo)
12. Stripe billing
13. Public API + API keys
14. Team workspaces

---

## 8. Acceptance Criteria (MVP — all met)

- [x] Owner can sign in with `gabriel.rad1001@gmail.com` / `OtsAI@Admin2026!`
- [x] Owner has 10,000 starting credits, role=admin
- [x] New users get 100 starter credits + signup_bonus ledger entry
- [x] Owner can adjust ANY user's credits (including own) with type/amount/reason/note
- [x] Every adjustment writes user.credits + credit_transaction + admin_adjustment + audit_log
- [x] LLM generation deducts credits ONLY on success
- [x] `/api/*` prefix everywhere (kubernetes ingress)
- [x] `_id` excluded from all responses (no Mongo ObjectId leakage)
- [x] data-testid on every interactive element
- [x] Premium green-emerald dark aesthetic
- [x] No payment code (architecture-ready for future Stripe)

---

## 9. Architecture

See `/app/memory/TDD.md` for technical design details.
See `/app/memory/DATABASE_SCHEMA.md` for data model.
See `/app/memory/API_REFERENCE.md` for endpoints.
See `/app/memory/EMERGENT_APPROACH.md` for Emergent.sh-inspired methodology.
See `/app/memory/MVP_CHECKLIST.md` and `/app/memory/LAUNCH_CHECKLIST.md` for go-live items.
