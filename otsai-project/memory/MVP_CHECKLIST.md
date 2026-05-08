# OtsAI — MVP Checklist

## Backend
- [x] FastAPI app boot + health
- [x] MongoDB connection + 7 collections + indexes
- [x] Admin user auto-seeded on boot
- [x] JWT email/password auth (signup, login, me, logout)
- [x] Emergent Google OAuth flow (`/auth/google/session` + cookie session)
- [x] `get_current_user` dual-resolves JWT or cookie
- [x] `require_admin` dependency
- [x] Projects CRUD (list, create, get, update, delete)
- [x] Multi-model generation (GPT-5.2, Claude Sonnet 4.5, Gemini 3 Pro)
- [x] Credit deduction only on success
- [x] Credit ledger (`credit_transactions`)
- [x] Admin: stats, users, user detail
- [x] Admin: credit adjustments (5 types) with reason + note
- [x] Admin: audit log + role change endpoint
- [x] All 30 backend tests passing

## Frontend
- [x] Premium dark-emerald design system
- [x] Geist + JetBrains Mono fonts
- [x] Landing page (hero / features / how / testimonials / FAQ / CTA / footer)
- [x] Signup + Login + Google button
- [x] AuthCallback handles OAuth hash synchronously (race-safe)
- [x] AppShell with sidebar nav
- [x] Dashboard with stats + recent generations + projects
- [x] Generate page (model picker, project tag, prompt presets, output panel)
- [x] Projects list + create form + archive/delete
- [x] Project detail with generation history
- [x] Credits ledger page
- [x] Settings (profile read-only)
- [x] Admin panel (overview / users / projects / audit) with credit-adjust modal
- [x] Toaster (sonner) for feedback
- [x] data-testid on every interactive element

## Documentation
- [x] PRD.md
- [x] TDD.md
- [x] DATABASE_SCHEMA.md
- [x] API_REFERENCE.md
- [x] EMERGENT_APPROACH.md
- [x] MVP_CHECKLIST.md (this file)
- [x] LAUNCH_CHECKLIST.md
- [x] test_credentials.md

## Deferred (post-MVP)
- [ ] Mobile apps (Expo)
- [ ] Streaming generation (SSE)
- [ ] Prompt templates library
- [ ] Email digest / notifications system
- [ ] Stripe billing
- [ ] Public OtsAI API + key issuance
- [ ] Rate limiting + brute force protection
- [ ] CSP headers + production CORS allowlist
- [ ] Atomic credit deduction (`findOneAndUpdate $inc` with balance filter)
