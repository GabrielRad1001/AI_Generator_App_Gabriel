# OtsAI — Universal AI Generator Platform

> A builder-grade workspace that turns plain language into plans, code, content, ideas, and entire projects — powered by GPT-5.2, Claude Sonnet 4.5, and Gemini 3 Pro, in one place.

![OtsAI](https://img.shields.io/badge/status-alpha-00FFA3?style=flat-square) ![FastAPI](https://img.shields.io/badge/backend-FastAPI-00FFA3?style=flat-square) ![React](https://img.shields.io/badge/frontend-React_18-00FFA3?style=flat-square) ![MongoDB](https://img.shields.io/badge/db-MongoDB-00FFA3?style=flat-square)

---

## ✨ What's inside

- **Premium green-emerald dark UI** — Geist + JetBrains Mono, asymmetric layouts, micro-animations
- **Multi-model AI generation** — GPT-5.2, Claude Sonnet 4.5, Gemini 3 Pro (via Emergent Universal Key)
- **Dual auth** — JWT email/password + Emergent Google OAuth
- **Audit-grade credit system** — every credit movement logged, admin can adjust with reason
- **Full admin panel** — users, credits, projects monitor, audit log
- **30/30 backend tests passing** ✅

---

## 🛠 Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and Yarn
- MongoDB 6+ running locally (or a connection string)

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

Edit `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=otsai_database
JWT_SECRET=<rotate-me-for-production>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=10080
EMERGENT_LLM_KEY=<your-emergent-key>      # or replace with your own LLM keys
ADMIN_EMAIL=gabriel.rad1001@gmail.com
ADMIN_PASSWORD=OtsAI@Admin2026!
ADMIN_NAME=Gabriel
NEW_USER_STARTING_CREDITS=100
ADMIN_STARTING_CREDITS=10000
```

Run:
```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The admin user is auto-seeded on first boot.

### 2. Frontend

```bash
cd frontend
yarn install
```

Edit `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
```

Run:
```bash
yarn start
```

Visit `http://localhost:3000`.

### 3. Sign in
- Email: `gabriel.rad1001@gmail.com`
- Password: `OtsAI@Admin2026!`

---

## 🧪 Tests

```bash
cd backend && python -m pytest tests/ -v
```

30 tests cover auth, RBAC, credit ledger, real LLM calls, admin adjustments, audit logs.

---

## 📁 Project Structure

```
otsai/
├── backend/
│   ├── server.py                  # FastAPI single-file app (~700 lines)
│   ├── requirements.txt
│   ├── tests/                     # pytest suite (30 tests)
│   └── .env                       # ⚠️ rotate JWT_SECRET before production
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Router + AuthProvider
│   │   ├── pages/                 # Landing, Login, Dashboard, Generate, Admin, …
│   │   ├── components/ui/         # Button, Card, Input primitives
│   │   ├── context/AuthContext.js
│   │   └── lib/api.js             # axios client
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env
├── memory/                        # 📚 Full product docs
│   ├── PRD.md
│   ├── TDD.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_REFERENCE.md
│   ├── EMERGENT_APPROACH.md
│   ├── MVP_CHECKLIST.md
│   ├── LAUNCH_CHECKLIST.md
│   └── test_credentials.md
├── design_guidelines.json         # Brand tokens & component spec
├── auth_testing.md                # OAuth testing playbook
└── README.md                      # this file
```

---

## ⚠️ Production Hardening (do before public traffic)

See `memory/LAUNCH_CHECKLIST.md` for the full list. Critical items:

1. **Rotate `JWT_SECRET`** to a 64-char random secret in your secrets manager
2. **Restrict CORS** `allow_origins` to your production domain (currently `*` for dev)
3. **Add rate limiting** on `/auth/login` and `/auth/signup` (recommend `slowapi`)
4. **Atomic credit deduction** with `findOneAndUpdate { credits: $gte: cost }, $inc: -cost`
5. **CSP / HSTS / X-Frame-Options** headers on the frontend host

---

## 🗺 Roadmap

**Next iteration (P1)**
- Streaming generation (SSE)
- Prompt templates library
- Markdown rendering of LLM output
- Notifications system + email digests
- Generation export (Markdown/PDF)

**Future**
- Mobile app (Expo/React Native)
- Stripe billing (architecture-ready, drop-in)
- Public OtsAI API + key issuance
- Team workspaces & seats
- Plugins (Slack, Notion, GitHub)
- Image & video generation (Nano Banana, Sora)

---

## 📜 License

Private — © Gabriel / OtsAI by Gabriel, 2026.
