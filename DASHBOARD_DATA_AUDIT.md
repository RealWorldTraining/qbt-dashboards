# Dashboard Data Source Audit
*Generated: 2026-02-03*

## Google Sheets Reference

| Sheet Name | Sheet ID | Purpose |
|------------|----------|---------|
| **Adveronix: Paid Search** | `1T8PZjlf2vBz7YTlz1GCXe68UczWGL8_ERYuBLd_r6H0` | Primary source - Google Ads, Bing Ads, GA4, GSC |
| **Old Google Ads Sheet** | `1WeRmk0bZ-OU6jnbk0pfC1s3xK32WCwAIlTUa0-jYcuM` | ⚠️ DEPRECATED - only used by google-ads-monthly |
| **Bing Ads (Old)** | `1INXxnW3WVkENN7Brvo3sgPcs96C06r3O6mEkgEABxk8` | ⚠️ DEPRECATED - used by bing-ads, bing-ads-monthly |
| **Monthly Channels** | `1SvvnNc32S7jSW1GP1bonJAoW0bTuNgHh9ERQo6RgcEY` | GA4 monthly channel summary |
| **Live Help Schedule** | `1BOFucsKkTjviWQO5724znJOKlN8wuLOLkZiOtsXT7UI` | Live help current status |
| **Live Help Archive** | `1Rf9sf4xEIBhOJZGfA2wvLEmDUNd0onuHBZfCBFXx7y4` | Live help historical logs |

---

## Dashboard Pages

### 1. `/` (Home)
- **Purpose:** Navigation hub - links to all dashboards
- **Data Sources:** None (static)

---

### 2. `/ads` (Marketing Dashboard)
- **Purpose:** Traffic by channel, Google Ads, Bing Ads performance
- **APIs Called:**
  - `/api/ads`
  - `/api/organic`
  - `/api/campaigns`
  - `/api/bing-ads`
  - `/api/bing-campaigns`

| API | Source Type | Sheet ID | Tab Name |
|-----|-------------|----------|----------|
| `/api/ads` | Google Sheet | Adveronix (`1T8PZjlf...`) | `GADS: Account: Weekly (Devices)` |
| `/api/organic` | Google Sheet | Adveronix (`1T8PZjlf...`) | `GA4: Traffic Weekly Session Source` + `GA4: Traffic Weekly Channel` |
| `/api/campaigns` | Google Sheet | Adveronix (`1T8PZjlf...`) | `GADS: Campaign: Weekly (Devices)` |
| `/api/bing-ads` | Google Sheet | ⚠️ OLD (`1INXxnW3...`) | `Bing Paid: Weekly Account Summary` |
| `/api/bing-campaigns` | Google Sheet | Adveronix (`1T8PZjlf...`) | `Bing: Campaign Weekly` |

**⚠️ ISSUE:** `/api/bing-ads` uses OLD sheet, not Adveronix

---

### 3. `/ads/tv` (TV Dashboard)
- **Purpose:** Optimized for 2304x1296 TV display
- **APIs Called:** Same as `/ads`

---

### 4. `/google-ads-summary` (Google Ads Summary)
- **Purpose:** Monthly Google Ads performance
- **APIs Called:**
  - `/api/google-ads-weekly`
  - `/api/campaigns`

| API | Source Type | Sheet ID | Tab Name |
|-----|-------------|----------|----------|
| `/api/google-ads-weekly` | Google Sheet | Adveronix (`1T8PZjlf...`) | `GADS: Account: Weekly (Devices)` |
| `/api/campaigns` | Google Sheet | Adveronix (`1T8PZjlf...`) | `GADS: Campaign: Weekly (Devices)` |

✅ All sources correct

---

### 5. `/bing-ads-summary` (Bing Ads Summary)
- **Purpose:** Monthly Bing Ads performance
- **APIs Called:**
  - `/api/bing-ads-weekly`
  - `/api/bing-campaigns`

| API | Source Type | Sheet ID | Tab Name |
|-----|-------------|----------|----------|
| `/api/bing-ads-weekly` | Google Sheet | Adveronix (`1T8PZjlf...`) | `BING: Account Summary Weekly` |
| `/api/bing-campaigns` | Google Sheet | Adveronix (`1T8PZjlf...`) | `Bing: Campaign Weekly` |

✅ All sources correct

---

### 6. `/trend-analysis` (Trend Analysis)
- **Purpose:** YoY comparisons, 4-week trends, Vision insights
- **APIs Called:**
  - `/api/google-ads-weekly`
  - `/api/bing-ads-weekly`
  - `/api/gsc-tracker`
  - `/api/gsc-weekly`
  - `/api/gsc-keywords-weekly`
  - `/api/vision-analysis`

| API | Source Type | Sheet ID | Tab Name |
|-----|-------------|----------|----------|
| `/api/google-ads-weekly` | Google Sheet | Adveronix (`1T8PZjlf...`) | `GADS: Account: Weekly (Devices)` |
| `/api/bing-ads-weekly` | Google Sheet | Adveronix (`1T8PZjlf...`) | `BING: Account Summary Weekly` |
| `/api/gsc-tracker` | ⚠️ STUB | N/A | Returns empty data (not implemented) |
| `/api/gsc-weekly` | Google Sheet | Adveronix (`1T8PZjlf...`) | `GSC: Account Daily` |
| `/api/gsc-keywords-weekly` | Google Sheet | Adveronix (`1T8PZjlf...`) | `GSC: Query Daily` |
| `/api/vision-analysis` | Static JSON | N/A | Hardcoded analysis (not live) |

---

### 7. `/vision` (Vision Analytics)
- **Purpose:** Keyword bid optimization, CPA trends
- **APIs Called:**
  - `/api/vision-keywords`

| API | Source Type | Sheet ID | Tab Name |
|-----|-------------|----------|----------|
| `/api/vision-keywords` | Google Sheet | Adveronix (`1T8PZjlf...`) | `GADS: Search Keyword: Weekly with analytics` |

✅ Correct source

---

### 8. `/playground` (GA4 Summary)
- **Purpose:** Monthly traffic by channel
- **APIs Called:**
  - `/api/monthly-channels`

| API | Source Type | Sheet ID | Tab Name |
|-----|-------------|----------|----------|
| `/api/monthly-channels` | Google Sheet | `1SvvnNc32...` | `Monthly Channel Summary` |

⚠️ Uses separate sheet (not Adveronix)

---

### 9. `/data` (Sales Snapshot)
- **Purpose:** Real-time sales forecasts for office TV
- **APIs Called:** External Railway API
  - `https://qbtraining-site-production.up.railway.app/metrics`
  - `https://qbtraining-site-production.up.railway.app/eod-forecast`
  - `https://qbtraining-site-production.up.railway.app/eom-forecast`
  - `https://qbtraining-site-production.up.railway.app/this-week-forecast`
  - `https://qbtraining-site-production.up.railway.app/hourly-comparison`
  - `https://qbtraining-site-production.up.railway.app/month-weekly`

**Source:** Railway Prophet API (real-time sales data from QBO)

---

### 10. `/phone` (Phone Dashboard)
- **Purpose:** Mobile-optimized sales dashboard
- **APIs Called:** External Railway API
  - `https://qbtraining-site-production.up.railway.app/metrics`
  - `https://qbtraining-site-production.up.railway.app/hourly-comparison`

---

### 11. `/dashboard` (Main Dashboard)
- **Purpose:** Comprehensive view - Sales, Traffic, Ads, Subscriptions
- **APIs Called:** External Railway API
  - `https://qbtraining-site-production.up.railway.app/metrics`
  - `https://qbtraining-site-production.up.railway.app/hourly-comparison`
  - `https://qbtraining-site-production.up.railway.app/weekly-trends`
  - `https://qbtraining-site-production.up.railway.app/weekly-trends-extended`
  - `https://qbtraining-site-production.up.railway.app/product-mix`
  - `https://qbtraining-site-production.up.railway.app/weekly-qty-yoy`
  - `https://qbtraining-site-production.up.railway.app/monthly-qty-yoy`
  - `https://qbtraining-site-production.up.railway.app/jedi-council/keywords`

---

### 12. `/sales` (Sales Dashboard)
- **Purpose:** Detailed sales analytics
- **APIs Called:** Same as `/dashboard` (Railway API)

---

### 13. `/recap` (P&L Recap)
- **Purpose:** Monthly profit & loss reports
- **APIs Called:**
  - `/api/recap`

| API | Source Type | Notes |
|-----|-------------|-------|
| `/api/recap` | Local JSON file | Reads from `/tmp/recap-data.json` or `.recap-data/recap-data.json` |

---

### 14. `/live-help` (Live Help Real-time)
- **Purpose:** Current live help session status
- **APIs Called:**
  - `/api/live-help-current`
  - `/api/live-help-schedule`

| API | Source Type | Sheet ID | Tab Name |
|-----|-------------|----------|----------|
| `/api/live-help-current` | Google Sheet | `1BOFucsK...` | Various tabs for status/stats |
| `/api/live-help-schedule` | Google Calendar | N/A | Calendar API |

---

### 15. `/live-help-archive` (Live Help Archive)
- **Purpose:** Historical live help logs
- **APIs Called:**
  - `/api/live-help`

| API | Source Type | Sheet ID | Tab Name |
|-----|-------------|----------|----------|
| `/api/live-help` | Google Sheet | `1Rf9sf4x...` | `Log`, `FY2025 Log`, `FY2024 Log` |

---

### 16. `/team` (Team Dashboard)
- **Purpose:** Team performance metrics
- **APIs Called:** Same as `/dashboard` (Railway API)

---

## APIs Using WRONG/OLD Data Sources

| API | Current Source | Should Use |
|-----|----------------|------------|
| `/api/bing-ads` | OLD sheet `1INXxnW3...` | Adveronix `BING: Account Summary Weekly` |
| `/api/bing-ads-monthly` | OLD sheet `1INXxnW3...` | Adveronix (needs monthly tab) |
| `/api/google-ads-monthly` | OLD sheet `1WeRmk0b...` | Adveronix (needs monthly tab) |

---

## APIs Using Static/Stub Data

| API | Status | Notes |
|-----|--------|-------|
| `/api/gsc-tracker` | STUB | Returns empty data, not implemented |
| `/api/vision-analysis` | STATIC | Hardcoded JSON, not live data |

---

## Summary of Issues

1. **`/api/bing-ads`** - Uses old Bing sheet, needs to switch to Adveronix
2. **`/api/bing-ads-monthly`** - Uses old Bing sheet
3. **`/api/google-ads-monthly`** - Uses old Google Ads sheet
4. **`/api/gsc-tracker`** - Stub, not pulling real data
5. **`/api/vision-analysis`** - Static JSON, not dynamic

---

## Adveronix Sheet Tabs (Available)

| Tab Name | Used By |
|----------|---------|
| `GADS: Account: Weekly (Devices)` | `/api/ads`, `/api/google-ads-weekly` |
| `GADS: Campaign: Weekly (Devices)` | `/api/campaigns` |
| `GADS: Search Keyword: Weekly with analytics` | `/api/vision-keywords` |
| `BING: Account Summary Weekly` | `/api/bing-ads-weekly` |
| `Bing: Campaign Weekly` | `/api/bing-campaigns` |
| `GA4: Traffic Weekly Session Source` | `/api/organic` |
| `GA4: Traffic Weekly Channel` | `/api/organic` |
| `GSC: Account Daily` | `/api/gsc-weekly` |
| `GSC: Query Daily` | `/api/gsc-keywords-weekly` |

### Adveronix Tabs NOT YET USED:
- `GADS: Search Terms: Weekly Campaign Level`
- `GADS: Landing Page: Monthly (With Campaigns)`
- `BING: Search Keyword Weekly`
