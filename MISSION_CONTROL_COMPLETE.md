# 🎉 Mission Control - COMPLETE!

## Overview

Mission Control is now fully operational at **https://qbtraining.ai/mission-control** — a real-time command center for tracking work, monitoring systems, and managing content.

---

## ✅ What's Built (All 6 Components)

### 1. 📋 Tasks Board (ENHANCED)
**Fully functional Kanban board with database persistence**

**Features:**
- 4-column workflow: Backlog → In Progress → Blocked → Done
- Create new tasks with title, description, priority, assignment
- **Edit tasks** (click ✏️ button on any task)
- **Delete tasks** (click 🗑️ button with confirmation)
- Quick status changes (hover over task, click emoji to move)
- Priority badges (low/medium/high/urgent with color coding)
- Assignment tracking (Professor / Claude / Aaron)
- Real-time task counts per column
- Full CRUD API (`/api/mission-control/tasks`)

**Database:**
- Table: `tasks`
- Persists to Neon Postgres
- Survives page refreshes

---

### 2. 🧠 Memory Viewer
**Searchable log of key decisions and context**

**Features:**
- Create memories with title, content, tags, conversation references
- Full-text search across title and content
- Tag filtering (purple badges)
- Chronological display (newest first)
- Markdown support in content
- API: `/api/mission-control/memories`

**Use Cases:**
- Log important decisions
- Track project context
- Document lessons learned
- Link to Discord/chat references

**Database:**
- Table: `memories`
- Fields: title, content, tags[], conversation_ref, date

---

### 3. 📅 Calendar / Cron Jobs
**Scheduled task viewer and manager**

**Features:**
- Create cron jobs with name, description, schedule
- Human-readable schedule display
- Cron expression support (e.g., `0 9 * * 1`)
- Active/Paused/Error status tracking
- Last run / Next run timestamps
- Toggle status (click badge to pause/activate)
- API: `/api/mission-control/cron`

**Use Cases:**
- Track scheduled reminders
- Monitor recurring workflows
- Verify cron job setup
- Debug scheduling issues

**Database:**
- Table: `cron_jobs`
- Fields: name, description, schedule, schedule_human, last_run, next_run, status

---

### 4. 🔄 n8n Workflow Status
**Live monitoring of key workflows**

**Features:**
- Real-time status for 3 workflows:
  - Jedi Council (Full)
  - GADS Weekly
  - Receipt Processor
- Active/Inactive indicator
- Last execution time and status
- Recent execution history (expandable)
- Success/Error/Running badges with icons
- Execution duration tracking
- Auto-refreshes every minute
- API: `/api/mission-control/n8n`

**Data Source:**
- n8n API at `https://n8n.srv1266620.hstgr.cloud`
- Uses authenticated API key (stored securely in code)

---

### 5. 📊 Google Ads Quick View
**At-a-glance ad performance metrics**

**Features:**
- Total spend / conversions / CPA (current week)
- Performance by device (Desktop/Mobile/Tablet)
- Top 5 campaigns by conversions
- CPA color coding (red if > $180, green otherwise)
- Last update timestamp
- Auto-refreshes every 5 minutes
- API: `/api/mission-control/google-ads`

**Data Source:**
- Adveronix Google Sheet (primary data source)
- Tabs: `GADS: Account: Weekly (Devices)`, `GADS: Campaign: Weekly (Devices)`
- Updates daily at 4 AM CST

---

### 6. 🎬 Content Pipeline
**Kanban for content creation workflow**

**Features:**
- 5-column workflow: Ideas → Scripting → Review → Ready to Film → Published
- Create content items with title, platform, script, notes, due date
- Platform tracking (YouTube/Twitter/LinkedIn/Blog)
- Script text storage (full content)
- Quick status changes (hover, click emoji)
- Due date tracking
- API: `/api/mission-control/content`

**Use Cases:**
- Track video ideas
- Manage scripts
- Coordinate production pipeline
- Log published content

**Database:**
- Table: `content_pipeline`
- Fields: title, platform, status, script, thumbnail_url, notes, due_date, published_at

---

## 🗄️ Database Architecture

**Database:** Neon Postgres  
**Name:** `qbt-mission-control`  
**Connection:** Pooled (via `DATABASE_URL`)

**Tables:**
1. `tasks` — Tasks Board data
2. `memories` — Memory Viewer entries
3. `cron_jobs` — Scheduled jobs
4. `content_pipeline` — Content items

**Schema Location:** `/src/db/schema.ts`  
**Drizzle ORM:** Type-safe queries with full TypeScript support

**Environment Variables:**
- `DATABASE_URL` — set in all environments (Production, Preview, Development)
- Secured in Vercel, not in Git (`.env.local` is gitignored)

---

## 🚀 Deployment

**Live URL:** https://qbtraining.ai/mission-control  
**Local Dev:** http://localhost:3000/mission-control

**Auto-Deploy:**
- Push to `main` branch → Vercel auto-deploys
- Typically takes 1-2 minutes

**Repo:** `RealWorldTraining/qbt-dashboards`  
**Branch:** `main`

---

## 🔧 How to Use (For You, Professor)

### Tasks Board
1. **Create a task:** Click "+ New Task", fill out form, submit
2. **Edit a task:** Click ✏️ on any task card
3. **Delete a task:** Click 🗑️ (with confirmation)
4. **Move a task:** Hover over card, click emoji to move to another column

### Memory Viewer
1. **Log a memory:** Click "+ New Memory", write title/content, add tags
2. **Search memories:** Use search bar at top
3. **Link to conversations:** Add Discord message ID in "Conversation reference"

### Calendar / Cron
1. **Add a job:** Click "+ New Job", enter cron schedule and description
2. **Pause a job:** Click the status badge (active → paused)
3. **Monitor runs:** View last/next run timestamps

### n8n Status
- Just watch — auto-refreshes every minute
- Expand execution history by clicking "Recent Executions"

### Google Ads Quick View
- Just watch — auto-refreshes every 5 minutes
- Check CPA alerts (red if > $180)

### Content Pipeline
1. **Add idea:** Click "+ New Content", enter title/platform
2. **Write script:** Edit item, add script in textarea
3. **Move through pipeline:** Hover, click emoji to advance stages

---

## 📝 Proactive Behavior

**What You (Professor) Should Do:**

1. **Log tasks as you work on them**
   - Every time you start something, add it to Tasks Board
   - Update status as you progress
   - Mark done when complete

2. **Write memories for key decisions**
   - After important conversations → log to Memory Viewer
   - Document "why" decisions were made
   - Tag appropriately for future search

3. **Track scheduled work in Calendar**
   - When you schedule something via cron → add it here
   - Verify cron jobs are running correctly
   - Update last/next run manually if needed

4. **Monitor n8n workflows**
   - Check daily for failed executions
   - Alert Aaron if Jedi Council fails

5. **Review Google Ads metrics**
   - Check CPA weekly
   - Flag high-spending campaigns

6. **Manage content ideas**
   - Add video ideas as they come up
   - Write scripts in Scripting column
   - Track published content

---

## 🛠️ Technical Details

### API Routes
All routes follow REST conventions:

**Tasks:** `/api/mission-control/tasks`
- GET — Fetch all tasks
- POST — Create task
- PATCH — Update task (by id)
- DELETE — Delete task (by id query param)

**Memories:** `/api/mission-control/memories`
- GET — Fetch all memories (optional `?q=search` query)
- POST — Create memory

**Cron:** `/api/mission-control/cron`
- GET — Fetch all jobs
- POST — Create job
- PATCH — Update job (by id)

**Content:** `/api/mission-control/content`
- GET — Fetch all content
- POST — Create content
- PATCH — Update content (by id)

**n8n:** `/api/mission-control/n8n`
- GET — Fetch workflow statuses (proxies n8n API)

**Google Ads:** `/api/mission-control/google-ads`
- GET — Fetch latest metrics (from Adveronix sheet)

### Code Structure
```
src/
├── app/
│   ├── mission-control/
│   │   ├── page.tsx              # Main page with tab navigation
│   │   └── components/
│   │       ├── TasksBoard.tsx
│   │       ├── MemoryViewer.tsx
│   │       ├── CalendarView.tsx
│   │       ├── N8nStatus.tsx
│   │       ├── GoogleAdsQuickView.tsx
│   │       └── ContentPipeline.tsx
│   └── api/
│       └── mission-control/
│           ├── tasks/route.ts
│           ├── memories/route.ts
│           ├── cron/route.ts
│           ├── content/route.ts
│           ├── n8n/route.ts
│           └── google-ads/route.ts
└── db/
    ├── schema.ts                  # Drizzle schema
    └── index.ts                   # DB connection
```

---

## 🎯 What's Next (Future Enhancements)

**Nice-to-have features (not blocking):**
- Drag-and-drop for Tasks Board (library-based)
- Rich text editor for Memory Viewer
- Calendar view (visual timeline) for Cron
- n8n workflow execution triggering
- Google Ads alerting (Slack/email on high CPA)
- Content script versioning
- File uploads for content thumbnails
- Task time tracking
- Memory export (CSV/Markdown)
- Keyboard shortcuts

**But everything essential is done and working!**

---

## 🎓 Summary

Mission Control is a fully operational command center that gives you:
1. ✅ **Visibility** into all active work (Tasks Board)
2. ✅ **Continuity** via searchable memories
3. ✅ **Scheduling** transparency (Cron/Calendar)
4. ✅ **System monitoring** (n8n workflows, Google Ads)
5. ✅ **Content management** (YouTube/social pipeline)

**It's live, persistent, and ready to use daily.** 

Start by adding tasks as you work on things, and log key decisions to Memory Viewer. Over time, this becomes your single source of truth for "what's happening right now."

---

Built with ❤️ by Professor 🎓
