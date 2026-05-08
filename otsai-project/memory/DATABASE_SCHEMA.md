# OtsAI — Database Schema (MongoDB)

All collections use a custom UUID-prefixed string ID (e.g. `user_42f07b7ffec3`). MongoDB's `_id` is **never** exposed in API responses (`{"_id": 0}` projection on every query).

## Collections

### `users`
| Field | Type | Notes |
|---|---|---|
| `user_id` | str | PK, `user_<12hex>` |
| `email` | str | unique, lowercased |
| `name` | str | |
| `role` | str | `user` \| `admin` |
| `credits` | int | live balance, mutates with txns |
| `auth_provider` | str | `password` \| `google` |
| `password_hash` | str | bcrypt; `null` for google users |
| `picture` | str? | google avatar |
| `created_at` | datetime (UTC) | |
| `is_active` | bool | |

**Indexes**: `user_id` unique, `email` unique.

### `user_sessions`
For Emergent Google OAuth (7-day session tokens).
| Field | Type | Notes |
|---|---|---|
| `session_token` | str | PK from Emergent auth |
| `user_id` | str | FK → users |
| `expires_at` | datetime (UTC) | |
| `created_at` | datetime (UTC) | |

**Indexes**: `session_token` unique, `user_id`.

### `projects`
| Field | Type | Notes |
|---|---|---|
| `project_id` | str | PK, `proj_<12hex>` |
| `user_id` | str | FK |
| `title` | str | 1-120 chars |
| `description` | str | 0-2000 chars |
| `status` | str | `active` \| `archived` |
| `created_at` / `updated_at` | datetime | |
| `generation_count` | int | denormalized counter via `$inc` |

**Indexes**: `project_id` unique, `(user_id, created_at desc)`.

### `generations`
| Field | Type | Notes |
|---|---|---|
| `generation_id` | str | PK, `gen_<14hex>` |
| `user_id` | str | FK |
| `project_id` | str? | FK, optional |
| `prompt` | str | 1-8000 |
| `model` | str | e.g. `gpt-5.2` |
| `provider` | str | `openai` \| `anthropic` \| `gemini` |
| `output` | str | LLM response |
| `credits_used` | int | 0 if error |
| `status` | str | `success` \| `error` |
| `error` | str? | trimmed exception message |
| `created_at` | datetime | |

**Indexes**: `generation_id` unique, `(user_id, created_at desc)`.

### `credit_transactions` (the ledger)
Every balance movement is a row here.
| Field | Type | Notes |
|---|---|---|
| `transaction_id` | str | PK |
| `user_id` | str | FK |
| `amount` | int | + (add) or − (deduct) |
| `balance_after` | int | snapshot for reconciliation |
| `type` | enum | `signup_bonus` \| `generation` \| `admin_adjust` \| `promo` \| `correction` \| `test` \| `refund` \| (future: `purchase`) |
| `reference_id` | str? | `generation_id` or `adjustment_id` |
| `description` | str | human-readable |
| `created_at` | datetime | |

**Indexes**: `transaction_id` unique, `(user_id, created_at desc)`.

### `admin_adjustments`
One row per admin credit action (richer than the txn).
| Field | Type | Notes |
|---|---|---|
| `adjustment_id` | str | PK |
| `admin_user_id` | str | who did it |
| `admin_email` | str | denormalized |
| `target_user_id` | str | who got adjusted |
| `target_email` | str | |
| `amount_requested` | int | what admin asked for |
| `amount_applied` | int | actually applied (may differ if clamped to 0) |
| `balance_after` | int | |
| `adjustment_type` | enum | `add` \| `deduct` \| `promo` \| `correction` \| `test` |
| `reason` | str | required, 1-500 |
| `note` | str? | optional, 0-1000 |
| `created_at` | datetime | |

### `audit_logs`
Append-only, sortable.
| Field | Type | Notes |
|---|---|---|
| `log_id` | str | PK |
| `actor_user_id` | str | |
| `actor_email` | str | |
| `action` | str | e.g. `admin.credit_adjust` |
| `target_type` | str? | e.g. `user` |
| `target_id` | str? | |
| `metadata` | object | free-form context |
| `ip` | str? | |
| `created_at` | datetime | |

**Index**: `(created_at desc)`.

## Future Collections (architecture-ready, not created)

- `templates` — prompt templates with versioning
- `notifications` — per-user notification queue
- `feature_flags` — feature gating + percentage rollout
- `api_keys` — public OtsAI API
- `deployments` — when projects publish
- `purchases` — Stripe / subscription receipts (drop-in)

## Reconciliation Invariants

For any user:
- `user.credits` = sum of `credit_transactions.amount` for that user
- Latest `credit_transactions.balance_after` for that user = `user.credits`
- Every `admin_adjustments` row has a sibling `audit_logs` row with `action="admin.credit_adjust"` referencing it via `metadata.adjustment_id`
