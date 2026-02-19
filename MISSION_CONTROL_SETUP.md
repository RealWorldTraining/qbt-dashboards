# Mission Control Setup Guide

## Database Setup (Neon)

Mission Control uses Neon Postgres (Vercel's recommended database solution).

### 1. Create Neon Database

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to your Vercel project: https://vercel.com/data_dashboards/qbt-dashboards
2. Click "Storage" tab
3. Click "Create Database"
4. Select "Neon Postgres"
5. Name it: `qbt-mission-control`
6. Choose region closest to your users
7. Vercel will automatically:
   - Create the database
   - Add `DATABASE_URL` to environment variables
   - Pull the variable to `.env.local` (run `vercel env pull .env.local`)

**Option B: Via CLI**
```bash
cd /Users/professorx/clawd/qbt-dashboards
vercel link  # if not already linked
vercel postgres create qbt-mission-control
vercel env pull .env.local
```

### 2. Push Database Schema

After `DATABASE_URL` is in `.env.local`:

```bash
npm run db:push
```

This creates all tables (tasks, memories, cron_jobs, content_pipeline).

### 3. Verify Setup

Open Drizzle Studio to browse your database:

```bash
npm run db:studio
```

Opens at http://localhost:4983

---

## Development

**Start dev server:**
```bash
npm run dev
```

**Access Mission Control:**
http://localhost:3000/mission-control

---

## Database Schema

### Tasks
- id, title, description, status, priority, assigned_to, created_at, updated_at
- Status: `backlog | in_progress | blocked | done`
- Priority: `low | medium | high | urgent`

### Memories
- id, title, content, tags[], date, conversation_ref, created_at

### Cron Jobs
- id, name, description, schedule (cron), schedule_human, last_run, next_run, status, error_message

### Content Pipeline
- id, title, platform, status, script, thumbnail_url, notes, due_date, published_at, created_at, updated_at
- Status: `ideas | scripting | review | ready_to_film | published`

---

## Deployment

Changes pushed to `main` auto-deploy to Vercel.

Ensure `DATABASE_URL` is set in Vercel project environment variables (Production, Preview, Development).
