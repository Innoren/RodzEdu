# RodzEdu

A continuing-education (CE) marketplace for radiology professionals. Instructors
publish home-study courses; students enroll (free or paid), work through lessons,
and track their CE progress. Inspired by classic radiologic-technologist CE
providers.

## Features

- **Student login / registration** — role-based accounts (Student or Instructor), JWT session cookies.
- **Course catalog** — browse and filter published courses by imaging specialty (Mammography, CT, MRI, Ultrasound, Safety, …).
- **Enrollment & payment** — free courses enroll instantly; paid courses use **Stripe Checkout** when configured, with a built-in **demo enrollment fallback** so the app is fully usable without Stripe keys.
- **Course player** — students read lessons and mark them complete; per-course progress bars and CE credit tracking.
- **Instructor studio** — create/edit/publish courses, add and remove lessons, and view every enrolled student's progress.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, Turbopack) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Prisma 7](https://www.prisma.io) with a SQLite driver adapter (`@prisma/adapter-better-sqlite3`)
- [Stripe](https://stripe.com) Checkout (optional)
- Auth via `jose` (JWT) + `bcryptjs`

## Getting started

```bash
pnpm install          # installs deps and generates the Prisma client (postinstall)
pnpm db:push          # create the SQLite schema (prisma/dev.db)
pnpm db:seed          # load demo instructor, student, and courses
pnpm dev              # start the dev server at http://localhost:3000
```

### Demo accounts (created by the seed)

| Role       | Email                  | Password      |
| ---------- | ---------------------- | ------------- |
| Instructor | `teacher@rodzedu.com`  | `password123` |
| Student    | `student@rodzedu.com`  | `password123` |

## Scripts

| Command           | Description                                        |
| ----------------- | -------------------------------------------------- |
| `pnpm dev`        | Start the development server                        |
| `pnpm build`      | Production build                                    |
| `pnpm start`      | Run the production build                            |
| `pnpm lint`       | Run ESLint                                          |
| `pnpm db:push`    | Sync the Prisma schema to the database             |
| `pnpm db:seed`    | Seed demo data                                      |
| `pnpm db:reset`   | Reset the database and reseed                       |

## Environment variables

The app runs with zero configuration using sensible dev defaults. See
[`.env.example`](./.env.example) for all options. Notable ones:

- `DATABASE_URL` — defaults to `file:./prisma/dev.db` (SQLite). For production,
  switch `datasource.provider` in `prisma/schema.prisma` to `postgresql` and set
  a Postgres connection string.
- `AUTH_SECRET` — secret used to sign session JWTs (set a long random value in production).
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — enable real Stripe Checkout. Without them, enrollment uses the demo flow.

## Deployment

Deployable to any Node host or Vercel. For production, provide a persistent
database (Postgres recommended), set `AUTH_SECRET`, and — for real payments —
Stripe keys plus a webhook pointing at `/api/stripe/webhook`.
