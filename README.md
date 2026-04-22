# Sloe Laboratory

The client-facing surface of SLOE Labs Inc. — a gallery of pre-built OS demos across industries, plus the Architect: an AI agent that shapes a custom OS for each prospect in under 5 minutes.

## The flow

1. **Gallery** — prospects browse demos by industry (Real Estate, Football, Design, PE, Trade, Academy)
2. **Demo detail** — they click a demo, explore the modules, and hit "Build mine like this"
3. **Build** — the Architect inherits their industry context, runs a 3-gate conversation, and renders a live OS preview
4. **Deploy** — they book a 20-minute call to activate. Ships in 2 days.

## Deploy to Vercel

**Step 1 — Push to GitHub**

Unzip this folder, cd into it, then:
```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/JacobKayembekazadi/sloe-laboratory.git
git push -u origin main
```

**Step 2 — Import to Vercel**

1. Go to vercel.com → Add New → Project
2. Import `sloe-laboratory` from GitHub
3. Framework preset: **Vite** (should auto-detect)
4. Environment Variables: add `GEMINI_API_KEY` with your Gemini API key
5. Deploy

Two minutes later: `sloe-laboratory.vercel.app`

**Step 3 — Custom domain (optional)**

In the Vercel dashboard → Settings → Domains → add `lab.sloelabs.com` or similar.

## Run locally

```
npm install
cp .env.example .env.local
# edit .env.local and add your real GEMINI_API_KEY
npm run dev
```

Open http://localhost:3000.

## Architecture

- **Frontend:** Vite + React 19 + React Router 7 + Tailwind + Framer Motion
- **Backend:** Vercel serverless function in `/api/chat.ts`
- **AI:** Gemini 2.5 Flash via `@google/genai`
- **Routing:** `/` (Gallery) · `/demo/:id` · `/build?from=xxx&industry=yyy` · `/my-os`

## Key files

- `systemPrompt.ts` — the Architect's behavior, the three confirmation gates, inherited-context handling
- `api/chat.ts` — Vercel serverless function: Gemini API + URL fetching + gallery context injection
- `server.ts` — local development server (not used in production)
- `src/demos.ts` — the demo catalog
- `src/pages/Gallery.tsx` — the showroom
- `src/pages/DemoDetail.tsx` — individual demo pages
- `src/pages/Build.tsx` — the Architect conversation + live OS preview
