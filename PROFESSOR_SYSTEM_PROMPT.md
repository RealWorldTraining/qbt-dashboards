# Professor System Prompt — Technical Context

Paste this into the Professor's custom instructions or system prompt field.

---

## QBT-DASHBOARDS PROJECT CONTEXT

When working on qbtraining.ai or qbt-dashboards, use these details — do NOT ask the user for them:

- **GitHub repo:** RealWorldTraining/qbt-dashboards
- **Local path:** /Users/professorx/clawd/qbt-dashboards
- **Live URL:** qbtraining.ai
- **Deployment:** Vercel, auto-deploys from `main` branch
- **Data source:** Google Sheet "ADVERONIX: Paid Search" (ID: 1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0), updates daily at 4AM CST

**All Active Google Sheets:**
- ADVERONIX: Paid Search (PRIMARY): 1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0 — main data for Google Ads, Bing Ads, GA4, GSC
- Monthly Channels: 1SvvnNc32S7jSW1GP1bonJAoW0bTuNgHh9ERQo6RgcEY — GA4 monthly channel summary
- Live Help Schedule: 1BOFucsKkTjviWQO5724znJOKlN8wuLOLkZiOtsXT7UI — live help current status
- Live Help Archive: 1Rf9sf4xEIBhOJZGfA2wvLEmDUNd0onuHBZfCBFXx7y4 — historical live help logs
- Jedi Council Output: 1ckBSMiwhFIHKzR2vyr8MlFtOq2DK7NL7pEjYUT9Fbrg — Jedi Council analysis output

**Deprecated Sheets (DO NOT USE):**
- Old Google Ads: 1WeRmk0bZ-OU6jnbk0pfC1s3xK32WCwAIlTUa0-jYcuM — migrate away
- Bing Ads (Old): 1INXxnW3WVkENN7Brvo3sgPcs96C06r3O6mEkgEABxk8 — migrate away

**Dashboard routes (15 reports):**

ADVERONIX sheet (6): /ads (Marketing Dashboard), /google-ads-summary, /bing-ads-summary, /trend-analysis, /vision, /ads-tv (same as /ads)

Monthly Channels sheet (1): /playground (GA4 Summary)

Live Help Schedule sheet (1): /live-help

Live Help Archive sheet (1): /live-help-archive (tabs: Log, FY2025 Log, FY2024 Log)

Railway Prophet API (5): /dashboard (Command Center), /sales, /data (Sales TV), /phone, /team

Local JSON (1): /recap (P&L, reads /tmp/recap-data.json)

**Key ADVERONIX tabs used:**
- GADS: Account: Weekly (Devices), GADS: Campaign: Weekly (Devices)
- BING: Account Summary Weekly, Bing: Campaign Weekly
- GA4: Traffic Weekly Session Source, GA4: Traffic Weekly Channel
- GSC: Account Daily, GSC: Query Daily
- GADS: Search Keyword: Weekly with analytics

**n8n workflows:**
- Jedi Council Full: kQhVEuBRJw1NIusd
- GADS Weekly: n6O7OGLWSWmtzsDe
- Receipt Processor: SkAt1aohXt08slQ3

**n8n API creds:** /Users/professorx/clawd/.secrets/n8n-professor-api.txt

**Jedi Council data source:** Same as ADVERONIX sheet above

**Telegram bot:** @ClaudeProfessorXBot (token: 8503720745:AAGo-S9KYBHiIDs9qe2jsgJcgKiZ2x6iUkI)

**IMPORTANT:** Always check PROJECT_CONTEXT.md in the repo root for the latest details before asking the user for project information. If you need file paths, repo locations, or deployment details — they are documented there. Do not ask the user to repeat them.
