# OtsAI — Technical Design Document (TDD)

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + CRA + Tailwind 3 | Mature, fast HMR, ecosystem matches Emergent platform |
| Routing | react-router-dom v6 | Nested routes, layout system |
| HTTP | axios w/ interceptor | Auto-attach JWT, `withCredentials` for OAuth cookies |
| Toasts | sonner | Minimal, dark-theme friendly |
| Icons | lucide-react | Consistent stroke icons matching brand |
| Backend | FastAPI 0.115 + Uvicorn | Async-native, OpenAPI built-in, type-safe |
| DB | MongoDB 7 (Motor async) | Schema-flexible for prompt outputs, fast iteration |
| Auth | JWT (jose) + bcrypt + Emergent Google OAuth | Both flows on same `users` collection |
| LLM | `emergentintegrations` library | Single key for OpenAI / Anthropic / Gemini |
| Process mgr | Supervisor | Platform default, hot reload enabled |
| Storage | MongoDB only (Phase 1) | S3 added post-MVP for asset uploads |

## Service Layout

```
/app
├── backend/
│   ├── server.py                    # Single-file FastAPI app (700 lines)
│   ├── tests/                       # pytest suite (30 tests)
│   ├── requirements.txt
│   └── .env                         # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY, ADMIN_*
└── frontend/
    ├── src/
    │   ├── App.js                   # Router + AuthProvider
    │   ├── context/AuthContext.js   # User state, login/signup/logout
    │   ├── lib/api.js               # axios client + endpoint helpers
    │   ├── lib/utils.js             # cn() helper
    │   ├── components/ui/           # Button, Card, Input primitives
    │   └── pages/
    │       ├── Landing.jsx          # Marketing (hero, features, FAQ)
    │       ├── Login.jsx, Signup.jsx, AuthCallback.jsx
    │       ├── AppShell.jsx         # Sidebar layout for authed routes
    │       ├── Dashboard.jsx        # Stats + recent generations + projects
    │       ├── Generate.jsx         # Multi-model prompt → output
    │       ├── Projects.jsx, ProjectDetail.jsx
    │       ├── CreditsPage.jsx      # User credit ledger
    │       ├── Settings.jsx
    │       └── Admin.jsx            # 4-tab admin panel
    ├── tailwind.config.js           # Brand tokens (bg/line/ink/brand)
    ├── public/index.html            # Geist + JetBrains Mono fonts
    └── .env                         # REACT_APP_BACKEND_URL
```

## Auth Flow

### Email/Password
1. `POST /api/auth/signup` → bcrypt hash, insert user, write `signup_bonus` txn, return JWT
2. `POST /api/auth/login` → verify bcrypt, return JWT
3. Frontend stores `otsai_token` in `localStorage`, axios interceptor attaches `Authorization: Bearer`

### Emergent Google OAuth
1. Frontend → `https://auth.emergentagent.com/?redirect={origin}/dashboard`
2. Google → `{origin}/dashboard#session_id=...`
3. Synchronous router check in `App.js` mounts `<AuthCallback>` BEFORE protected routes
4. `AuthCallback` calls `POST /api/auth/google/session` with `{ session_id }`
5. Backend calls `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data` with `X-Session-ID` header
6. Backend upserts user in `users` (auto-creates if new with 100 credits + signup_bonus txn), upserts session in `user_sessions` (7-day expiry), sets httpOnly cookie `session_token`
7. Backend returns user; frontend redirects to `/dashboard`

### Combined `get_current_user` Dependency
Resolves user via:
1. `Cookie: session_token` (Google)
2. `Authorization: Bearer <jwt>` (email/password)
3. `Authorization: Bearer <session_token>` (fallback)

## Credits

- Read-then-write on `/generate` (acknowledged race-condition risk; backlog P0)
- Atomic-friendly path on `/admin/credits/adjust` clamps `max(0, balance + delta)` and records `amount_applied`
- Each balance change writes a `credit_transactions` row with `balance_after` snapshot for reconciliation
- Admin adjustments additionally write to `admin_adjustments` (one row per action) AND `audit_logs`

## RBAC

- Single string field `user.role ∈ {"user", "admin"}`
- `require_admin` dependency wraps every `/admin/*` route → 403 if not admin
- Admin can demote themselves (intentional — self-management); audit log records every role change

## LLM Integration

```python
chat = LlmChat(
    api_key=EMERGENT_LLM_KEY,
    session_id=generation_id,
    system_message="You are OtsAI — a universal AI generator…",
).with_model(provider, model)
output = await chat.send_message(UserMessage(text=prompt))
```

Model registry maps user-facing IDs to `(provider, model, credit_cost)`:
- `gpt-5.2` → `("openai", "gpt-5.2", 5)`
- `claude-sonnet-4-5-20250929` → `("anthropic", "claude-sonnet-4-5-20250929", 5)`
- `gemini-3.1-pro-preview` → `("gemini", "gemini-3.1-pro-preview", 4)`

Credits deducted **only** on `status="success"`. Errors logged with `status="error"` and zero cost.

## Audit Logging

Every sensitive action calls `write_audit(actor, action, target_type, target_id, metadata)`:
- `user.signup`, `user.login`
- `admin.credit_adjust` (with full reason + amount metadata)
- `admin.role_change`

## Future-Proofing for Payments

The credit system intentionally treats credits as the unit of value. A `credit_transactions` row with `type="purchase"` and `reference_id=stripe_session_id` is the single needed shim to add billing. No data-model migration required.

## Mobile-Readiness

- All endpoints under `/api/*` — same surface for mobile
- JWT-based auth works identically from React Native; cookie path requires custom HTTP layer (Phase 2)
- No `_id` leakage, fully typed responses
- Design tokens in JSON (`/app/design_guidelines.json`) — direct port to RN StyleSheet

## Security

| Concern | Mitigation Today | Next |
|---|---|---|
| SQL injection | N/A (Mongo, parameterized queries) | — |
| XSS | React auto-escapes; no `dangerouslySetInnerHTML` | CSP header |
| CSRF | JWT in localStorage (not cookie) for password flow | CSRF token for cookie-based session_token |
| Brute force | None | Per-IP rate limit + lockout |
| ObjectId leakage | `{"_id": 0}` projection everywhere | — |
| Secrets | `.env` only, never committed | Vault/SOPS post-MVP |
| Admin abuse | Audit log for every admin action | 2-step confirm + email notification |

## Observability

- Supervisor log files: `/var/log/supervisor/{backend,frontend}.{out,err}.log`
- App logger `otsai` at INFO
- Next: structured JSON logs + uptime monitor

## Deploy

Platform: Emergent. Native deploy = supervisor + nginx-ingress. Hot reload during dev. Production: build frontend (`yarn build`), serve via static host, point ingress to backend uvicorn.

Migration strategy: MongoDB schemas are flexible; explicit migration scripts for additive fields only. No destructive changes without dual-write window.
