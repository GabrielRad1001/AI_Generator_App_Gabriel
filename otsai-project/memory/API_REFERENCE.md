# OtsAI — API Reference

Base: `${REACT_APP_BACKEND_URL}/api`

All authenticated endpoints accept either:
- `Authorization: Bearer <jwt>` (email/password flow)
- `Cookie: session_token=<token>` (Google OAuth flow)
- `Authorization: Bearer <session_token>` (fallback)

---

## Health

### `GET /api/`
Returns `{ "app": "OtsAI", "status": "ok", "version": "1.0.0" }`. No auth.

### `GET /api/health`
Returns `{ "status": "healthy", "time": "<iso>" }`.

---

## Auth

### `POST /api/auth/signup`
Body: `{ email, password (≥8), name }`. Returns:
```json
{ "access_token": "<jwt>", "token_type": "bearer", "user": { ...UserPublic } }
```
Side effects: writes `users` row (100 credits), `credit_transactions` (signup_bonus), `audit_logs` (user.signup).

### `POST /api/auth/login`
Body: `{ email, password }`. Returns same shape as signup. 401 on bad credentials.

### `POST /api/auth/google/session`
Body: `{ session_id }` (from Emergent OAuth redirect hash). Backend resolves identity via `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data`, upserts user, sets `session_token` httpOnly cookie. Returns `{ user }`.

### `GET /api/auth/me`
Returns the current `UserPublic` (no `password_hash`).

### `POST /api/auth/logout`
Deletes server-side session row + clears `session_token` cookie. JWT clients simply drop their token.

---

## Generation

### `GET /api/generate/models`
Returns the model registry:
```json
{ "models": [
  { "id": "gpt-5.2", "label": "GPT-5.2", "provider": "openai", "credits": 5 },
  { "id": "claude-sonnet-4-5-20250929", "label": "Claude Sonnet 4.5", "provider": "anthropic", "credits": 5 },
  { "id": "gemini-3.1-pro-preview", "label": "Gemini 3 Pro", "provider": "gemini", "credits": 4 }
]}
```

### `POST /api/generate`
Body:
```json
{ "prompt": "string ≤ 8000 chars", "model": "gpt-5.2", "project_id": "proj_..." (optional), "system_message": "optional override" }
```
Behavior:
1. Validates model and project ownership (if `project_id`).
2. 402 if `user.credits < model.credits`.
3. Calls LLM via `emergentintegrations`.
4. On success: deducts credits, writes `generations` row, `credit_transactions` (type=generation), `$inc` `projects.generation_count`.
5. On failure: writes `generations` row with `status=error`, no credit deduction.

Returns `{ generation, balance }`.

### `GET /api/generations?limit=50`
List user's generations, newest first. Max 200.

---

## Projects

### `GET /api/projects`
Returns `{ projects: [...] }`.

### `POST /api/projects`
Body: `{ title, description? }`. Returns `{ project }`.

### `GET /api/projects/{project_id}`
Returns `{ project, generations: [...] }`. 404 if not owned.

### `PATCH /api/projects/{project_id}`
Body: any of `{ title, description, status }`. Returns updated `{ project }`.

### `DELETE /api/projects/{project_id}`
Deletes project AND its generations.

---

## Credits

### `GET /api/credits/me`
Returns `{ balance: int, transactions: [...] }` (last 50, newest first).

---

## Admin (require role=admin → else 403)

### `GET /api/admin/stats`
```json
{ "users": int, "projects": int, "generations": int, "successful_generations": int, "total_credits_in_circulation": int }
```

### `GET /api/admin/users?q=<search>&limit=100`
Search by email, name, or `user_id`. Returns `{ users: [...] }`.

### `GET /api/admin/users/{user_id}`
Returns `{ user, transactions, projects }`.

### `POST /api/admin/credits/adjust`
Body:
```json
{
  "target_user_id": "user_...",
  "amount": 100,
  "adjustment_type": "add" | "deduct" | "promo" | "correction" | "test",
  "reason": "Onboarding bonus",
  "note": "optional"
}
```
- `add`/`promo`/`test` → coerced positive
- `deduct` → coerced negative
- `correction` → uses sign as provided
- Balance clamps at 0; `amount_applied` reports actual delta

Side effects: updates `users.credits`, writes `credit_transactions` (type=admin_adjust), `admin_adjustments`, `audit_logs` (action=admin.credit_adjust).

Returns `{ adjustment_id, balance_after, amount_applied }`.

### `GET /api/admin/audit?limit=100`
Audit log entries newest-first.

### `GET /api/admin/projects?limit=100`
All projects across users.

### `PATCH /api/admin/users/{user_id}/role?role=admin`
Promote/demote. Writes `audit_logs` (action=admin.role_change).

---

## Future Endpoints (architecture-reserved, not implemented)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/billing/checkout` | Stripe session |
| `POST` | `/api/billing/webhook` | Stripe webhook |
| `POST` | `/api/notifications/mark-read/{id}` | |
| `GET`  | `/api/templates` | Prompt templates library |
| `POST` | `/api/uploads/sign` | S3 signed URL |
| `POST` | `/api/deployments` | Project publishing |
| `GET`  | `/api/admin/feature-flags` | |

---

## Error Shape

FastAPI default: `{ "detail": "string" }` with HTTP status. Common codes:
- `401` — missing/invalid auth
- `402` — insufficient credits
- `403` — admin required
- `404` — not found / not owned
- `409` — email taken (signup)
- `422` — Pydantic validation
