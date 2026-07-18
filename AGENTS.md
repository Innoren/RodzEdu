<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RodzEdu

Next.js App Router app for RodzEdu (TypeScript, Tailwind CSS v4, React Compiler).

## Commands

- `npm install` — install dependencies
- `npm run dev` — start local dev server on port 3000
- `npm run lint` — run ESLint
- `npm run build` — production build
- `npm start` — serve the production build

## Project layout

- App code lives under `src/app/`
- Static assets live under `public/`
- Cloud agent environment config: `.cursor/environment.json`

## Cursor Cloud specific instructions

- Dependencies: run `npm install` from the repo root (also configured as the environment `install` script).
- Dev server: `npm run dev` serves the app at `http://localhost:3000`. The environment starts this in a `dev` terminal automatically.
- Before finishing UI or routing work, run `npm run lint` and `npm run build`.
- Do not commit `.env*` secrets, `.vercel/`, `node_modules/`, or `.next/`.
- Prefer editing App Router files under `src/app/`. Read `node_modules/next/dist/docs/` when using Next.js APIs that may have changed.
