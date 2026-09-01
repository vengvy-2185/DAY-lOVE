# Day Life — Deployment Guide

## 1. Provision Supabase

1. Create a free project at https://supabase.com.
2. In **Settings → Database**, copy the connection string (use the pooled
   "Transaction" URI for serverless hosts) into `DATABASE_URL`.
3. In **Storage**, create a bucket named `day-life-media` (or match
   `SUPABASE_BUCKET`), and set it to **public** (media URLs are unguessable
   UUID keys, so public read is fine for this use case; tighten with signed
   URLs later if you need stricter privacy).
4. In **Settings → API**, copy the `service_role` key into
   `SUPABASE_SERVICE_ROLE_KEY`. Never expose this key to the frontend.

## 2. Apply the schema

Option A — Prisma (recommended, keeps schema.prisma as source of truth):
```bash
cd server
cp .env.example .env   # fill in DATABASE_URL etc.
npm install
npx prisma migrate dev --name init
```

Option B — raw SQL: run `sql/schema.sql` in the Supabase SQL editor.

## 3. Schedule auto-delete

The Node cron job in `server/src/jobs/autoDelete.js` runs automatically
whenever the server process is alive (interval set by `AUTO_DELETE_CRON`,
default every 15 minutes) and also cleans up Supabase Storage objects.

If you deploy the server somewhere that sleeps or scales to zero (serverless),
add a backstop using **Supabase Cron** (Dashboard → Database → Cron Jobs):
- Schedule: `*/15 * * * *`
- Command: contents of `sql/auto_delete.sql`

Note the SQL-only cron cannot delete Storage objects — keep at least one
long-running instance of the Node server (or a scheduled serverless
function calling `runAutoDelete()`) for full media cleanup.

## 4. Seed the first admin

```bash
cd server
PHONE="+15551234567" NAME="Admin" node src/utils/seedAdmin.js
```
This prints a one-time 6-digit code (valid 5 minutes) — use it to log in
as admin for the first time. From then on, the admin dashboard generates
codes for every other user.

## 5. Deploy the backend

Any Node host works (Render, Railway, Fly.io, a VPS). Example (Render):
1. New Web Service → point at `server/`.
2. Build command: `npm install && npx prisma generate`
3. Start command: `npm start`
4. Add all vars from `server/.env.example`.
5. Set `CLIENT_ORIGIN` to your deployed frontend URL (needed for CORS and
   Socket.IO).

## 6. Deploy the frontend

1. `cd client && cp .env.example .env` and set `VITE_API_URL` to your
   backend's public URL.
2. `npm install && npm run build` → deploy the `dist/` folder to
   Vercel/Netlify/Cloudflare Pages, or serve it with the provided
   `client/Dockerfile`.

## 7. Local development (Docker)

```bash
docker compose up --build
```
Starts Postgres, the API on :4000, and the frontend on :5173. Fill in
`server/.env` first (copy from `.env.example`); `DATABASE_URL` gets
overridden to point at the local `db` service automatically.

## 8. Production checklist

- [ ] `JWT_SECRET` is a long random value, different per environment.
- [ ] Supabase bucket policies reviewed (public read is used here for
      simplicity — switch to signed URLs if you need private media).
- [ ] HTTPS enforced at your host/load balancer (Helmet handles response
      headers, not TLS termination).
- [ ] `CLIENT_ORIGIN` locked to your real frontend domain, not `*`.
- [ ] Rate limits in `server/src/middleware/rateLimit.js` tuned to your
      expected traffic.
- [ ] At least one long-lived process running the auto-delete cron, or a
      scheduled function calling it, so media doesn't outlive messages.
