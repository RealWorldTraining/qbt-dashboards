# QBT-Dashboards — Project Context

> **Read this file first before making any changes.** It contains all project paths, architecture, and deployment details.

## Repository

- **GitHub:** `RealWorldTraining/qbt-dashboards`
- **Local path (Aaron's Mac):** `/Users/professorx/clawd/qbt-dashboards`
- **Live URL:** [qbtraining.ai](https://qbtraining.ai)
- **Deployment:** Vercel (auto-deploys from `main` branch)

> **Note:** Clone the repo to your preferred location. The local path above is specific to Aaron's machine.

## Reports & Data Sources (15 Total)

### Reports Using ADVERONIX Sheet (6 reports)

**Marketing Dashboard** — `/ads`
- `GADS: Account: Weekly (Devices)`
- `GADS: Campaign: Weekly (Devices)`
- `BING: Account Summary Weekly`
- `Bing: Campaign Weekly`
- `GA4: Traffic Weekly Session Source`
- `GA4: Traffic Weekly Channel`

**Google Ads Summary** — `/google-ads-summary`
- `GADS: Account: Weekly (Devices)`
- `GADS: Campaign: Weekly (Devices)`

**Bing Ads Summary** — `/bing-ads-summary`
- `BING: Account Summary Weekly`
- `Bing: Campaign Weekly`

**Trend Analysis** — `/trend-analysis`
- `GADS: Account: Weekly (Devices)`
- `BING: Account Summary Weekly`
- `GSC: Account Daily`
- `GSC: Query Daily`

**Vision Analytics** — `/vision`
- `GADS: Search Keyword: Weekly with analytics`

**Marketing Dashboard (TV)** — `/ads-tv`
- Same tabs as Marketing Dashboard (`/ads`)

### Reports Using Monthly Channels Sheet (1 report)

**GA4 Summary** — `/playground`
- `Monthly Channel Summary`

### Reports Using Live Help Schedule Sheet (1 report)

**Live Help (Real-time)** — `/live-help`
- Various status/stats tabs

### Reports Using Live Help Archive Sheet (1 report)

**Live Help Archive** — `/live-help-archive`
- `Log`
- `FY2025 Log`
- `FY2024 Log`

### Reports Using Railway Prophet API — No Google Sheets (5 reports)

| Report | Route |
|---|---|
| Command Center | `/dashboard` |
| Sales Dashboard | `/sales` |
| Sales Snapshot (TV) | `/data` |
| Phone Dashboard | `/phone` |
| Team Dashboard | `/team` |

### Reports Using Local JSON (1 report)

**P&L Recap** — `/recap`
- Local file: `/tmp/recap-data.json` or `.recap-data/recap-data.json`

## Google Sheets — Active

| Sheet | ID | Purpose |
|---|---|---|
| ADVERONIX: Paid Search (PRIMARY) | `1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0` | Main data source for Google Ads, Bing Ads, GA4, GSC. Updates daily 4AM CST. |
| Monthly Channels | `1SvvnNc32S7jSW1GP1bonJAoW0bTuNgHh9ERQo6RgcEY` | GA4 monthly channel summary |
| Live Help Schedule | `1BOFucsKkTjviWQO5724znJOKlN8wuLOLkZiOtsXT7UI` | Live help current status |
| Live Help Archive | `1Rf9sf4xEIBhOJZGfA2wvLEmDUNd0onuHBZfCBFXx7y4` | Historical live help logs |
| Jedi Council Output | `1ckBSMiwhFIHKzR2vyr8MlFtOq2DK7NL7pEjYUT9Fbrg` | Analysis output from Jedi Council workflow |

## Google Sheets — Additional Active

| Sheet | ID | Notes |
|---|---|---|
| Adveronix: MASTER DATA | `1INXxnW3WVkENN7Brvo3sgPcs96C06r3O6mEkgEABxk8` | Subscription data ("KPI BEES" tab). ~44K rows, 2013-present. Updated daily. Used by Prophet API (`SUBSCRIPTIONS_SHEET_ID`). |

## Google Sheets — Deprecated (DO NOT USE)

| Sheet | ID | Notes |
|---|---|---|
| Old Google Ads Sheet | `1WeRmk0bZ-OU6jnbk0pfC1s3xK32WCwAIlTUa0-jYcuM` | Only used by google-ads-monthly (old) — migrate away |

## Prophet API (Backend for Sales/Subscription Reports)

- **Live URL:** `https://qbtraining-site-production.up.railway.app`
- **Hosted on:** Railway (auto-deploys from GitHub)
- **CRITICAL: Deploys from a SEPARATE repo: `RealWorldTraining/prophet-api`**
- The `prophet-api/` folder in `qbtraining-site` is a local reference copy — changes there do NOT deploy
- To deploy Prophet API changes: clone/edit `RealWorldTraining/prophet-api` and push to `main`
- Subscription data source: Adveronix: MASTER DATA sheet, "KPI BEES" tab (see above)

## Related n8n Workflows

| Workflow | ID | Description |
|---|---|---|
| Jedi Council (Full) | `kQhVEuBRJw1NIusd` | Multi-LLM Google Ads optimization |
| GADS Weekly | `n6O7OGLWSWmtzsDe` | Weekly Google Ads analysis |
| Receipt Processor | `SkAt1aohXt08slQ3` | PDF receipt → Box automation |

## Jedi Council Data Sheet

The ADVERONIX sheet (listed above) also serves as the Jedi Council input data source.

## Telegram Bot

- **Bot:** `@ClaudeProfessorXBot`
- **API Token:** `8503720745:AAGo-S9KYBHiIDs9qe2jsgJcgKiZ2x6iUkI`

## n8n API

- **Credentials file:** `/Users/professorx/clawd/.secrets/n8n-professor-api.txt`

## Agent Workflow

**All agents (Professor, Claude Code, Windsurf, Cursor, etc.) must follow this workflow:**

1. **Always start with:** `git pull origin main`
2. **Read PROJECT_CONTEXT.md** for current repo structure and data sources
3. **Work on changes** (code, docs, etc.)
4. **Before finishing:** 
   - `git add .`
   - `git commit -m "Descriptive message"`
   - `git push origin main`
5. **Never work offline** — always sync with GitHub first and last

This ensures all agents stay in sync and Vercel auto-deploys the latest code.

## Tech Notes

- All code changes should be committed to `main` for auto-deploy via Vercel
- Dashboard pulls from ADVERONIX sheet — do not modify sheet structure without coordinating
- When renaming UI elements, search the full codebase for all references (components, routes, nav labels)
