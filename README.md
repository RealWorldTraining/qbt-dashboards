# QBT Dashboards

Internal dashboards and analytics for QuickBooks Training.

## Dashboards

- `/recap` - Monthly P&L Recap (powered by n8n workflow)

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
DASHBOARD_USER=admin
DASHBOARD_PASSWORD=your-password
```

## n8n Integration

The recap page receives data from the n8n workflow "Monthly P&L Recap Generator".

- **Workflow ID:** `Qf8sKV1sQ2Va6qWB`
- **Endpoint:** `POST /api/recap`
- **Data Source:** Google Sheet `1hMprZQev8sFG1E7Y2xJy3ucg0BgIE_BxYHXyaGGf7NA`

## Deployment

Deployed on Railway. Auto-deploys on push to `main`.

## Authentication

All dashboard routes are protected with HTTP Basic Auth. Set `DASHBOARD_USER` and `DASHBOARD_PASSWORD` environment variables in production.

## Structure

```
├── src/
│   ├── app/
│   │   ├── recap/           # Monthly P&L Recap
│   │   │   ├── page.tsx
│   │   │   └── recap.css
│   │   └── api/recap/       # Data endpoint
│   │       └── route.ts
│   └── middleware.ts        # Auth protection
├── n8n-workflows/           # Workflow configs
├── .recap-data/             # Cached data
└── pl-report-workflow/      # Legacy HTML reports
```
# Force rebuild Mon Feb  2 16:55:10 CST 2026
# Last updated: Sat Feb  7 18:03:41 CST 2026
