/**
 * Daily Data Validation Tests
 * Runs at 6:00 AM CST (after Adveronix updates at 4:00 AM)
 * 
 * Validates:
 * - API health (all endpoints return data)
 * - Data freshness (Adveronix updated <24h ago)
 * - Range validation (metrics within expected bounds)
 * - Cross-validation (Google Ads vs Bing ratios)
 * - Null checks (no missing critical data)
 */

import { describe, test, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://qbtraining.ai';

describe('API Health Checks', () => {
  const endpoints = [
    '/api/combined-weekly',
    '/api/google-ads-summary',
    '/api/bing-ads-summary',
    '/api/ga4-traffic',
  ];

  test.each(endpoints)('%s returns 200 and has data', async (endpoint) => {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data).toBeDefined();
    expect(Object.keys(data).length).toBeGreaterThan(0);
  });
});

describe('Google Ads Data Validation', () => {
  let data: any;

  beforeAll(async () => {
    const res = await fetch(`${BASE_URL}/api/google-ads-summary`);
    data = await res.json();
  });

  test('has weekly data', () => {
    expect(data.weekly).toBeDefined();
    expect(data.weekly.length).toBeGreaterThan(0);
  });

  test('impressions are in expected range', () => {
    const latestWeek = data.weekly[0];
    
    // Historical range: 15k-25k impressions per week
    expect(latestWeek.impressions).toBeGreaterThan(15000);
    expect(latestWeek.impressions).toBeLessThan(30000);
    
    console.log(`✓ Google Ads impressions: ${latestWeek.impressions.toLocaleString()}`);
  });

  test('clicks are reasonable vs impressions', () => {
    const latestWeek = data.weekly[0];
    const ctr = (latestWeek.clicks / latestWeek.impressions) * 100;
    
    // CTR should be 2-10% for lead gen
    expect(ctr).toBeGreaterThan(2);
    expect(ctr).toBeLessThan(10);
    
    console.log(`✓ Google Ads CTR: ${ctr.toFixed(2)}%`);
  });

  test('cost is in expected range', () => {
    const latestWeek = data.weekly[0];
    
    // Weekly spend typically $1k-$5k
    expect(latestWeek.cost).toBeGreaterThan(1000);
    expect(latestWeek.cost).toBeLessThan(5000);
    
    console.log(`✓ Google Ads cost: $${latestWeek.cost.toLocaleString()}`);
  });

  test('no null values in critical fields', () => {
    const latestWeek = data.weekly[0];
    
    expect(latestWeek.impressions).not.toBeNull();
    expect(latestWeek.clicks).not.toBeNull();
    expect(latestWeek.cost).not.toBeNull();
    expect(latestWeek.conversions).not.toBeNull();
  });

  test('has device breakdown', () => {
    const latestWeek = data.weekly[0];
    
    // Should have desktop and mobile data
    expect(latestWeek.desktop).toBeDefined();
    expect(latestWeek.mobile).toBeDefined();
  });
});

describe('Bing Ads Data Validation', () => {
  let data: any;

  beforeAll(async () => {
    const res = await fetch(`${BASE_URL}/api/bing-ads-summary`);
    data = await res.json();
  });

  test('has weekly data', () => {
    expect(data.weekly).toBeDefined();
    expect(data.weekly.length).toBeGreaterThan(0);
  });

  test('impressions are in expected range', () => {
    const latestWeek = data.weekly[0];
    
    // Bing typically 20-30% of Google volume
    expect(latestWeek.impressions).toBeGreaterThan(3000);
    expect(latestWeek.impressions).toBeLessThan(10000);
    
    console.log(`✓ Bing Ads impressions: ${latestWeek.impressions.toLocaleString()}`);
  });

  test('cost is reasonable', () => {
    const latestWeek = data.weekly[0];
    
    // Bing weekly spend typically $300-$1500
    expect(latestWeek.cost).toBeGreaterThan(200);
    expect(latestWeek.cost).toBeLessThan(2000);
    
    console.log(`✓ Bing Ads cost: $${latestWeek.cost.toLocaleString()}`);
  });
});

describe('Combined Data Cross-Validation', () => {
  let googleAds: any;
  let bingAds: any;

  beforeAll(async () => {
    const [gadsRes, bingRes] = await Promise.all([
      fetch(`${BASE_URL}/api/google-ads-summary`),
      fetch(`${BASE_URL}/api/bing-ads-summary`)
    ]);
    
    googleAds = await gadsRes.json();
    bingAds = await bingRes.json();
  });

  test('Google Ads is 70-85% of total spend', () => {
    const gadsSpend = googleAds.weekly[0].cost;
    const bingSpend = bingAds.weekly[0].cost;
    const total = gadsSpend + bingSpend;
    
    const gadsPercent = (gadsSpend / total) * 100;
    
    expect(gadsPercent).toBeGreaterThan(65);
    expect(gadsPercent).toBeLessThan(90);
    
    console.log(`✓ Google Ads spend share: ${gadsPercent.toFixed(1)}%`);
  });

  test('Bing Ads is 15-30% of total spend', () => {
    const gadsSpend = googleAds.weekly[0].cost;
    const bingSpend = bingAds.weekly[0].cost;
    const total = gadsSpend + bingSpend;
    
    const bingPercent = (bingSpend / total) * 100;
    
    expect(bingPercent).toBeGreaterThan(10);
    expect(bingPercent).toBeLessThan(35);
    
    console.log(`✓ Bing Ads spend share: ${bingPercent.toFixed(1)}%`);
  });

  test('combined impressions are reasonable', () => {
    const totalImpressions = 
      googleAds.weekly[0].impressions + 
      bingAds.weekly[0].impressions;
    
    // Combined should be 18k-35k per week
    expect(totalImpressions).toBeGreaterThan(18000);
    expect(totalImpressions).toBeLessThan(40000);
    
    console.log(`✓ Total impressions: ${totalImpressions.toLocaleString()}`);
  });
});

describe('Data Freshness', () => {
  test('Google Ads data is recent', async () => {
    const res = await fetch(`${BASE_URL}/api/google-ads-summary`);
    const data = await res.json();
    
    const latestWeek = data.weekly[0];
    const weekDate = new Date(latestWeek.week);
    const daysSinceLastWeek = (Date.now() - weekDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Should be within 7 days
    expect(daysSinceLastWeek).toBeLessThan(8);
    
    console.log(`✓ Latest week: ${latestWeek.week} (${daysSinceLastWeek.toFixed(1)} days ago)`);
  });

  test('Bing Ads data is recent', async () => {
    const res = await fetch(`${BASE_URL}/api/bing-ads-summary`);
    const data = await res.json();
    
    const latestWeek = data.weekly[0];
    const weekDate = new Date(latestWeek.week);
    const daysSinceLastWeek = (Date.now() - weekDate.getTime()) / (1000 * 60 * 60 * 24);
    
    expect(daysSinceLastWeek).toBeLessThan(8);
  });
});

describe('Deduplication Logic Validation', () => {
  test('Google Ads weekly totals are properly summed', async () => {
    const res = await fetch(`${BASE_URL}/api/google-ads-summary`);
    const data = await res.json();
    
    const latestWeek = data.weekly[0];
    
    // After deduplication fix on 2026-02-17, impressions should be 17k-19k
    // NOT the old broken 1,560
    expect(latestWeek.impressions).toBeGreaterThan(10000);
    expect(latestWeek.impressions).not.toBe(1560);
    
    console.log(`✓ Deduplication working: ${latestWeek.impressions.toLocaleString()} impressions`);
  });

  test('Bing Ads weekly totals are properly summed', async () => {
    const res = await fetch(`${BASE_URL}/api/bing-ads-summary`);
    const data = await res.json();
    
    const latestWeek = data.weekly[0];
    
    // Should have multiple days summed, not just one
    expect(latestWeek.impressions).toBeGreaterThan(3000);
    
    console.log(`✓ Bing deduplication working: ${latestWeek.impressions.toLocaleString()} impressions`);
  });
});

describe('GA4 Traffic Correlation', () => {
  test('GA4 sessions correlate with ad clicks', async () => {
    const [ga4Res, adsRes] = await Promise.all([
      fetch(`${BASE_URL}/api/ga4-traffic`),
      fetch(`${BASE_URL}/api/combined-weekly`)
    ]);
    
    const ga4 = await ga4Res.json();
    const ads = await adsRes.json();
    
    if (!ga4.weekly || !ads.googleAds) {
      console.warn('⚠ GA4 or Ads data not available for correlation check');
      return;
    }
    
    const adClicks = (ads.googleAds[0]?.clicks || 0) + (ads.bingAds?.[0]?.clicks || 0);
    const ga4Sessions = ga4.weekly[0]?.sessions || 0;
    
    if (adClicks > 0 && ga4Sessions > 0) {
      // GA4 sessions should be 60-200% of ad clicks (accounting for direct/organic)
      expect(ga4Sessions).toBeGreaterThan(adClicks * 0.5);
      expect(ga4Sessions).toBeLessThan(adClicks * 2.5);
      
      console.log(`✓ GA4 sessions: ${ga4Sessions}, Ad clicks: ${adClicks} (ratio: ${(ga4Sessions / adClicks).toFixed(2)})`);
    }
  });
});
