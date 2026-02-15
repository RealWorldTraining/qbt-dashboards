# Reviews Dashboard Setup

## What Was Built

✅ **API Route**: `/api/reviews` - Fetches review data from Google Sheets
✅ **Dashboard Page**: `/reviews` - Interactive reviews dashboard with filtering
✅ **Features**:
- Filter by service/product type
- Filter by instructor
- Filter by star rating
- Filter by quality weight
- Search reviews by text
- Sort by weight (highest quality first)
- Real-time stats: total reviews, avg rating, avg weight, 5-star %

## Setup Steps

### 1. Share the Google Sheet with the Service Account

The service account email from your `.env.local` is:
```
hulk-moltbot@hulk-485805.iam.gserviceaccount.com
```

**To give it access:**
1. Open your reviews Google Sheet: https://docs.google.com/spreadsheets/d/1Nh1LRFfI7Ct6p8V34ixZfs51WUepJkQ22EkV7t64eTo/edit
2. Click **Share** button (top right)
3. Add: `hulk-moltbot@hulk-485805.iam.gserviceaccount.com`
4. Set permission to **Viewer** (read-only)
5. Click **Send**

### 2. Verify Sheet Structure

The API expects these columns (A through P):
- A: Entry Date
- B: First Name
- C: Last Name
- D: Which service are you reviewing? (product/service type)
- E: Instructor
- F: Stars
- G: Review text
- H: Final Weight
- I: Context score
- J: Specificity score
- K: Actionability score
- L: Word Count
- M: Length Bonus
- N: Base Score
- O-P: (optional additional columns)

**Important**: Make sure your sheet name matches. Default is "Sheet1". If different, update this line in `/api/reviews/route.ts`:
```typescript
const SHEET_NAME = 'Sheet1'; // Change to your sheet name
```

### 3. Test the API

Start the dev server:
```bash
cd workspace/qbt-dashboards
npm run dev
```

Test the API directly:
```
http://localhost:3000/api/reviews
```

You should see JSON with your reviews data.

### 4. Access the Dashboard

Visit:
```
http://localhost:3000/reviews
```

You should see:
- Stats cards at the top
- Filter controls
- List of reviews sorted by weight

## Filters Available

**Service/Product**: Filter by what's being reviewed (selfpaced, livehelp, certexam, etc.)

**Instructor**: Filter by specific instructor (Alanna, Brandon, Ericka, etc.)

**Min Stars**: Show only 3+, 4+, or 5-star reviews

**Min Weight**: Filter by quality score (e.g., only show reviews with weight > 50)

**Search**: Free text search through review content and names

## API Caching

The API caches results for 5 minutes to reduce Google Sheets API calls. To force a refresh, click the "Refresh Data" button on the dashboard.

## Deployment

When deploying to production (Railway, Vercel, etc.):

1. **Environment variables** are already set in `.env.local` - make sure they're also set in your production environment

2. **The service account must have access** to the production Google Sheet (same share step as above)

3. **The API will work automatically** - no additional setup needed

## Troubleshooting

**Error: "Failed to fetch reviews"**
- Check that the service account has access to the sheet
- Verify the SPREADSHEET_ID in `/api/reviews/route.ts` matches your sheet
- Check that SHEET_NAME matches your actual sheet name

**No reviews showing**
- Check that row 1 is headers (data starts at row 2)
- Make sure "FILTERED" reviews are excluded (< 3 words)
- Try resetting filters

**Stats look wrong**
- Verify that the weight calculation ran successfully (column H should have numbers, not "FILTERED")
- Check that columns I-N have the scoring breakdown

## Future Enhancements

Possible additions:
- Export filtered reviews to CSV
- Charts showing review trends over time
- Instructor performance comparison
- Review response/moderation features
- Public-facing review widget (filtered by weight)
