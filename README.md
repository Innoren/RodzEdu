# RodzEdu

Next.js App Router app for RodzEdu, ready for local Cursor/VS Code development and Cursor Cloud Agents.

## Prerequisites

- Node.js 20+ (22 recommended)
- npm

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |

## IDE / Cloud Agents

- Workspace recommendations: `.vscode/extensions.json`
- Editor settings: `.vscode/settings.json`
- Cloud environment: `.cursor/environment.json` (`npm install`, auto-starts `npm run dev` on port 3000)
- Agent guidance: `AGENTS.md` and `.cursor/rules/`

Deploy target: [rodz-edu.vercel.app](https://rodz-edu.vercel.app)
