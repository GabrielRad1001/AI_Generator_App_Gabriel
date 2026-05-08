# OtsAI — Launch Checklist

## Pre-Launch Hardening (P0 before any public traffic)

- [ ] Rotate `JWT_SECRET` to a 64-char random secret stored in production secrets manager
- [ ] Replace `CORS allow_origins=["*"]` with explicit allowlist (`https://otsai.app`, etc.)
- [ ] Add per-IP rate limit on `/api/auth/login`, `/api/auth/signup` (recommend `slowapi`)
- [ ] Add brute-force lockout (5 fails / 15 min)
- [ ] Add atomic credit deduction (`findOneAndUpdate({user_id, credits: {$gte: cost}}, {$inc: {credits: -cost}})`)
- [ ] CSP + HSTS + X-Frame-Options headers on frontend host
- [ ] Confirm cookies are `Secure; HttpOnly; SameSite=None` on all production hosts
- [ ] DB backups: nightly mongodump → object storage with 14-day retention
- [ ] Monitor: uptime check, error log alerting (Sentry / Logtail)
- [ ] Smoke test: signup → generate → credit deduct → admin adjust → login as adjusted user

## Day-of-Launch

- [ ] Status page live
- [ ] Support email (`hello@otsai.app`) reachable
- [ ] Privacy policy + ToS published (currently footer placeholder)
- [ ] Pricing page live (architecture has placeholder; copy needed)
- [ ] Robots.txt + sitemap.xml on landing
- [ ] Analytics installed (privacy-respecting — Plausible recommended)
- [ ] Social meta tags + OG image
- [ ] Hero background image confirmed loading from CDN

## Day-After

- [ ] Review audit log for anomalies
- [ ] Verify credit ledger reconciliation: every user's `credits` == sum of their txns
- [ ] Capacity check: Mongo connection count, uvicorn worker count
- [ ] Cost check: Emergent LLM key spend; set top-up alarm

## Compliance Track (post-traction)

- [ ] GDPR: account export + deletion endpoints
- [ ] SOC2 evidence collection — already structurally compliant (audit log, RBAC, secrets in env)
- [ ] Data retention policy
- [ ] Subprocessors page

## Launch Day Smoke Tests

```bash
# 1. Health
curl -s "$API/api/" | jq .

# 2. Admin login still works
curl -s -X POST "$API/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"gabriel.rad1001@gmail.com","password":"OtsAI@Admin2026!"}' | jq .user.role

# 3. New user signup → 100 credits
curl -s -X POST "$API/api/auth/signup" -H "Content-Type: application/json" \
  -d '{"email":"smoke@otsai.app","password":"smoke12345","name":"Smoke"}' | jq .user.credits

# 4. Generation actually generates
TOKEN=$(curl -s -X POST "$API/api/auth/login" ... | jq -r .access_token)
curl -s -X POST "$API/api/generate" -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello in 3 words.","model":"gpt-5.2"}' | jq .generation.status
```

## Definition of Done — Launch

A new user can:
1. Land on the homepage
2. Sign up (or Google sign-in) in <30s
3. Generate something useful in <60s
4. See it persist in their dashboard
5. See credits deducted accurately

The owner can:
1. Sign in
2. See platform stats at a glance
3. Search any user, view their full history
4. Adjust any user's credits with reason
5. Audit every action taken on the platform
