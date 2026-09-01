# Day Life

A private, invite-only chat app. No public sign-up: an admin issues each
user a single-use, 5-minute login code instead of a password. Messages
(text, images, video, voice notes) auto-delete 24 hours after they're sent.

## Stack

| Layer      | Choice                                   |
|------------|-------------------------------------------|
| Frontend   | React + Vite + Tailwind CSS               |
| Backend    | Node.js + Express                         |
| Realtime   | Socket.IO                                 |
| Database   | PostgreSQL (Supabase)                     |
| ORM        | Prisma                                    |
| Storage    | Supabase Storage                          |
| Auth       | JWT + bcrypt-hashed one-time codes        |
| Validation | Zod                                       |

## How login works

1. Admin generates a 6-digit code for a user's phone number
   (`POST /admin/code`). The plaintext code is shown to the admin exactly
   once and stored only as a bcrypt hash.
2. Admin approves the user in **User Management** (new users start
   unapproved).
3. User enters their phone number (`POST /auth/login`) and then the code
   (`POST /auth/verify`). The code expires after 5 minutes and is marked
   used on first successful verification — it cannot be replayed.
4. On success, the server issues a JWT and stores a hash of it in the
   `sessions` table, so an admin disabling a user immediately revokes
   their active session too.

## Project structure

```
day-life/
├── web-demo/index.html       # Standalone, backend-free preview (open directly in a browser)
├── prisma/schema.prisma      # Prisma models (source of truth for the DB)
├── sql/
│   ├── schema.sql            # Equivalent raw SQL (if not using Prisma migrate)
│   └── auto_delete.sql       # 24h cleanup query + pg_cron/Supabase Cron setup
├── server/                   # Express + Socket.IO API
│   └── src/
│       ├── routes/           # auth, admin, chat, upload
│       ├── controllers/
│       ├── middleware/       # JWT auth, admin guard, rate limiting, errors
│       ├── sockets/          # join_room, typing, send_message, online, read_receipt
│       ├── jobs/autoDelete.js
│       └── utils/            # jwt, otp, validation (Zod), seedAdmin script
├── client/                   # React + Vite + Tailwind
│   └── src/
│       ├── pages/            # Login, Chat, AdminDashboard, UserManagement
│       ├── components/       # ChatBubble, VoicePlayer, ImagePreview, VideoPlayer,
│       │                     # TypingIndicator, OnlineStatus, MessageInput, Sidebar
│       ├── context/AuthContext.jsx
│       └── api/              # axios instance, socket.io client
├── docker-compose.yml
└── DEPLOYMENT.md
```

## Quick start (local)

```bash
# 1. Database + storage
#    Create a free Supabase project, then either:
#      npx prisma migrate dev   (from server/, after filling in .env)
#    or run sql/schema.sql in the Supabase SQL editor.

# 2. Backend
cd server
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, SUPABASE_* vars
npm install
npx prisma generate
npm run dev                # http://localhost:4000

# 3. Seed an admin (separate terminal)
PHONE="+15551234567" NAME="Admin" node src/utils/seedAdmin.js

# 4. Frontend
cd ../client
cp .env.example .env       # VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:5173
```

Log in with the phone number you seeded and the printed one-time code.

Full production deployment steps (Supabase setup, hosting, cron backstop,
security checklist) are in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## API summary

**Auth** — `POST /auth/login`, `POST /auth/verify`, `POST /auth/logout`

**Admin** (JWT + `isAdmin` required) — `POST /admin/code`,
`GET /admin/users`, `PATCH /admin/users/:id`, `DELETE /admin/codes/:codeId`,
`DELETE /admin/messages/:id`, `DELETE /admin/rooms/:id`

**Chat** (JWT required) — `GET /rooms`, `POST /rooms`,
`GET /messages/:roomId`, `POST /messages`, `POST /upload`

**Socket.IO events** — `join_room`, `leave_room`, `send_message`,
`receive_message`, `typing`, `online`, `read_receipt`

## Security notes

- Passwords/codes are never stored in plaintext — only bcrypt hashes.
- JWTs are additionally tied to a `sessions` row so admins can revoke
  access instantly (disabling a user deletes their sessions).
- `helmet`, `cors` (locked to `CLIENT_ORIGIN`), and `express-rate-limit`
  are applied globally; auth endpoints get a tighter limiter.
- All request bodies are validated with Zod before hitting a controller.
- Uploads are validated by MIME type (not file extension), capped at
  50MB, and stored under random UUID keys — never the original filename.
- Prisma parameterizes every query, so there's no raw SQL string
  concatenation and no SQL-injection surface in the app layer.
- React escapes all rendered content by default, avoiding XSS from
  message text; the app never uses `dangerouslySetInnerHTML`.

## Known limits / next steps

- Voice/video **calls** are intentionally out of scope — this is
  messaging only (voice notes, images, video files, text).
- Media is public-read in Supabase Storage for simplicity (keys are
  unguessable UUIDs); swap in signed URLs if you need stricter privacy.
- Read receipts are broadcast per-socket in real time but not persisted;
  add a `read_at` column/table if you need it to survive reloads.
