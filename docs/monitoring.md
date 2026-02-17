# Data Quality Monitoring System

**Status:** ✅ Active  
**Daily Check Time:** 12:30 AM CST (6:30 AM UTC)  
**Alert Channel:** Discord #mission-control-board

---

## What Gets Monitored

### Layer 1: API Health (Every 5 minutes)
- All dashboard API endpoints (`/api/*`)
- HTTP status codes
- Response times
- Data presence validation

**View:** https://qbtraining.ai/health

### Layer 2: Data Validation (Daily at 12:30 AM CST)
Comprehensive validation tests:

| Test | What It Checks | Alert On |
|------|----------------|----------|
| **API Health** | All endpoints return 200 | Any endpoint fails |
| **Google Ads Range** | Impressions 15k-25k/week | Out of range |
| **Bing Ads Range** | Impressions 3k-10k/week | Out of range |
| **CTR Validation** | CTR 2-10% | Abnormal CTR |
| **Spend Ratios** | Google 70-85% of total | Ratios off >20% |
| **Data Freshness** | Last week <7 days old | Data stale |
| **Deduplication** | Weekly totals properly summed | Old bug resurfaces |
| **Null Checks** | No null in critical fields | Nulls found |
| **GA4 Correlation** | Sessions match ad clicks ±40% | Divergence detected |

### Layer 3: Visual Regression (Planned)
- Screenshot comparison
- Chart rendering validation
- UI integrity checks

---

## How to Run Tests

### Locally
```bash
# Run all data validation tests
npm run test:data

# Run specific test file
npm test tests/data-validation.test.ts

# Check API health
npm run health
# or
curl https://qbtraining.ai/api/health | jq
```

### Manual Trigger (GitHub Actions)
1. Go to: https://github.com/RealWorldTraining/qbt-dashboards/actions/workflows/daily-data-check.yml
2. Click "Run workflow"
3. Select branch: `main`
4. Click "Run workflow"

---

## Alert Examples

### 🟢 All Green (Daily Summary)
```
🟢 Daily Data Check - All Green

✅ All 12 API endpoints healthy
✅ Google Ads: 18,234 impressions (within range)
✅ Bing Ads: 3,456 impressions (within range)
✅ GA4 correlation: 93% (healthy)
✅ Deduplication working correctly

Ran 24 validation checks
Passed: 24 | Failed: 0
```

### 🔴 Issue Detected
```
🔴 Data Quality Issue Detected

Problem: Google Ads impressions out of expected range

Expected: 15,000 - 25,000 per week
Actual: 1,560

Possible causes:
- Deduplication bug resurfaced
- Data not summing daily rows
- API integration issue

@Vision @Professor please investigate
GitHub Actions: [link]
```

### ⚠️ Adveronix Stale
```
⚠️ Adveronix Sheet Stale

Adveronix sheet has not updated in 28 hours

Expected: Updates daily at 4:00 AM CST
Last Update: 28 hours ago
Action Required: Check Adveronix automation

@everyone
```

---

## Files Structure

```
qbt-dashboards/
├── .github/workflows/
│   └── daily-data-check.yml       # GitHub Action (runs daily)
├── tests/
│   └── data-validation.test.ts    # Data validation test suite
├── src/app/
│   ├── api/health/route.ts        # Health check API endpoint
│   └── health/page.tsx            # Health dashboard page
├── lib/
│   └── alerts.ts                  # Discord alert utilities
├── docs/
│   └── monitoring.md              # This file
└── vitest.config.ts               # Test configuration
```

---

## Discord Webhook Setup

**Required Environment Variable:**
- `DISCORD_WEBHOOK_URL` (set in Vercel + GitHub Secrets)

**Webhook Permissions:**
- Send messages
- Embed links
- Mention roles

**To Create Webhook:**
1. Discord Server Settings → Integrations → Webhooks
2. Click "New Webhook"
3. Name: "Data Monitor"
4. Channel: #mission-control-board
5. Copy webhook URL
6. Add to Vercel environment variables
7. Add to GitHub repository secrets

---

## GitHub Secrets Required

| Secret | Value | Used By |
|--------|-------|---------|
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | GitHub Actions |
| `GOOGLE_SHEETS_CREDS` | Service account JSON | Data validation tests |

**To Add Secrets:**
1. Go to: https://github.com/RealWorldTraining/qbt-dashboards/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret above

---

## Extending the Tests

### Add New Validation Test

Edit `tests/data-validation.test.ts`:

```typescript
test('your new validation', async () => {
  const res = await fetch(`${BASE_URL}/api/your-endpoint`);
  const data = await res.json();
  
  // Your assertion
  expect(data.someMetric).toBeGreaterThan(expectedMin);
  
  console.log(`✓ Your metric: ${data.someMetric}`);
});
```

### Add New Alert Type

Edit `lib/alerts.ts`:

```typescript
export async function alertYourNewIssue(details: YourType) {
  await sendDiscordAlert({
    title: '⚠️ Your Alert Title',
    description: 'Description of the issue',
    color: 'yellow',
    fields: [
      { name: 'Field 1', value: details.value1 },
      { name: 'Field 2', value: details.value2 }
    ]
  });
}
```

---

## Troubleshooting

### Tests Failing Locally
```bash
# Check if API is accessible
curl https://qbtraining.ai/api/health

# Run tests with verbose output
npm run test:data -- --reporter=verbose

# Check environment variables
echo $NEXT_PUBLIC_BASE_URL
```

### GitHub Action Failing
1. Check workflow logs: https://github.com/RealWorldTraining/qbt-dashboards/actions
2. Verify secrets are set correctly
3. Test endpoint manually: `curl https://qbtraining.ai/api/health`
4. Check Discord webhook is valid

### Discord Notifications Not Sending
1. Verify `DISCORD_WEBHOOK_URL` is set in GitHub Secrets
2. Test webhook manually:
   ```bash
   curl -H "Content-Type: application/json" \
     -d '{"content":"Test message"}' \
     YOUR_WEBHOOK_URL
   ```
3. Check webhook channel permissions

### Health Page Not Loading
1. Check if route exists: `src/app/health/page.tsx`
2. Verify API endpoint: `curl https://qbtraining.ai/api/health`
3. Check Vercel deployment logs

---

## Maintenance

### Weekly
- [ ] Review failed test alerts (if any)
- [ ] Check health dashboard trends
- [ ] Update expected ranges if business changes

### Monthly
- [ ] Review and update benchmark ranges in tests
- [ ] Add new validation tests for new features
- [ ] Archive old test results artifacts

### Quarterly
- [ ] Audit alert fatigue (too many false positives?)
- [ ] Update test suite for new dashboard features
- [ ] Review and optimize test performance

---

**Built:** 2026-02-17  
**Last Updated:** 2026-02-17  
**Maintained By:** Professor & Vision
