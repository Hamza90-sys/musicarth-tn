# Musicarth — Deployment Guide

**Architecture (final):**

```
Supabase   →  PostgreSQL database (managed, EU region)   ✅ already provisioned + migrated
Railway    →  NestJS backend API (long-running) + Redis  (WebSockets, cron, live sessions)
Vercel     →  4 frontends (landing, student, instructor, admin) — TanStack Start SSR
```

The backend **must** run on Railway (not Vercel) — it's a long-running process with a
Socket.io gateway, background jobs, and payment webhooks. The frontends deploy to
Vercel (they build to the Build Output API, auto-detected).

> Do the steps in order. Email (Resend) is intentionally **last** — everything else is
> proven before onboarding emails go live.

---

## 0. Accounts you need
- [x] **Supabase** — done (project `musicarth`, migrated, admin seeded).
- [ ] **Railway** — backend + Redis.
- [ ] **Vercel** — 4 frontends.
- [ ] **Domain registrar** — your domain (needed for email + clean URLs).
- [ ] **Mux**, **Daily**, **Flouci** — already have keys; just configure webhooks.
- [ ] **Sentry** (optional but recommended) — error monitoring.
- [ ] **Resend** — email (LAST step, needs the domain).

Pick your domain now, e.g. `musicarth.com`. Sub-domains used below:
- Landing → `musicarth.com`
- Student → `app.musicarth.com`
- Instructor → `teach.musicarth.com`
- Admin → `admin.musicarth.com`
- API → `api.musicarth.com`

---

## 1. Supabase (database) — ✅ done
Already provisioned, all migrations applied, admin seeded. Nothing to do except keep
your connection strings handy for Railway:
- `DATABASE_URL` = transaction pooler (port **6543**, `?pgbouncer=true`)
- `DIRECT_URL` = session pooler (port **5432**)

> If you ever reset the DB password, update both strings in Railway.

---

## 2. Railway (backend API + Redis)

### 2a. Create the services
1. New Project → **Deploy from GitHub repo** → pick this repo → set **Root Directory** to `Backend`.
2. In the same project: **New → Database → Redis**. Railway exposes `REDIS_URL` — reference it in the backend service's variables as `REDIS_URL`.
3. Build: Railway auto-detects the Dockerfile / Node. Start command: `node dist/main.js`
   (build runs `npm run build`, which also runs `prisma generate`).

### 2b. Run migrations on first deploy
Set the deploy/release command (Railway → Settings → Deploy) to:
```
npx prisma migrate deploy && node dist/main.js
```
(or run `npx prisma migrate deploy` once from the Railway shell). The schema is already on
Supabase, so this is a no-op safety net.

### 2c. Backend environment variables (Railway → Variables)

| Variable | Value / notes |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` (or leave to Railway's `$PORT`) |
| `API_PREFIX` | `api/v1` |
| `DATABASE_URL` | Supabase **pooled** string (6543) |
| `DIRECT_URL` | Supabase **direct** string (5432) |
| `SUPABASE_URL` | `https://gsoytqrqrhzkppkxvjbu.supabase.co` (image storage) |
| `SUPABASE_SERVICE_KEY` | Supabase **service_role** key (Settings → API) |
| `SUPABASE_STORAGE_BUCKET` | `media` (create a **public** bucket with this name) |
| `REDIS_URL` | reference Railway Redis |
| `JWT_ACCESS_SECRET` | **new** long random string (≥ 48 chars) |
| `JWT_REFRESH_SECRET` | **new** long random string, different from above |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `CORS_ORIGINS` | `https://musicarth.com,https://app.musicarth.com,https://teach.musicarth.com,https://admin.musicarth.com` |
| `PUBLIC_API_URL` | `https://api.musicarth.com/api/v1` (used for webhooks) |
| `STUDENT_APP_URL` | `https://app.musicarth.com` |
| `INSTRUCTOR_APP_URL` | `https://teach.musicarth.com` |
| `ADMIN_APP_URL` | `https://admin.musicarth.com` |
| `PLATFORM_FEE_PERCENT` | `30` |
| `FLOUCI_PUBLIC_TOKEN` | **regenerated** production token |
| `FLOUCI_PRIVATE_TOKEN` | **regenerated** production token |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | from Mux |
| `MUX_SIGNING_KEY_ID` / `MUX_SIGNING_PRIVATE_KEY` | from Mux (signed playback) |
| `MUX_WEBHOOK_SECRET` | set in step 4 |
| `DAILY_API_KEY` / `DAILY_DOMAIN` | from Daily |
| `SESSION_REMINDERS_ENABLED` | `true` (Railway Redis is v7 — BullMQ works) |
| `SENTRY_DSN` | from Sentry (optional; enables backend monitoring) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed admin (only used by `npm run seed`) |
| `RESEND_API_KEY` / `MAIL_FROM` | **LAST step** (section 6) |

Generate secrets: `openssl rand -hex 48` (or any long random string).

### 2d. Custom domain
Railway → Settings → Networking → add `api.musicarth.com` → set the CNAME at your registrar.

---

## 3. Vercel (4 frontends)

Create **4 separate Vercel projects** from this repo, each with a different **Root Directory**:

| Project | Root Directory | Domain |
|---|---|---|
| musicarth-landing | `Frontend/landing-page` | `musicarth.com` |
| musicarth-student | `Frontend/student-dashboard` | `app.musicarth.com` |
| musicarth-instructor | `Frontend/instructor-dashboard` | `teach.musicarth.com` |
| musicarth-admin | `Frontend/admin-dashboard` | `admin.musicarth.com` |

Each builds with `npm run build` → output `.vercel/output` (auto-detected).

### Frontend environment variables (set on **each** Vercel project)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.musicarth.com/api/v1` |
| `VITE_STUDENT_DASHBOARD_URL` | `https://app.musicarth.com` |
| `VITE_INSTRUCTOR_DASHBOARD_URL` | `https://teach.musicarth.com` |
| `VITE_ADMIN_DASHBOARD_URL` | `https://admin.musicarth.com` |
| `VITE_SENTRY_DSN` | frontend Sentry DSN (optional) |

> After setting env vars, **redeploy** so the build picks them up.

---

## 4. External services (webhooks)

### Mux
- Dashboard → Settings → Webhooks → add `https://api.musicarth.com/api/v1/webhooks/mux`.
- Copy the signing secret → set `MUX_WEBHOOK_SECRET` in Railway.
- Result: uploaded lesson videos flip to **Ready** instantly (no manual "Check" needed).

### Daily
- Confirm `DAILY_API_KEY` + `DAILY_DOMAIN` are set in Railway. Live rooms then provision automatically.

### Flouci (payments)
- **Regenerate** both tokens (the old ones were shared in chat) → set the production
  `FLOUCI_PUBLIC_TOKEN` / `FLOUCI_PRIVATE_TOKEN` in Railway.
- Set the **webhook / notification URL** to `https://api.musicarth.com/api/v1/payments/flouci/webhook`.
- Confirm your **payout bank account (RIB)** is linked so settled funds land somewhere.

---

## 5. Sentry (recommended — error monitoring)
1. Create a Sentry project → get the **backend DSN** and a **frontend DSN**.
2. Railway: `SENTRY_DSN` = backend DSN.
3. Vercel (each project): `VITE_SENTRY_DSN` = frontend DSN.
Without a DSN, monitoring is a silent no-op — the app runs identically.

---

## 6. Email (Resend) — FINAL step
1. Buy/verify your domain in Resend (add the DNS records).
2. Railway: `RESEND_API_KEY` = your key, `MAIL_FROM` = `Musicarth <noreply@musicarth.com>`.
3. This activates onboarding emails (approval → set-password link) and password reset.
   Until this is set, those links are only printed to the backend logs.

---

## 7. Go-live checklist
- [ ] Backend healthy: `GET https://api.musicarth.com/api/v1/health` → `{"status":"ok"}`.
- [ ] All 4 frontends load over HTTPS.
- [ ] Sign in as admin (`ADMIN_EMAIL`) on `admin.musicarth.com`.
- [ ] **Real payment test**: set a course to **1 TND**, buy it end-to-end, confirm enrollment, then refund it from Admin → Payments.
- [ ] Upload a lesson video → confirms it flips to Ready via the Mux webhook.
- [ ] Create a live session starting now → both instructor + student can join.
- [ ] Approve a test application → the set-password email arrives (post-Resend).
- [ ] Trigger a deliberate error → confirm it shows in Sentry.
- [ ] Point DNS to production. 🚀

## Rollback
- Railway keeps previous deploys — one-click **Redeploy** an earlier build.
- Vercel keeps every deployment — **Promote** a previous one instantly.
- Database migrations are additive; avoid destructive migrations near launch.

## Scaling notes (later, not for launch)
- The API is single-instance-ready. To run **2+ backend instances**, add a
  `@socket.io/redis-adapter` to the notifications gateway (the rate limiter is
  already Redis-shared). Not needed until you outgrow one box.
- Move course/avatar images from data-URLs to object storage (Supabase Storage / R2)
  before heavy traffic — see the app's uploads module.
