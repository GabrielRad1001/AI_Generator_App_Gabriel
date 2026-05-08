# OtsAI — Test Credentials

## Owner / Admin Account
- **Email**: `gabriel.rad1001@gmail.com`
- **Password**: `OtsAI@Admin2026!`
- **Role**: `admin`
- **Starting credits**: 10,000

## New User Default
- Any signup gets **100 starter credits**.
- Default role: `user`.

## Auth Methods
1. **Email/password** — JWT-based. Token returned on `/api/auth/signup` and `/api/auth/login`. Stored in `localStorage` as `otsai_token`. Sent as `Authorization: Bearer <token>`.
2. **Google OAuth (Emergent-managed)** — frontend redirects to `https://auth.emergentagent.com/?redirect={origin}/dashboard`. Returns to `/dashboard#session_id=...`. Frontend exchanges via `POST /api/auth/google/session`. Backend stores 7-day session in `user_sessions` collection and sets httpOnly cookie `session_token`.

## RBAC
- `user` — projects, generations, credit ledger (own only)
- `admin` — full access to all `/api/admin/*` routes (users mgmt, credit adjustments, audit logs, projects monitor)

## Test Identities (Google Auth)
Any allowed Google account can sign in. New ones auto-provision as `user` role with 100 credits. Promote to admin via `PATCH /api/admin/users/{user_id}/role?role=admin` (admin-only).
