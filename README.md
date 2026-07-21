# RodzEdu

Continuing education platform for healthcare professionals — starting with radiology.

Inspired by professional CE experiences: clear catalog browsing, phone/email support cues, and online testing — with modern role-based portals for students, teachers, admins, and the CEO.

## Features

- **Public marketing site** with radiology-first course catalog
- **Student portal** — enroll/pay, track progress, open exams
- **Teacher portal** — overview of assigned student progress
- **Admin portal** — upload and publish new courses + exams
- **CEO console** — separate management window for company oversight & site settings
- **Dedicated exam window** — exams open in their own popup/window
- **Checkout** — Stripe Checkout when keys are configured; demo enrollment otherwise

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo logins

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Student | student@rodzedu.com  | student123  |
| Teacher | teacher@rodzedu.com  | teacher123  |
| Admin   | admin@rodzedu.com    | admin123    |
| CEO     | ceo@rodzedu.com      | ceo123      |

## Stripe (optional)

Copy `.env.example` to `.env.local` and add Stripe keys. Without keys, “Enroll & Pay” still enrolls the student instantly for local demos.
