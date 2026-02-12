"use client"

import { Suspense, useEffect, useRef, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Calendar, Loader2, Users, DollarSign, ArrowUp, ArrowDown, Minus, AlertTriangle, Shield, Target, Sparkles, CheckCircle2, Clock, Lightbulb, Brain, Swords, Wallet, Image, Search, RefreshCw, Pause, XCircle, Play, ChevronUp, ChevronDown, Monitor, Smartphone, Percent, MapPin, FileText } from "lucide-react"
import { GadsSummaryTab } from "@/components/google-ads/GadsSummaryTab"
import { GadsCPCTab } from "@/components/google-ads/GadsCPCTab"
import { GadsAgeTab } from "@/components/google-ads/GadsAgeTab"
import { GadsAssetTab } from "@/components/google-ads/GadsAssetTab"
import { BingSummaryTab } from "@/components/bing-ads/BingSummaryTab"
import { BingCPCTab } from "@/components/bing-ads/BingCPCTab"

// Always use Railway API (no local Python backend needed)
const PROPHET_API_URL = "https://qbtraining-site-production.up.railway.app"

// Sales interfaces
interface PeriodMetrics {
  label: string
  date_range: string
  direct_qty: number
  direct_revenue: number
  py_qty: number
  py_revenue: number
  qty_change_pct: number
  revenue_change_pct: number
  // Renewal metrics
  renewal_qty: number
  renewal_revenue: number
  py_renewal_qty: number
  py_renewal_revenue: number
  renewal_qty_change_pct: number
  renewal_revenue_change_pct: number
  // Total gross revenue
  total_gross_revenue: number
  py_total_gross_revenue: number
  total_gross_revenue_change_pct: number
}

interface MetricsResponse {
  yesterday: PeriodMetrics
  today: PeriodMetrics
  this_week: PeriodMetrics
  this_month: PeriodMetrics
  avg_sale_price: number
}

interface HourlyPeriodData {
  period_label: string
  period_date: string
  hourly_sales: { [hour: string]: number | null }
  end_of_day: number | null
}

interface HourlyComparisonResponse {
  periods: HourlyPeriodData[]
  hours: string[]
}

interface WeeklyTrendRow {
  week_label: string
  week_start: string
  daily_cumulative: { [day: string]: number | null }
  week_total: number | null
}

interface WeeklyTrendsResponse {
  weeks: WeeklyTrendRow[]
  days: string[]
}

interface ExtendedWeeklyTrendRow {
  week_label: string
  week_start: string
  daily_cumulative: { [day: string]: number | null }
  week_total: number | null
}

interface ExtendedWeeklyTrendsResponse {
  direct_qty: WeeklyTrendRow[]
  direct_revenue: ExtendedWeeklyTrendRow[]
  renewal_qty: WeeklyTrendRow[]
  renewal_revenue: ExtendedWeeklyTrendRow[]
  total_gross_revenue: ExtendedWeeklyTrendRow[]
  days: string[]
}

interface ProductMixRow {
  week_label: string
  week_start: string
  total: number
  cert_pct: number
  learner_pct: number
  team_pct: number
}

interface ProductMixResponse {
  weeks: ProductMixRow[]
}

interface WeeklyQtyYoYDataPoint {
  week_num: number
  week_label: string
  y2024: number | null
  y2025: number | null
  y2026: number | null
}

interface WeeklyQtyYoYResponse {
  data: WeeklyQtyYoYDataPoint[]
  current_week: number
}

interface MonthlyQtyYoYDataPoint {
  month_num: number
  month_label: string
  y2024: number | null
  y2025: number | null
  y2026: number | null
}

interface MonthlyQtyYoYResponse {
  data: MonthlyQtyYoYDataPoint[]
  current_month: number
}

interface MonthlyTrendRow {
  month_key: string
  month_label: string
  row_label: string
  direct_qty: Record<string, number | null>
  direct_revenue: Record<string, number | null>
  renewal_qty: Record<string, number | null>
  renewal_revenue: Record<string, number | null>
  total_gross_revenue: Record<string, number | null>
  total_direct_qty: number
  cert_total: number
  team_total: number
  learner_total: number
}

interface MonthlyTrendsResponse {
  months: MonthlyTrendRow[]
  weeks: string[]
}

interface EODForecastResponse {
  predicted_sales: number
  predicted_lower: number
  predicted_upper: number
  confidence_level: string
  predicted_revenue: number
  avg_order_value: number
  current_sales: number
  current_revenue: number
  pace_indicator: string
  pace_pct: number
  progress_pct: number
  // Expected at hour context for pace
  expected_at_hour: number
  current_hour: number
  // Holiday awareness fields
  is_holiday: boolean
  is_holiday_adjacent: boolean
  holiday_name: string | null
  holiday_impact_factor: number
  holiday_confidence: string
}

interface EODProjectionResponse {
  current_time: string
  current_hour: number
  current_weekday: string
  current_sales: number
  projected_eod: number
  projected_lower: number
  projected_upper: number
  pct_of_day_complete: number
  confidence: string
  vs_last_week: number
  vs_two_weeks: number
  last_week_eod: number
  two_weeks_eod: number
}

interface EOWForecastResponse {
  predicted_sales: number
  predicted_lower: number
  predicted_upper: number
  confidence_level: string
  predicted_revenue: number
  avg_order_value: number
  current_week_sales: number
  current_week_revenue: number
  pace_indicator: string
  pace_pct: number
  progress_pct: number
  // Week context
  week_start_date: string
  week_end_date: string
  days_completed: number
  days_remaining: number
  current_day_of_week: string
  // Historical comparison
  last_week_total: number
  last_week_change_pct: number
  avg_weekly_sales: number
  // Holiday awareness
  week_has_holiday: boolean
  holiday_name: string | null
  holiday_impact_factor: number
}

interface EOMForecastResponse {
  predicted_sales: number
  predicted_lower: number
  predicted_upper: number
  current_month_sales: number
  days_completed: number
  days_remaining: number
  progress_pct: number
  pace_pct: number
  month_name: string
  last_month_total: number
  last_month_change_pct: number
  py_month_total: number
  py_change_pct: number
}

interface NextWeekPreviewResponse {
  predicted_sales: number
  predicted_lower: number
  predicted_upper: number
  week_start_date: string
  week_end_date: string
  vs_this_week_pct: number
  vs_last_week_pct: number
  has_holiday: boolean
  holiday_name: string | null
  daily_breakdown: Array<{
    day: string
    date: string
    predicted: number
  }>
}

interface ThisWeekForecastResponse {
  predicted_sales: number
  current_week_sales: number
  week_start_date: string
  week_end_date: string
  days_completed: number
  days_remaining: number
  vs_last_week_pct: number
  has_holiday: boolean
  holiday_name: string | null
  daily_breakdown: Array<{
    day: string
    date: string
    predicted: number
    actual: number | null
  }>
}

// Traffic interfaces
interface TrafficSourceMetrics {
  sessions: number
  conversions: number
  conversion_rate: number
}

interface TrafficPeriodData {
  label: string
  date_range: string
  gads_bing: TrafficSourceMetrics
  organic: TrafficSourceMetrics
  direct: TrafficSourceMetrics
  referral: TrafficSourceMetrics
  paid: TrafficSourceMetrics
  total: TrafficSourceMetrics
}

interface TrafficResponse {
  today: TrafficPeriodData
  yesterday: TrafficPeriodData
  this_week: TrafficPeriodData
  mtd: TrafficPeriodData
}

// Weekly traffic by source (like Product Mix layout)
interface TrafficBySourceWeekRow {
  week_label: string
  week_start: string
  total_sessions: number
  total_conversions: number
  gads_bing_sessions: number
  gads_bing_sessions_pct: number
  organic_sessions: number
  organic_sessions_pct: number
  direct_sessions: number
  direct_sessions_pct: number
  referral_sessions: number
  referral_sessions_pct: number
  paid_sessions: number
  paid_sessions_pct: number
  gads_bing_conversions: number
  gads_bing_conversions_pct: number
  organic_conversions: number
  organic_conversions_pct: number
  direct_conversions: number
  direct_conversions_pct: number
  referral_conversions: number
  referral_conversions_pct: number
  paid_conversions: number
  paid_conversions_pct: number
}

interface TrafficBySourceWeeklyResponse {
  weeks: TrafficBySourceWeekRow[]
}

// Traffic trends (from Google Sheets)
interface TrafficTrendMonthRow {
  month_key: string
  month_label: string
  row_label: string
  organic: Record<string, number | null>
  direct: Record<string, number | null>
  referral: Record<string, number | null>
  paid: Record<string, number | null>
  total: Record<string, number | null>
  organic_total: number
  direct_total: number
  referral_total: number
  paid_total: number
  grand_total: number
}

interface TrafficYoYDataPoint {
  week_num?: number
  week_label?: string
  month_num?: number
  month_label?: string
  y2024: number | null
  y2025: number | null
  y2026: number | null
}

interface TrafficWeeklyTrendRow {
  week_label: string
  week_start: string
  daily_cumulative: Record<string, number | null>
  week_total: number | null
}

interface TrafficKpiPeriod {
  value: number
  py: number
  change_pct: number
  diff: number
}

interface TrafficKpiData {
  today: number
  yesterday: TrafficKpiPeriod
  this_week: TrafficKpiPeriod
  mtd: TrafficKpiPeriod
  ytd: TrafficKpiPeriod
}

interface TrafficTrendsResponse {
  monthly_trends: { months: TrafficTrendMonthRow[]; weeks: string[] }
  weekly_trends: { data: Record<string, TrafficWeeklyTrendRow[]>; days: string[] }
  weekly_yoy: Record<string, TrafficYoYDataPoint[]>
  monthly_yoy: Record<string, TrafficYoYDataPoint[]>
  kpi: Record<string, TrafficKpiData>
  current_week: number
  current_month: number
}

type TrafficSource = 'total' | 'organic' | 'direct' | 'referral' | 'paid'
type ConversionSource = 'total' | 'organic' | 'direct' | 'referral' | 'paid'
type AdsMetric = 'conversions' | 'impressions' | 'clicks' | 'avg_cpc' | 'spend' | 'cost_per_conv'

interface AdsTrendsResponse {
  monthly_trends: { months: Record<string, unknown>[]; weeks: string[] }
  weekly_trends: { data: Record<string, { week_label: string; week_start: string; daily_cumulative: Record<string, number | null>; week_total: number | null }[]>; days: string[] }
  weekly_yoy: Record<string, { week_num?: number; week_label?: string; month_num?: number; month_label?: string; y2024: number | null; y2025: number | null; y2026: number | null }[]>
  monthly_yoy: Record<string, { month_num?: number; month_label?: string; y2024: number | null; y2025: number | null; y2026: number | null }[]>
  kpi: Record<string, { today: number; yesterday: { value: number; py: number; change_pct: number; diff: number }; this_week: { value: number; py: number; change_pct: number; diff: number }; mtd: { value: number; py: number; change_pct: number; diff: number }; ytd: { value: number; py: number; change_pct: number; diff: number } }>
  current_week: number
  current_month: number
}

const ADS_METRIC_LABELS: Record<AdsMetric, string> = {
  conversions: 'Total Conversions',
  impressions: 'Impressions',
  clicks: 'Clicks',
  avg_cpc: 'Avg CPC',
  spend: 'Spend',
  cost_per_conv: 'Cost / Conversion',
}

const ADS_METRIC_COLORS: Record<AdsMetric, string> = {
  conversions: '#34C759',
  impressions: '#0066CC',
  clicks: '#FF9500',
  avg_cpc: '#AF52DE',
  spend: '#FF3B30',
  cost_per_conv: '#FF6B6B',
}

function formatAdsValue(value: number | null | undefined, metric: AdsMetric): string {
  if (value === null || value === undefined) return '-'
  if (metric === 'cost_per_conv') {
    return '$' + Math.round(value).toLocaleString()
  }
  if (metric === 'spend') {
    return '$' + Math.round(value).toLocaleString()
  }
  if (metric === 'avg_cpc') {
    return '$' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function formatAdsDiff(diff: number, metric: AdsMetric): string {
  const prefix = diff >= 0 ? '+' : ''
  if (metric === 'cost_per_conv' || metric === 'spend') {
    return prefix + '$' + Math.abs(Math.round(diff)).toLocaleString()
  }
  if (metric === 'avg_cpc') {
    return prefix + '$' + Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return prefix + diff.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

// For avg_cpc and cost_per_conv, lower is better
function isAdsChangePositive(metric: AdsMetric, changePct: number): boolean {
  if (metric === 'avg_cpc' || metric === 'cost_per_conv') return changePct <= 0
  return changePct >= 0
}

// Auction Insights interfaces
interface AuctionInsightRow {
  snapshot_week: string
  competitor_domain: string
  impression_share: number
  overlap_rate: number
  position_above_rate: number
  outranking_share: number
}

interface CompetitorCard {
  domain: string
  display_name: string
  is_you: boolean
  current_metrics: {
    impression_share: number
    overlap_rate: number
    position_above_rate: number
    outranking_share: number
  }
  trend: "up" | "down" | "stable"
  change_pct: number
  weekly_data: Array<{
    week: string
    impression_share: number
    position_above_rate: number
    outranking_share: number
  }>
  forecast_next_week: number
}

interface AuctionInsightsResponse {
  competitors: string[]
  weeks: string[]
  data: AuctionInsightRow[]
  competitor_cards: CompetitorCard[]
  trends_summary: {
    aggressive: string[]
    falling_back: string[]
    stable: string[]
  }
}

// Google Ads Performance interfaces
interface AccountWeeklyMetrics {
  week: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  cpa: number
  roas: number
  ctr: number
  conversion_rate: number
}

interface AccountPerformanceResponse {
  current_week: AccountWeeklyMetrics
  previous_week: AccountWeeklyMetrics
  wow_change: {
    spend: number
    clicks: number
    impressions: number
    conversions: number
    cpa: number
    roas: number
    ctr: number
    conversion_rate: number
  }
  weekly_data: AccountWeeklyMetrics[]
  forecast: {
    spend: number
    conversions: number
  }
}

interface CampaignMetrics {
  campaign_name: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  cpa: number
  roas: number
  ctr: number
  conversion_rate: number
  trend: "up" | "down" | "stable"
  change_pct: number
  // Prior week data for comparison
  prior_spend?: number
  prior_clicks?: number
  prior_conversions?: number
  prior_cpa?: number
  prior_ctr?: number
}

interface CampaignsResponse {
  week: string
  top_by_spend: CampaignMetrics[]
  top_by_conversions: CampaignMetrics[]
  all_campaigns: CampaignMetrics[]
}

interface CampaignWeekData {
  week_label: string
  week_start: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  cpa: number
  ctr: number
  conversion_rate: number
}

interface CampaignWeeklyData {
  campaign_name: string
  weeks: CampaignWeekData[]
}

interface CampaignsWeeklyResponse {
  campaigns: CampaignWeeklyData[]
}

interface KeywordMetrics {
  keyword: string
  campaign: string
  match_type: string
  spend: number
  clicks: number
  impressions: number
  conversions: number
  cpa: number
  ctr: number
  quality_score: number | null
  avg_position: number | null
}

interface KeywordComparison {
  keyword: string
  campaign: string
  match_type: string
  last_week_conversions: number
  last_week_spend: number
  last_week_cpa: number
  last_week_clicks: number
  last_week_ctr: number
  last_week_max_cpc?: number
  last_week_avg_cpc?: number
  last_week_search_impr_share?: number
  last_week_click_share?: number
  two_weeks_ago_conversions?: number
  two_weeks_ago_spend?: number
  two_weeks_ago_cpa?: number
  two_weeks_ago_clicks?: number
  two_weeks_ago_ctr?: number
  two_weeks_ago_max_cpc?: number
  two_weeks_ago_avg_cpc?: number
  two_weeks_ago_search_impr_share?: number
  two_weeks_ago_click_share?: number
  conversion_change?: number
  spend_change?: number
}

// N8n Keywords Weekly - from ADVERONIX sheet
interface N8nKeywordWeeklyItem {
  keyword: string
  campaign: string
  match_type: string
  last_week_avg_cpc: number
  last_week_conversions: number
  last_week_cost: number
  last_week_cpa: number
  two_weeks_ago_avg_cpc?: number
  two_weeks_ago_conversions?: number
  two_weeks_ago_cost?: number
  two_weeks_ago_cpa?: number
}

interface N8nKeywordsWeeklyResponse {
  last_week: string
  two_weeks_ago: string
  keywords: N8nKeywordWeeklyItem[]
}

interface KeywordsResponse {
  week: string
  top_performing: KeywordMetrics[]
  bottom_performing: KeywordMetrics[]
  high_potential: KeywordMetrics[]
  prior_week?: string
  prior_top_performing?: KeywordMetrics[]
  prior_bottom_performing?: KeywordMetrics[]
  prior_high_potential?: KeywordMetrics[]
  two_weeks_ago?: string
  two_weeks_ago_top_performing?: KeywordMetrics[]
  two_weeks_ago_bottom_performing?: KeywordMetrics[]
  all_keywords_comparison?: KeywordComparison[]
}

// Jedi Council interfaces
interface AIModelRecommendation {
  model_name: string
  summary: string
  key_points: string[]
  confidence?: number
  focus_area?: string
}

interface BudgetMetricValue {
  current: number | string
  prior: number | string
}

interface BudgetCampaignMetrics {
  clicks: BudgetMetricValue
  ctr: BudgetMetricValue
  conversions: BudgetMetricValue
  cpa: BudgetMetricValue
  avgCpc: BudgetMetricValue
  spend: BudgetMetricValue
}

interface SynthesizedRecommendation {
  title: string
  priority: "high" | "medium" | "low"
  category: string
  consensus_level: "unanimous" | "majority" | "split"
  action_items: string[]
  rationale: string
  expected_impact?: string
  timeline?: string
  // Individual LLM votes
  gpt_vote?: string
  claude_vote?: string
  gemini_vote?: string
  // Individual LLM reasoning (extracted from rationale or separate)
  gpt_reasoning?: string
  claude_reasoning?: string
  gemini_reasoning?: string
  // Campaign metrics with week-over-week comparison
  campaignName?: string
  decision?: string
  metrics?: BudgetCampaignMetrics
}

interface CategoryInsight {
  title: string
  severity: "urgent" | "warning" | "opportunity" | "success"
  description: string
  metric?: string
  recommendation?: string
  impact?: string
}

interface CategoryAnalysis {
  category: string
  ai_source: string
  confidence: number
  insights: CategoryInsight[]
  summary: string
  data_points?: number
}

interface JediCouncilData {
  generated_at: string
  analysis_period?: string
  ai_recommendations: AIModelRecommendation[]
  synthesized: SynthesizedRecommendation[]
  categories?: {
    campaigns?: CategoryAnalysis
    competitors?: CategoryAnalysis
    budget?: CategoryAnalysis
    assets?: CategoryAnalysis
    keywords?: CategoryAnalysis
  }
  total_recommendations: number
  high_priority_count: number
  consensus_items: number
  data_sources?: string[]
  next_review?: string
}

interface JediCouncilResponse {
  available: boolean
  data?: JediCouncilData
  last_updated?: string
  message?: string
}

// Subscriptions interfaces
interface SubscriptionMetrics {
  total_subscriptions: number
  active_subscriptions: number
  cancelled_subscriptions: number
  on_hold_subscriptions: number
  other_status_count: number
  mrr: number
  avg_order_value: number
  new_this_month: number
  new_this_week: number
  cancelled_this_month: number
  cancelled_this_week: number
}

interface StatusBreakdown {
  status: string
  count: number
  percentage: number
  total_revenue: number
}

interface SubscriptionsResponse {
  metrics: SubscriptionMetrics
  status_breakdown: StatusBreakdown[]
  last_updated: string
}

interface SubscriberMetricsData {
  immediate_cancels_total: number
  immediate_cancels_pct: number
  immediate_cancels_avg_monthly: number
  immediate_cancels_by_month: Record<string, number>
  new_adds_by_month: Record<string, number>
  immediate_cancel_rate_by_month: Record<string, number>
  // Monthly averages
  avg_churn_12mo: number
  // Adjusted churn (excluding immediate cancels)
  churn_by_month: Record<string, number>
  immediate_by_churn_month: Record<string, number>
  adjusted_churn_by_month: Record<string, number>
  adjusted_churn_rate_by_month: Record<string, number>
  avg_adjusted_churn_12mo: number
  active_at_start_by_month: Record<string, number>
  adjusted_attrition_rate_by_month: Record<string, number>
  // Tier breakdown
  tier_breakdown: {
    tier_29: number
    tier_40: number
    tier_50_70: number
    tier_90_plus: number
  }
  // Average renewal
  current_avg_renewal: number
  // Quarterly cohort retention
  quarterly_cohort_retention: Record<string, { total_adds: number; still_active: number; retention_pct: number }>
  // Subscription duration & lifecycle
  avg_subscription_days: number
  avg_subscription_months: number
  median_subscription_days: number
  median_subscription_months: number
  active_avg_subscription_months: number
  active_median_subscription_months: number
  cancelled_avg_subscription_months: number
  cancelled_median_subscription_months: number
  lifetime_churn_rate: number
  cohort_survival: Record<string, number>
  avg_duration_by_year: Record<string, number>
  renewal_trend: {
    cohort_2023_avg: number
    cohort_2024_avg: number
    cohort_2025_avg: number
    cohort_2026_avg: number
    projected_12mo_avg: number
    projected_increase_pct: number
  }
}

interface SubscriberMetricsResponse {
  available: boolean
  data: SubscriberMetricsData | null
  last_updated: string | null
  message: string
}

type SectionType = "revenue" | "advertising" | "organic" | "tools" | "reports"

type TabType = "sales" | "subscriptions" | "google-ads" | "bing-ads" | "traffic" | "conversions" | "gsc" | "landing-pages" | "seo-rankings" | "seo-ai-search" | "seo-competitors"

const SECTION_TABS: Record<SectionType, TabType[]> = {
  revenue: ["sales", "subscriptions"],
  advertising: ["google-ads", "bing-ads"],
  organic: ["traffic", "conversions", "gsc", "landing-pages"],
  tools: ["seo-rankings", "seo-ai-search", "seo-competitors"],
  reports: [],
}

const SECTION_DEFAULTS: Record<SectionType, TabType | null> = {
  revenue: "sales",
  advertising: "google-ads",
  organic: "traffic",
  tools: "seo-rankings",
  reports: null,
}

const TAB_TO_SECTION: Record<TabType, SectionType> = {
  sales: "revenue",
  subscriptions: "revenue",
  "google-ads": "advertising",
  "bing-ads": "advertising",
  traffic: "organic",
  conversions: "organic",
  gsc: "organic",
  "landing-pages": "organic",
  "seo-rankings": "tools",
  "seo-ai-search": "tools",
  "seo-competitors": "tools",
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCurrencyDecimal(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatCurrencyCompact(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`
  }
  return `$${Math.round(value)}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

function abbreviatePeriodLabel(label: string): string {
  const mappings: { [key: string]: string } = {
    "1 Week Ago": "1W Ago",
    "2 Weeks Ago": "2W Ago", 
    "3 Weeks Ago": "3W Ago",
    "4 Weeks Ago": "4W Ago",
    "1 Year Ago": "1Y Ago",
    "Last 4 Weeks Avg": "L4W Avg",
    "Last 6 Months Avg": "L6M Avg",
    "Last 12 Months Avg": "L12M Avg",
  }
  return mappings[label] || label
}

// Jedi Council Category Types - 5 main categories
type JediCategory = "budget" | "bids" | "competitors" | "assets" | "search-terms"

const categoryConfig = {
  budget: {
    label: "Budget & Spend",
    icon: Wallet,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    ai: "3-LLM Council",
    description: "Campaign budget optimization recommendations"
  },
  bids: {
    label: "Max CPC Bids",
    icon: DollarSign,
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
    ai: "3-LLM Council",
    description: "Keyword bid optimization recommendations"
  },
  competitors: {
    label: "Competitor Landscape",
    icon: Swords,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    ai: "Coming Soon",
    description: "Auction insights and competitive positioning"
  },
  assets: {
    label: "Asset Performance",
    icon: Image,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-700",
    ai: "Coming Soon",
    description: "Ad creative and asset performance analysis"
  },
  "search-terms": {
    label: "Search Terms",
    icon: Search,
    color: "from-cyan-500 to-teal-500",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    textColor: "text-cyan-700",
    ai: "Coming Soon",
    description: "Search term analysis and optimization"
  }
}

// Campaign Council Decisions Component - Shows individual campaign votes and reasoning
function CampaignCouncilDecisions({ recommendations }: { recommendations: SynthesizedRecommendation[] }) {
  // Filter to only campaign/budget recommendations
  const campaignRecs = recommendations.filter(r =>
    r.category.toLowerCase() === 'budget' ||
    r.category.toLowerCase() === 'campaign' ||
    r.category.toLowerCase() === 'campaigns'
  )

  if (campaignRecs.length === 0) return null

  // Count stats
  const unanimousCount = campaignRecs.filter(r => r.consensus_level === 'unanimous').length

  // Extract campaign name from title (e.g., "MAINTAIN budget for Courses-Desktop" -> "Courses-Desktop")
  const getCampaignName = (title: string) => {
    const match = title.match(/for\s+(.+)$/i)
    return match ? match[1] : title
  }

  // Define sort order for campaigns
  const campaignOrder = [
    'Certification-Desktop', 'Certification-Mobile',
    'Training-Desktop', 'Training-Mobile',
    'Courses-Desktop', 'Courses-Mobile',
    'Classes-Desktop', 'Classes-Mobile'
  ]

  // Sort campaigns by the defined order
  const sortedCampaignRecs = [...campaignRecs].sort((a, b) => {
    const nameA = getCampaignName(a.title)
    const nameB = getCampaignName(b.title)
    const indexA = campaignOrder.findIndex(c => nameA.toLowerCase().includes(c.toLowerCase()))
    const indexB = campaignOrder.findIndex(c => nameB.toLowerCase().includes(c.toLowerCase()))
    // If not found in order, put at end
    const orderA = indexA === -1 ? 999 : indexA
    const orderB = indexB === -1 ? 999 : indexB
    return orderA - orderB
  })

  // Extract decision from title
  const getDecision = (title: string) => {
    const decisions = ['INCREASE', 'DECREASE', 'MAINTAIN', 'PAUSE']
    for (const d of decisions) {
      if (title.toUpperCase().includes(d)) return d
    }
    return 'MAINTAIN'
  }

  // Get decision color
  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'INCREASE': return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
      case 'DECREASE': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' }
      case 'PAUSE': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
      default: return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
    }
  }

  // Get vote color
  const getVoteColor = (vote: string | undefined) => {
    if (!vote || vote === 'N/A') return 'text-gray-400'
    switch (vote.toUpperCase()) {
      case 'INCREASE': return 'text-green-600'
      case 'DECREASE': return 'text-yellow-600'
      case 'PAUSE': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  // Parse individual reasoning from rationale string
  const parseReasoning = (rec: SynthesizedRecommendation) => {
    // If we have explicit reasoning fields, use them
    if (rec.gpt_reasoning || rec.claude_reasoning || rec.gemini_reasoning) {
      return {
        gpt: rec.gpt_reasoning || 'N/A',
        claude: rec.claude_reasoning || 'N/A',
        gemini: rec.gemini_reasoning || 'N/A'
      }
    }

    // Otherwise try to parse from rationale string
    const rationale = rec.rationale || ''
    const gptMatch = rationale.match(/GPT-4o?:\s*([^.]+(?:\.[^.]+)?)\./i)
    const claudeMatch = rationale.match(/Claude:\s*([^.]+(?:\.[^.]+)?)\./i)
    const geminiMatch = rationale.match(/Gemini:\s*([^.]+(?:\.[^.]+)?)\./i)

    return {
      gpt: gptMatch ? gptMatch[1].trim() : 'N/A',
      claude: claudeMatch ? claudeMatch[1].trim() : 'N/A',
      gemini: geminiMatch ? geminiMatch[1].trim() : 'N/A'
    }
  }

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <Target className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Campaign Council Decisions</CardTitle>
            <p className="text-sm text-[#6E6E73]">
              {campaignRecs.length} campaigns analyzed • 3 AI models voted • {unanimousCount} unanimous decisions
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {sortedCampaignRecs.map((rec, idx) => {
            const campaignName = getCampaignName(rec.title)
            const decision = getDecision(rec.title)
            const colors = getDecisionColor(decision)
            const reasoning = parseReasoning(rec)

            return (
              <div
                key={idx}
                className={`rounded-xl border ${colors.border} bg-white overflow-hidden transition-all`}
              >
                {/* Campaign Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-[#1D1D1F]">{campaignName}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                      {decision}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      rec.consensus_level === 'unanimous' ? 'bg-green-100 text-green-700' :
                      rec.consensus_level === 'majority' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {rec.consensus_level?.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#6E6E73]">• {rec.expected_impact}</span>
                  </div>

                  {/* Campaign Metrics with Week-over-Week Comparison */}
                  {rec.metrics && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: 'Clicks', key: 'clicks' as const, format: (v: number | string) => typeof v === 'number' ? v.toLocaleString() : v },
                        { label: 'CTR', key: 'ctr' as const, format: (v: number | string) => v },
                        { label: 'Convs', key: 'conversions' as const, format: (v: number | string) => typeof v === 'number' ? v.toFixed(1) : v },
                        { label: 'CPA', key: 'cpa' as const, format: (v: number | string) => v },
                        { label: 'Avg CPC', key: 'avgCpc' as const, format: (v: number | string) => v },
                        { label: 'Spend', key: 'spend' as const, format: (v: number | string) => v },
                      ].map(({ label, key, format }) => {
                        const metric = rec.metrics![key]
                        const current = metric?.current ?? 0
                        const prior = metric?.prior ?? 0
                        const currentNum = typeof current === 'number' ? current : parseFloat(String(current).replace(/[$,%]/g, '')) || 0
                        const priorNum = typeof prior === 'number' ? prior : parseFloat(String(prior).replace(/[$,%]/g, '')) || 0
                        const isUp = currentNum > priorNum
                        const isDown = currentNum < priorNum
                        return (
                          <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-[#6E6E73] uppercase tracking-wide">{label}</p>
                            <p className="text-sm font-semibold text-[#1D1D1F]">{format(current)}</p>
                            <div className="flex items-center justify-center gap-1">
                              {isUp && <ArrowUp className="h-2.5 w-2.5 text-green-600" />}
                              {isDown && <ArrowDown className="h-2.5 w-2.5 text-red-600" />}
                              {!isUp && !isDown && <Minus className="h-2.5 w-2.5 text-gray-400" />}
                              <span className="text-[10px] text-[#6E6E73]">{format(prior)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* LLM Votes Row */}
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1 bg-green-50 rounded-lg p-2 border border-green-100 text-center">
                      <p className="text-[10px] font-medium text-green-700">GPT-4o</p>
                      <span className={`text-xs font-bold ${getVoteColor(rec.gpt_vote)}`}>
                        {rec.gpt_vote || 'N/A'}
                      </span>
                    </div>
                    <div className="flex-1 bg-orange-50 rounded-lg p-2 border border-orange-100 text-center">
                      <p className="text-[10px] font-medium text-orange-700">Claude</p>
                      <span className={`text-xs font-bold ${getVoteColor(rec.claude_vote)}`}>
                        {rec.claude_vote || 'N/A'}
                      </span>
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-lg p-2 border border-blue-100 text-center">
                      <p className="text-[10px] font-medium text-blue-700">Gemini</p>
                      <span className={`text-xs font-bold ${getVoteColor(rec.gemini_vote)}`}>
                        {rec.gemini_vote || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Keywords Council Data Interface
interface KeywordsCouncilData {
  type: string
  generated_at: string
  analysis_period: string
  currentWeek: string
  priorWeek: string
  synthesized: KeywordBidRecommendation[]
  total_keywords: number
  increase_count: number
  decrease_count: number
  maintain_count: number
  consensus_count: number
}

interface KeywordBidRecommendation {
  id: number
  action: string
  priority: string
  confidence: number
  category: string
  campaignName: string
  keyword: string
  decision: string
  consensus: string
  currentMaxCpc: string
  imprTopPct: string
  clickShare: string
  searchImprShare: string
  clicks: number
  conversions: number
  cpa: string
  avgCpc: string
  priorClicks: number
  priorConversions: number
  priorCpa: string
  gptVote: string
  claudeVote: string
  geminiVote: string
  gptReasoning: string
  claudeReasoning: string
  geminiReasoning: string
}

function JediCouncilSection({ jediCouncil }: { jediCouncil: JediCouncilResponse | null }) {
  const [activeCategory, setActiveCategory] = useState<JediCategory>("budget")
  const [keywordsCouncil, setKeywordsCouncil] = useState<KeywordsCouncilData | null>(null)
  const [keywordsLoading, setKeywordsLoading] = useState(false)
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null)

  // Fetch keywords council data when Bids tab is selected
  // Uses localStorage cache for instant loading, then refreshes in background
  useEffect(() => {
    if (activeCategory === 'bids' && !keywordsCouncil) {
      const CACHE_KEY = 'jedi-council-keywords'
      const CACHE_TIMESTAMP_KEY = 'jedi-council-keywords-timestamp'

      // Try to load from localStorage cache first for instant display
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
        if (cached && cachedTimestamp) {
          const cacheAge = Date.now() - parseInt(cachedTimestamp)
          // Use cache if less than 24 hours old
          if (cacheAge < 24 * 60 * 60 * 1000) {
            setKeywordsCouncil(JSON.parse(cached))
            setKeywordsLoading(false)
          }
        }
      } catch (e) {
        console.error('Failed to load keywords cache:', e)
      }

      // Always fetch fresh data in background (unless already loading)
      if (!keywordsLoading) {
        setKeywordsLoading(true)
        fetch(`${PROPHET_API_URL}/jedi-council/keywords`)
          .then(res => res.json())
          .then(data => {
            if (data.available && data.data) {
              setKeywordsCouncil(data.data)
              // Save to localStorage for next visit
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data.data))
                localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
              } catch (e) {
                console.error('Failed to cache keywords:', e)
              }
            }
          })
          .catch(err => console.error('Failed to fetch keywords council:', err))
          .finally(() => setKeywordsLoading(false))
      }
    }
  }, [activeCategory, keywordsCouncil, keywordsLoading])

  // Get category data from the API response
  // Map UI categories to API category names
  const categoryApiMapping: Record<string, keyof NonNullable<JediCouncilData['categories']>> = {
    budget: 'budget',
    bids: 'keywords', // bids maps to keywords in API
    competitors: 'competitors',
    assets: 'assets',
    'search-terms': 'keywords' // search-terms also maps to keywords
  }

  const getCategoryData = (cat: keyof typeof categoryConfig): CategoryAnalysis | undefined => {
    const apiKey = categoryApiMapping[cat]
    return apiKey ? jediCouncil?.data?.categories?.[apiKey] : undefined
  }

  // Get recommendations filtered by category
  const getRecommendationsForCategory = (cat: string) => {
    return jediCouncil?.data?.synthesized.filter(r =>
      r.category.toLowerCase() === cat.toLowerCase() ||
      r.category.toLowerCase().includes(cat.slice(0, 5).toLowerCase())
    ) || []
  }

  // Severity styling configuration
  const severityConfig = {
    urgent: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: AlertTriangle },
    warning: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: AlertTriangle },
    opportunity: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Lightbulb },
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: CheckCircle2 }
  }

  const renderCategoryCard = (cat: keyof typeof categoryConfig) => {
    const config = categoryConfig[cat]
    const Icon = config.icon
    const categoryData = getCategoryData(cat)
    const recommendations = getRecommendationsForCategory(cat)

    return (
      <Card key={cat} className={`border-0 shadow-sm overflow-hidden`}>
        <div className={`h-2 bg-gradient-to-r ${config.color}`} />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`h-5 w-5 ${config.textColor}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{config.label}</CardTitle>
                <p className="text-xs text-[#6E6E73]">{config.description}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium ${config.textColor} ${config.bgColor} px-2 py-1 rounded`}>
                {categoryData?.ai_source || config.ai}
              </span>
              {categoryData?.confidence && (
                <div className="text-xs text-[#6E6E73] mt-1">{categoryData.confidence}% confident</div>
              )}
              {categoryData?.data_points && (
                <div className="text-xs text-[#6E6E73]">{categoryData.data_points} data points</div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Category Summary */}
          {categoryData?.summary && (
            <div className={`${config.bgColor} rounded-lg p-3 border ${config.borderColor}`}>
              <p className="text-sm text-[#1D1D1F]">{categoryData.summary}</p>
            </div>
          )}

          {/* Category Insights */}
          {categoryData?.insights && categoryData.insights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[#1D1D1F] flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Key Insights
              </h4>
              <div className="space-y-2">
                {categoryData.insights.slice(0, 5).map((insight, i) => {
                  const severityStyle = severityConfig[insight.severity] || severityConfig.opportunity
                  const SeverityIcon = severityStyle.icon
                  return (
                    <div key={i} className={`rounded-lg p-3 border ${severityStyle.border} ${severityStyle.bg}`}>
                      <div className="flex items-start gap-2">
                        <SeverityIcon className={`h-4 w-4 ${severityStyle.text} mt-0.5 flex-shrink-0`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#1D1D1F]">{insight.title}</span>
                            {insight.metric && (
                              <span className={`text-xs font-medium ${severityStyle.text}`}>{insight.metric}</span>
                            )}
                          </div>
                          <p className="text-xs text-[#6E6E73]">{insight.description}</p>
                          {insight.recommendation && (
                            <div className="mt-2 pt-2 border-t border-[#E5E5E7]">
                              <p className="text-xs text-[#1D1D1F]">
                                <span className="font-medium">Action:</span> {insight.recommendation}
                              </p>
                            </div>
                          )}
                          {insight.impact && (
                            <p className="text-xs text-[#6E6E73] mt-1">
                              <span className="font-medium">Impact:</span> {insight.impact}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Items from Synthesized */}
          {recommendations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E5E5E7]">
              <h4 className="text-sm font-medium text-[#1D1D1F] flex items-center gap-2">
                <Target className="h-4 w-4 text-red-500" />
                Recommended Actions
              </h4>
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div key={idx} className={`rounded-lg p-3 border ${
                  rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                  'border-green-200 bg-green-50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                    {rec.timeline && (
                      <span className="text-xs text-[#6E6E73]">{rec.timeline}</span>
                    )}
                  </div>
                  <p className="text-sm text-[#1D1D1F]">{rec.title}</p>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {(!categoryData?.insights || categoryData.insights.length === 0) && recommendations.length === 0 && (
            <div className="text-center py-6 text-[#6E6E73]">
              <Icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No insights available yet</p>
              <p className="text-xs">Data will appear after the next analysis run</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Custom render for Campaigns tab - shows individual campaign cards with voting
  const renderCampaignCards = () => {
    const synthesized = jediCouncil?.data?.synthesized || []
    const campaignInsights = jediCouncil?.data?.categories?.campaigns?.insights || []

    if (synthesized.length === 0 && campaignInsights.length === 0) {
      return (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-purple-300" />
            <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">No Campaign Data Yet</h3>
            <p className="text-sm text-[#6E6E73]">Run the n8n Campaign Council workflow to see voting results</p>
          </CardContent>
        </Card>
      )
    }

    // Decision color mapping
    const decisionStyles = {
      INCREASE: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", badge: "bg-green-100" },
      DECREASE: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", badge: "bg-yellow-100" },
      MAINTAIN: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-100" },
      PAUSE: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", badge: "bg-red-100" }
    }

    // Extract campaign info from synthesized recommendations
    const campaigns = synthesized.map((rec: any) => {
      // Parse decision and campaign name from title (e.g., "INCREASE budget for Courses-Desktop")
      const titleMatch = rec.title.match(/^(INCREASE|DECREASE|MAINTAIN|PAUSE)\s+budget\s+for\s+(.+)$/i)
      const decision = titleMatch ? titleMatch[1].toUpperCase() : "MAINTAIN"
      const campaignName = titleMatch ? titleMatch[2] : rec.title

      return {
        name: campaignName,
        decision: decision as keyof typeof decisionStyles,
        consensus: rec.consensus_level || "unknown",
        priority: rec.priority,
        // Use direct vote fields from n8n workflow
        gptVote: rec.gpt_vote || "N/A",
        claudeVote: rec.claude_vote || "N/A",
        geminiVote: rec.gemini_vote || "N/A",
        actionItems: rec.action_items || [],
        expectedImpact: rec.expected_impact
      }
    })

    return (
      <div className="space-y-4">
        {/* Summary Header */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-900">Campaign Council Decisions</span>
          </div>
          <p className="text-sm text-purple-700">
            {campaigns.length} campaigns analyzed • 3 AI models voted • {campaigns.filter(c => c.consensus === "unanimous").length} unanimous decisions
          </p>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign, idx) => {
            const style = decisionStyles[campaign.decision] || decisionStyles.MAINTAIN
            return (
              <Card key={idx} className={`border-2 ${style.border} ${style.bg} overflow-hidden`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-[#1D1D1F]">
                      {campaign.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge} ${style.text}`}>
                        {campaign.decision}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      campaign.consensus === "unanimous" ? "bg-green-100 text-green-700" :
                      campaign.consensus === "majority" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {campaign.consensus?.toUpperCase() || "UNKNOWN"}
                    </span>
                    {campaign.expectedImpact && (
                      <span className="text-xs text-[#6E6E73]">• {campaign.expectedImpact}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {/* Voting Breakdown */}
                  <div className="bg-white/60 rounded-lg p-3 space-y-2">
                    <div className="text-xs font-medium text-[#6E6E73] mb-2">Council Votes</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { model: "GPT-4o", vote: campaign.gptVote, color: "text-emerald-600" },
                        { model: "Claude", vote: campaign.claudeVote, color: "text-orange-600" },
                        { model: "Gemini", vote: campaign.geminiVote, color: "text-blue-600" }
                      ].map((v) => (
                        <div key={v.model} className="text-center">
                          <div className={`text-xs font-medium ${v.color}`}>{v.model}</div>
                          <div className={`text-sm font-bold ${
                            v.vote === "INCREASE" ? "text-green-600" :
                            v.vote === "DECREASE" ? "text-yellow-600" :
                            v.vote === "PAUSE" ? "text-red-600" :
                            v.vote === "MAINTAIN" ? "text-blue-600" :
                            "text-gray-400"
                          }`}>
                            {v.vote}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Items */}
                  {campaign.actionItems.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-[#6E6E73]">Recommended Actions</div>
                      {campaign.actionItems.slice(0, 2).map((action: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#1D1D1F]">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Clean Header Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#D2D2D7]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#F5F5F7] rounded-xl p-3 flex items-center gap-1.5">
              {/* OpenAI */}
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.6 8.3829l2.02-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997z" fill="#10a37f"/>
              </svg>
              {/* Anthropic */}
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path d="M17.304 3.541h-3.672l6.696 16.918h3.672l-6.696-16.918zM6.696 3.541 0 20.459h3.672l1.344-3.541h6.792l1.344 3.541h3.672L10.128 3.541H6.696zm-.384 10.377 2.112-5.541 2.112 5.541H6.312z" fill="#D97757"/>
              </svg>
              {/* Google Gemini */}
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 24C12 20.2 12.6 17.4 14 15.2C15.6 12.6 18.2 11 22 10V14C19.4 14.4 17.8 15.6 17 17.4C16.4 18.8 16 20.4 16 22H12V24Z" fill="#4285F4"/>
                <path d="M12 24C12 20.2 11.4 17.4 10 15.2C8.4 12.6 5.8 11 2 10V14C4.6 14.4 6.2 15.6 7 17.4C7.6 18.8 8 20.4 8 22H12V24Z" fill="#34A853"/>
                <path d="M12 0C12 3.8 12.6 6.6 14 8.8C15.6 11.4 18.2 13 22 14V10C19.4 9.6 17.8 8.4 17 6.6C16.4 5.2 16 3.6 16 2H12V0Z" fill="#EA4335"/>
                <path d="M12 0C12 3.8 11.4 6.6 10 8.8C8.4 11.4 5.8 13 2 14V10C4.6 9.6 6.2 8.4 7 6.6C7.6 5.2 8 3.6 8 2H12V0Z" fill="#FBBC05"/>
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#1D1D1F]">Jedi Council</h2>
              <p className="text-[#6E6E73] text-sm">3-LLM Strategic Analysis • Runs Mondays at 7am</p>
            </div>
          </div>
          {jediCouncil?.last_updated && (
            <div className="text-right">
              <div className="text-xs text-[#6E6E73]">Last updated</div>
              <div className="text-sm font-medium text-[#1D1D1F]">
                {new Date(jediCouncil.last_updated).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs - 5 categories, no "All" */}
      <div className="flex flex-wrap gap-2 bg-[#F5F5F7] p-2 rounded-xl">
        {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((cat) => {
          const config = categoryConfig[cat]
          const Icon = config.icon
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeCategory === cat
                  ? `bg-white text-[#1D1D1F] shadow-sm`
                  : "text-[#6E6E73] hover:text-[#1D1D1F]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          )
        })}
      </div>

      {/* Show empty state only if no data available AND not on Bids tab with keywords data */}
      {!jediCouncil?.available && !(activeCategory === 'bids' && (keywordsCouncil || keywordsLoading)) ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Brain className="h-16 w-16 text-[#D2D2D7] mb-4" />
            <h3 className="text-xl font-semibold text-[#1D1D1F] mb-2">
              Awaiting Analysis
            </h3>
            <p className="text-[#6E6E73] text-center max-w-md">
              The Jedi Council convenes every Monday at 7:00 AM to analyze your marketing data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Budget & Spend Section */}
          {activeCategory === "budget" && jediCouncil?.data?.synthesized && jediCouncil.data.synthesized.length > 0 && (
            <CampaignCouncilDecisions recommendations={jediCouncil.data.synthesized} />
          )}

          {/* Bids Section */}
          {activeCategory === "bids" && (
            <div className="space-y-6">
              {keywordsLoading ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-8 w-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <p className="text-[#6E6E73]">Loading keyword bid recommendations...</p>
                  </CardContent>
                </Card>
              ) : keywordsCouncil && keywordsCouncil.synthesized && keywordsCouncil.synthesized.length > 0 ? (
                <>
                  {/* Desktop Keywords - Grouped by Campaign */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-600" />
                      Desktop Keywords
                    </h3>
                    {/* Group by campaign */}
                    {(() => {
                      const desktopKeywords = keywordsCouncil.synthesized.filter((kw: KeywordBidRecommendation) => kw.campaignName?.toLowerCase().includes('desktop'))
                      const campaigns = [...new Set(desktopKeywords.map((kw: KeywordBidRecommendation) => kw.campaignName))]
                      return campaigns.map((campaign, cIdx) => (
                        <div key={cIdx} className="mb-6">
                          <h4 className="text-base font-semibold text-[#1D1D1F] mb-3 flex items-center gap-2 bg-slate-100 py-2 px-3 rounded-lg">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            {campaign}
                          </h4>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {desktopKeywords.filter((kw: KeywordBidRecommendation) => kw.campaignName === campaign).map((kw: KeywordBidRecommendation, idx: number) => {
                              const cardKey = `${kw.campaignName}-${kw.keyword}`
                              const isExpanded = expandedKeyword === cardKey
                              return (
                              <Card
                                key={idx}
                                className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setExpandedKeyword(isExpanded ? null : cardKey)}
                              >
                                <div className={`h-1 ${kw.decision === 'INCREASE' ? 'bg-green-500' : kw.decision === 'DECREASE' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-[#1D1D1F] text-sm leading-tight">{kw.keyword}</h4>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ml-2 ${
                                      kw.decision === 'INCREASE' ? 'bg-green-100 text-green-700' :
                                      kw.decision === 'DECREASE' ? 'bg-amber-100 text-amber-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {kw.decision}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1 text-xs mb-2">
                                    <div className="bg-[#F5F5F7] rounded p-1.5 text-center">
                                      <div className="text-[#6E6E73] text-[10px]">CPC</div>
                                      <div className="font-semibold">${kw.currentMaxCpc}</div>
                                    </div>
                                    <div className="bg-[#F5F5F7] rounded p-1.5 text-center">
                                      <div className="text-[#6E6E73] text-[10px]">Top%</div>
                                      <div className={`font-semibold ${parseFloat(kw.imprTopPct) < 90 ? 'text-red-600' : 'text-green-600'}`}>{kw.imprTopPct}</div>
                                    </div>
                                    <div className="bg-[#F5F5F7] rounded p-1.5 text-center">
                                      <div className="text-[#6E6E73] text-[10px]">Clicks</div>
                                      <div className="font-semibold">{kw.clicks}</div>
                                    </div>
                                    <div className="bg-[#F5F5F7] rounded p-1.5 text-center">
                                      <div className="text-[#6E6E73] text-[10px]">Conv</div>
                                      <div className="font-semibold">{kw.conversions}</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 items-center">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${kw.gptVote === kw.decision ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>G:{kw.gptVote?.charAt(0) || '?'}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${kw.claudeVote === kw.decision ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>C:{kw.claudeVote?.charAt(0) || '?'}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${kw.geminiVote === kw.decision ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>Ge:{kw.geminiVote?.charAt(0) || '?'}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${kw.consensus === 'UNANIMOUS' ? 'bg-purple-100 text-purple-700' : kw.consensus === 'MAJORITY' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{kw.consensus}</span>
                                    <ChevronDown className={`h-4 w-4 ml-auto text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </div>
                                  {isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                      <div className="bg-emerald-50 rounded p-2">
                                        <div className="text-[10px] font-semibold text-emerald-700 mb-1">GPT-4o: {kw.gptVote || 'N/A'}</div>
                                        <p className="text-xs text-emerald-900">{kw.gptReasoning || 'No reasoning provided'}</p>
                                      </div>
                                      <div className="bg-orange-50 rounded p-2">
                                        <div className="text-[10px] font-semibold text-orange-700 mb-1">Claude: {kw.claudeVote || 'N/A'}</div>
                                        <p className="text-xs text-orange-900">{kw.claudeReasoning || 'No reasoning provided'}</p>
                                      </div>
                                      <div className="bg-blue-50 rounded p-2">
                                        <div className="text-[10px] font-semibold text-blue-700 mb-1">Gemini: {kw.geminiVote || 'N/A'}</div>
                                        <p className="text-xs text-blue-900">{kw.geminiReasoning || 'No reasoning provided'}</p>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )})}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                  {/* Mobile Keywords - Grouped by Campaign */}
                  <div>
                    <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      Mobile Keywords
                    </h3>
                    {(() => {
                      const mobileKeywords = keywordsCouncil.synthesized.filter((kw: KeywordBidRecommendation) => kw.campaignName?.toLowerCase().includes('mobile'))
                      const campaigns = [...new Set(mobileKeywords.map((kw: KeywordBidRecommendation) => kw.campaignName))]
                      return campaigns.map((campaign, cIdx) => (
                        <div key={cIdx} className="mb-6">
                          <h4 className="text-base font-semibold text-[#1D1D1F] mb-3 flex items-center gap-2 bg-slate-100 py-2 px-3 rounded-lg">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            {campaign}
                          </h4>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {mobileKeywords.filter((kw: KeywordBidRecommendation) => kw.campaignName === campaign).map((kw: KeywordBidRecommendation, idx: number) => {
                              const cardKey = `${kw.campaignName}-${kw.keyword}`
                              const isExpanded = expandedKeyword === cardKey
                              return (
                              <Card
                                key={idx}
                                className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => setExpandedKeyword(isExpanded ? null : cardKey)}
                              >
                                <div className={`h-1 ${kw.decision === 'INCREASE' ? 'bg-green-500' : kw.decision === 'DECREASE' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-[#1D1D1F] text-sm leading-tight">{kw.keyword}</h4>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ml-2 ${
                                      kw.decision === 'INCREASE' ? 'bg-green-100 text-green-700' :
                                      kw.decision === 'DECREASE' ? 'bg-amber-100 text-amber-700' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>
                                      {kw.decision}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1 text-xs mb-2">
                                    <div className="bg-[#F5F5F7] rounded p-1.5 text-center">
                                      <div className="text-[#6E6E73] text-[10px]">CPC</div>
                                      <div className="font-semibold">${kw.currentMaxCpc}</div>
                                    </div>
                                    <div className="bg-[#F5F5F7] rounded p-1.5 text-center">
                                      <div className="text-[#6E6E73] text-[10px]">Top%</div>
                                      <div className={`font-semibold ${parseFloat(kw.imprTopPct) < 90 ? 'text-red-600' : 'text-green-600'}`}>{kw.imprTopPct}</div>
                                    </div>
                                    <div className="bg-[#F5F5F7] rounded p-1.5 text-center">
                                      <div className="text-[#6E6E73] text-[10px]">Clicks</div>
                                      <div className="font-semibold">{kw.clicks}</div>
                                    </div>
                                    <div className="bg-[#F5F5F7] rounded p-1.5 text-center">
                                      <div className="text-[#6E6E73] text-[10px]">Conv</div>
                                      <div className="font-semibold">{kw.conversions}</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 items-center">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${kw.gptVote === kw.decision ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>G:{kw.gptVote?.charAt(0) || '?'}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${kw.claudeVote === kw.decision ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>C:{kw.claudeVote?.charAt(0) || '?'}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${kw.geminiVote === kw.decision ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>Ge:{kw.geminiVote?.charAt(0) || '?'}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${kw.consensus === 'UNANIMOUS' ? 'bg-purple-100 text-purple-700' : kw.consensus === 'MAJORITY' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{kw.consensus}</span>
                                    <ChevronDown className={`h-4 w-4 ml-auto text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </div>
                                  {isExpanded && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                      <div className="bg-emerald-50 rounded p-2">
                                        <div className="text-[10px] font-semibold text-emerald-700 mb-1">GPT-4o: {kw.gptVote || 'N/A'}</div>
                                        <p className="text-xs text-emerald-900">{kw.gptReasoning || 'No reasoning provided'}</p>
                                      </div>
                                      <div className="bg-orange-50 rounded p-2">
                                        <div className="text-[10px] font-semibold text-orange-700 mb-1">Claude: {kw.claudeVote || 'N/A'}</div>
                                        <p className="text-xs text-orange-900">{kw.claudeReasoning || 'No reasoning provided'}</p>
                                      </div>
                                      <div className="bg-blue-50 rounded p-2">
                                        <div className="text-[10px] font-semibold text-blue-700 mb-1">Gemini: {kw.geminiVote || 'N/A'}</div>
                                        <p className="text-xs text-blue-900">{kw.geminiReasoning || 'No reasoning provided'}</p>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )})}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <DollarSign className="h-16 w-16 text-[#D2D2D7] mb-4" />
                    <h3 className="text-xl font-semibold text-[#1D1D1F] mb-2">No Bid Recommendations</h3>
                    <p className="text-[#6E6E73] text-center max-w-md">
                      Keyword bid recommendations will appear here after the council runs on Monday at 7am.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Coming Soon Sections */}
          {(activeCategory === "competitors" || activeCategory === "assets" || activeCategory === "search-terms") && (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                {activeCategory === "competitors" && <Swords className="h-16 w-16 text-[#D2D2D7] mb-4" />}
                {activeCategory === "assets" && <Image className="h-16 w-16 text-[#D2D2D7] mb-4" />}
                {activeCategory === "search-terms" && <Search className="h-16 w-16 text-[#D2D2D7] mb-4" />}
                <h3 className="text-xl font-semibold text-[#1D1D1F] mb-2">
                  {categoryConfig[activeCategory].label}
                </h3>
                <p className="text-[#6E6E73] text-center max-w-md mb-4">
                  {categoryConfig[activeCategory].description}
                </p>
                <span className="text-sm font-medium text-purple-600 bg-purple-50 px-4 py-2 rounded-full">
                  Coming Soon
                </span>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-[#6E6E73] bg-[#F5F5F7] rounded-xl p-3">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-3 w-3" />
              <span>3-LLM Voting: GPT-4o • Claude Sonnet • Gemini Pro</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// =============================================================================
// CACHE UTILITIES - localStorage with stale-while-revalidate
// =============================================================================
const CACHE_PREFIX = 'dashboard_'
const CACHE_VERSION = 'v4' // Increment this when data structure changes to invalidate old cache
const CACHE_VERSION_KEY = 'dashboard_cache_version'

const CACHE_TTL = {
  sales: 5 * 60 * 1000,         // 5 minutes for realtime data
  traffic: 24 * 60 * 60 * 1000, // 24 hours for traffic (updates daily)
  conversions: 24 * 60 * 60 * 1000, // 24 hours for conversions (updates daily)
  googleAds: 24 * 60 * 60 * 1000, // 24 hours for Google Ads (updates daily)
  bingAds: 24 * 60 * 60 * 1000,   // 24 hours for Bing Ads (updates daily)
  subscriptions: 60 * 60 * 1000,  // 1 hour for subscriptions
  gsc: 24 * 60 * 60 * 1000,      // 24 hours for GSC (updates daily)
}

// Clear all dashboard cache when version changes
function checkAndClearCacheVersion(): void {
  if (typeof window === 'undefined') return
  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY)
    if (storedVersion !== CACHE_VERSION) {
      // Version mismatch - clear all dashboard cache
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
      console.log(`[Cache] Cleared stale cache (${storedVersion} -> ${CACHE_VERSION})`)
    }
  } catch (e) {
    console.warn('Failed to check cache version:', e)
  }
}

// Initialize cache version check
if (typeof window !== 'undefined') {
  checkAndClearCacheVersion()
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: string // Track version in each entry for extra safety
}

function getFromCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key)
    if (!cached) return null
    const entry: CacheEntry<T> = JSON.parse(cached)
    // Reject cache if version doesn't match (extra safety)
    if (entry.version && entry.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function setInCache<T>(key: string, data: T, ttl: number): void {
  if (typeof window === 'undefined') return
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl, version: CACHE_VERSION }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch (e) {
    console.warn('Failed to cache data:', e)
  }
}

function isCacheStale(key: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key)
    if (!cached) return true
    const entry = JSON.parse(cached)
    return Date.now() - entry.timestamp > entry.ttl
  } catch {
    return true
  }
}

// Fetch with stale-while-revalidate pattern
async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  ttl: number,
  setter: (data: T) => void
): Promise<T | null> {
  // Immediately return cached data if available
  const cached = getFromCache<T>(cacheKey)
  if (cached) {
    setter(cached)
  }

  // Revalidate in background if stale (or no cache)
  try {
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setInCache(cacheKey, data, ttl)
      setter(data)
      return data
    }
  } catch (e) {
    console.error(`Failed to fetch ${cacheKey}:`, e)
  }

  return cached
}


const validTabs: TabType[] = ["sales", "subscriptions", "google-ads", "bing-ads", "traffic", "conversions", "gsc", "landing-pages"]

function DashboardPageContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as string | null
  // Handle legacy ?tab=jedi-council → tools hub
  const resolvedTab: TabType | null = tabParam === "jedi-council" ? null : (tabParam && validTabs.includes(tabParam as TabType) ? tabParam as TabType : null)
  const [activeTab, setActiveTab] = useState<TabType | null>(resolvedTab ?? "sales")
  const [activeSection, setActiveSection] = useState<SectionType>(
    resolvedTab ? TAB_TO_SECTION[resolvedTab] : (tabParam === "jedi-council" ? "tools" : "revenue")
  )

  useEffect(() => {
    if (tabParam === "jedi-council") {
      setActiveSection("tools")
      setActiveTab(null)
      window.history.replaceState({}, "", "/?section=tools")
    } else if (tabParam && validTabs.includes(tabParam as TabType)) {
      const tab = tabParam as TabType
      setActiveTab(tab)
      setActiveSection(TAB_TO_SECTION[tab])
    }
  }, [tabParam])

  // Refs for centering sub-tabs under active section
  const sectionRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const sectionRowRef = useRef<HTMLDivElement>(null)
  const subTabsRef = useRef<HTMLDivElement>(null)
  const [subTabOffset, setSubTabOffset] = useState(0)

  const computeSubTabOffset = useCallback(() => {
    const activeBtn = sectionRefs.current[activeSection]
    const row = sectionRowRef.current
    const subTabs = subTabsRef.current
    if (!activeBtn || !row || !subTabs) { setSubTabOffset(0); return }
    const rowRect = row.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()
    const subTabsWidth = subTabs.scrollWidth
    // Center sub-tabs under the active section button
    const sectionCenter = btnRect.left + btnRect.width / 2 - rowRect.left
    const offset = Math.max(0, sectionCenter - subTabsWidth / 2)
    setSubTabOffset(offset)
  }, [activeSection])

  useEffect(() => {
    computeSubTabOffset()
    window.addEventListener('resize', computeSubTabOffset)
    return () => window.removeEventListener('resize', computeSubTabOffset)
  }, [computeSubTabOffset])

  // Section click handler
  const handleSectionClick = (section: SectionType) => {
    setActiveSection(section)
    const defaultTab = SECTION_DEFAULTS[section]
    setActiveTab(defaultTab)
    if (defaultTab) {
      window.history.replaceState({}, "", `/?tab=${defaultTab}`)
    } else {
      window.history.replaceState({}, "", `/?section=${section}`)
    }
  }

  // Sub-tab click handler
  const handleSubTabClick = (tab: TabType) => {
    setActiveTab(tab)
    setActiveSection(TAB_TO_SECTION[tab])
    window.history.replaceState({}, "", `/?tab=${tab}`)
  }

  // Sales state
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [hourlyComparison, setHourlyComparison] = useState<HourlyComparisonResponse | null>(null)
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrendsResponse | null>(null)
  const [extendedWeeklyTrends, setExtendedWeeklyTrends] = useState<ExtendedWeeklyTrendsResponse | null>(null)
  const [productMix, setProductMix] = useState<ProductMixResponse | null>(null)
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendsResponse | null>(null)
  const [weeklyQtyYoY, setWeeklyQtyYoY] = useState<WeeklyQtyYoYResponse | null>(null)
  const [monthlyQtyYoY, setMonthlyQtyYoY] = useState<MonthlyQtyYoYResponse | null>(null)
  const [eodForecast, setEodForecast] = useState<EODForecastResponse | null>(null)
  const [eowForecast, setEowForecast] = useState<EOWForecastResponse | null>(null)
  const [eodProjection, setEodProjection] = useState<EODProjectionResponse | null>(null)
  const [eomForecast, setEomForecast] = useState<EOMForecastResponse | null>(null)
  const [nextWeekPreview, setNextWeekPreview] = useState<NextWeekPreviewResponse | null>(null)
  const [thisWeekForecast, setThisWeekForecast] = useState<ThisWeekForecastResponse | null>(null)

  // Traffic state
  const [traffic, setTraffic] = useState<TrafficResponse | null>(null)
  const [trafficBySourceWeekly, setTrafficBySourceWeekly] = useState<TrafficBySourceWeeklyResponse | null>(null)
  const [trafficTrends, setTrafficTrends] = useState<TrafficTrendsResponse | null>(null)
  const [trafficSource, setTrafficSource] = useState<TrafficSource>('total')

  // Conversions state
  const [conversionTrends, setConversionTrends] = useState<TrafficTrendsResponse | null>(null)
  const [conversionSource, setConversionSource] = useState<ConversionSource>('total')

  // Conversion view toggle (counts vs rate)
  const [convView, setConvView] = useState<'counts' | 'rate'>('counts')
  const [convPctSource, setConvPctSource] = useState<ConversionSource>('total')

  // Google Ads Trends state
  const [gadsTrends, setGadsTrends] = useState<AdsTrendsResponse | null>(null)
  const [gadsMetric, setGadsMetric] = useState<AdsMetric>('conversions')
  const [gadsView, setGadsView] = useState<'summary' | 'cpc' | 'age' | 'assets' | null>('summary')

  // Bing Ads Trends state
  const [bingTrends, setBingTrends] = useState<AdsTrendsResponse | null>(null)
  const [bingMetric, setBingMetric] = useState<AdsMetric>('conversions')
  const [bingView, setBingView] = useState<'summary' | 'cpc' | null>('summary')

  // Auction Insights state
  const [auctionInsights, setAuctionInsights] = useState<AuctionInsightsResponse | null>(null)

  // Google Ads Performance state
  const [accountPerformance, setAccountPerformance] = useState<AccountPerformanceResponse | null>(null)
  const [campaignsData, setCampaignsData] = useState<CampaignsResponse | null>(null)
  const [keywordsData, setKeywordsData] = useState<KeywordsResponse | null>(null)
  const [n8nKeywordsWeekly, setN8nKeywordsWeekly] = useState<N8nKeywordsWeeklyResponse | null>(null)

  // Bing Ads Performance state
  const [bingCampaignsData, setBingCampaignsData] = useState<CampaignsResponse | null>(null)
  const [bingKeywordsData, setBingKeywordsData] = useState<KeywordsResponse | null>(null)
  const [bingCampaignsWeekly, setBingCampaignsWeekly] = useState<CampaignsWeeklyResponse | null>(null)

  // Google Ads Weekly state
  const [googleCampaignsWeekly, setGoogleCampaignsWeekly] = useState<CampaignsWeeklyResponse | null>(null)

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<SubscriptionsResponse | null>(null)
  const [subscriberMetrics, setSubscriberMetrics] = useState<SubscriberMetricsResponse | null>(null)

  // Landing Pages state
  const [landingPagesData, setLandingPagesData] = useState<{ landing_pages: Array<{ landing_page: string; weeks: Array<{ label: string; date_range: string; users: number; purchases: number; conversion_rate: number }> }>; last_updated: string } | null>(null)
  const [gadsLandingPagesData, setGadsLandingPagesData] = useState<{ landing_pages: Array<{ landing_page: string; weeks: Array<{ label: string; date_range: string; clicks: number; conversions: number; conversion_rate: number }> }>; last_updated: string } | null>(null)

  // GSC (Search Console) state
  const [gscWeeklyData, setGscWeeklyData] = useState<any>(null)
  const [gscKeywordsData, setGscKeywordsData] = useState<any>(null)

  // AWR SEO state
  const [awrRankings, setAwrRankings] = useState<any>(null)
  const [awrVisibility, setAwrVisibility] = useState<any>(null)
  const [awrCompetitors, setAwrCompetitors] = useState<any>(null)
  const [awrLoading, setAwrLoading] = useState(true)
  const [awrSortField, setAwrSortField] = useState<string>('estimated_visits')
  const [awrSortDir, setAwrSortDir] = useState<'asc' | 'desc'>('desc')

  // Loading states per tab
  const [salesLoading, setSalesLoading] = useState(true)
  const [trafficLoading, setTrafficLoading] = useState(true)
  const [conversionsLoading, setConversionsLoading] = useState(true)
  const [googleAdsLoading, setGoogleAdsLoading] = useState(true)
  const [bingAdsLoading, setBingAdsLoading] = useState(true)
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true)
  const [landingPagesLoading, setLandingPagesLoading] = useState(true)
  const [gscLoading, setGscLoading] = useState(true)

  // Track which tabs have been loaded
  const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set())

  const [error, setError] = useState<string | null>(null)

  // Derived loading state for backward compatibility
  const loading = salesLoading

  // Fetch Sales tab data (priority - load immediately)
  const fetchSalesData = async () => {
    setSalesLoading(true)
    try {
      // Load from cache immediately, then revalidate
      await Promise.all([
        fetchWithCache(`${PROPHET_API_URL}/metrics`, 'metrics', CACHE_TTL.sales, setMetrics),
        fetchWithCache(`${PROPHET_API_URL}/hourly-comparison`, 'hourly', CACHE_TTL.sales, setHourlyComparison),
        fetchWithCache(`${PROPHET_API_URL}/weekly-trends`, 'weekly', CACHE_TTL.sales, setWeeklyTrends),
        fetchWithCache(`${PROPHET_API_URL}/weekly-trends-extended`, 'weeklyExtended', CACHE_TTL.sales, setExtendedWeeklyTrends),
        fetchWithCache(`${PROPHET_API_URL}/product-mix`, 'productMix', CACHE_TTL.sales, setProductMix),
        fetchWithCache('/api/monthly-trends', 'monthlyTrends', CACHE_TTL.sales, setMonthlyTrends),
        fetchWithCache(`${PROPHET_API_URL}/weekly-qty-yoy`, 'weeklyQtyYoY', CACHE_TTL.sales, setWeeklyQtyYoY),
        fetchWithCache(`${PROPHET_API_URL}/monthly-qty-yoy`, 'monthlyQtyYoY', CACHE_TTL.sales, setMonthlyQtyYoY),
        fetchWithCache(`${PROPHET_API_URL}/eod-forecast`, 'eod', CACHE_TTL.sales, setEodForecast),
        fetchWithCache(`${PROPHET_API_URL}/eow-forecast`, 'eow', CACHE_TTL.sales, setEowForecast),
        fetchWithCache(`${PROPHET_API_URL}/eod-projection`, 'eodProjection', CACHE_TTL.sales, setEodProjection),
        fetchWithCache(`${PROPHET_API_URL}/eom-forecast`, 'eom', CACHE_TTL.sales, setEomForecast),
        fetchWithCache(`${PROPHET_API_URL}/next-week-preview`, 'nextWeek', CACHE_TTL.sales, setNextWeekPreview),
        fetchWithCache(`${PROPHET_API_URL}/this-week-forecast`, 'thisWeek', CACHE_TTL.sales, setThisWeekForecast),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales data")
    } finally {
      setSalesLoading(false)
      setLoadedTabs(prev => new Set([...prev, 'sales']))
    }
  }

  // Fetch Traffic tab data (lazy load)
  const fetchTrafficData = async () => {
    const trafficStale = isCacheStale('traffic')
    const trafficWeeklyStale = isCacheStale('trafficBySourceWeekly')
    const trafficTrendsStale = isCacheStale('trafficTrends')
    // Fetch if any cache is stale or missing
    if (loadedTabs.has('traffic') && !trafficStale && !trafficWeeklyStale && !trafficTrendsStale && trafficBySourceWeekly && trafficTrends) return
    setTrafficLoading(true)
    try {
      await Promise.all([
        fetchWithCache(`${PROPHET_API_URL}/traffic`, 'traffic', CACHE_TTL.traffic, setTraffic),
        fetchWithCache(`${PROPHET_API_URL}/traffic/by-source-weekly`, 'trafficBySourceWeekly', CACHE_TTL.traffic, setTrafficBySourceWeekly),
        fetchWithCache('/api/traffic-trends', 'trafficTrends', CACHE_TTL.traffic, setTrafficTrends),
      ])
    } catch (err) {
      console.error("Failed to load traffic data:", err)
    } finally {
      setTrafficLoading(false)
      setLoadedTabs(prev => new Set([...prev, 'traffic']))
    }
  }

  // Fetch Conversions tab data (lazy load)
  const fetchConversionData = async () => {
    const convTrendsStale = isCacheStale('conversionTrends')
    if (loadedTabs.has('conversions') && !convTrendsStale && conversionTrends) return
    setConversionsLoading(true)
    try {
      await fetchWithCache('/api/conversion-trends', 'conversionTrends', CACHE_TTL.conversions, setConversionTrends)
    } catch (err) {
      console.error("Failed to load conversion data:", err)
    } finally {
      setConversionsLoading(false)
      setLoadedTabs(prev => new Set([...prev, 'conversions']))
    }
  }

  // Fetch Google Ads tab data (lazy load)
  const fetchGoogleAdsData = async () => {
    if (loadedTabs.has('google-ads') && !isCacheStale('googleAds') && gadsTrends) return
    setGoogleAdsLoading(true)
    try {
      await fetchWithCache('/api/gads-trends', 'gadsTrends', CACHE_TTL.googleAds, setGadsTrends)
    } catch (err) {
      console.error("Failed to load Google Ads data:", err)
    } finally {
      setGoogleAdsLoading(false)
      setLoadedTabs(prev => new Set([...prev, 'google-ads']))
    }
  }

  // Fetch Bing Ads tab data (lazy load)
  const fetchBingAdsData = async () => {
    if (loadedTabs.has('bing-ads') && !isCacheStale('bingAds') && bingTrends) return
    setBingAdsLoading(true)
    try {
      await fetchWithCache('/api/bing-trends', 'bingTrends', CACHE_TTL.bingAds, setBingTrends)
    } catch (err) {
      console.error("Failed to load Bing Ads data:", err)
    } finally {
      setBingAdsLoading(false)
      setLoadedTabs(prev => new Set([...prev, 'bing-ads']))
    }
  }

  const fetchSubscriptionsData = async () => {
    if (loadedTabs.has('subscriptions') && !isCacheStale('subscriptions')) return
    setSubscriptionsLoading(true)
    try {
      await Promise.all([
        fetchWithCache(`${PROPHET_API_URL}/subscriptions`, 'subscriptions', CACHE_TTL.subscriptions, setSubscriptions),
        fetchWithCache(`${PROPHET_API_URL}/subscriber/metrics`, 'subscriberMetrics', CACHE_TTL.subscriptions, setSubscriberMetrics)
      ])
    } catch (err) {
      console.error("Failed to load Subscriptions data:", err)
    } finally {
      setSubscriptionsLoading(false)
      setLoadedTabs(prev => new Set([...prev, 'subscriptions']))
    }
  }

  const fetchLandingPagesData = async () => {
    if (loadedTabs.has('landing-pages')) return
    setLandingPagesLoading(true)
    try {
      const [lpRes, gadsLpRes] = await Promise.all([
        fetch('/api/landing-pages-weekly'),
        fetch('/api/gads-landing-pages-weekly')
      ])
      if (lpRes.ok) setLandingPagesData(await lpRes.json())
      if (gadsLpRes.ok) setGadsLandingPagesData(await gadsLpRes.json())
    } catch (err) {
      console.error("Failed to load Landing Pages data:", err)
    } finally {
      setLandingPagesLoading(false)
      setLoadedTabs(prev => new Set([...prev, 'landing-pages']))
    }
  }

  // Fetch GSC (Search Console) tab data (lazy load)
  const fetchGscData = async () => {
    if (loadedTabs.has('gsc') && !isCacheStale('gscWeekly') && gscWeeklyData) return
    setGscLoading(true)
    try {
      await Promise.all([
        fetchWithCache('/api/gsc-weekly', 'gscWeekly', CACHE_TTL.gsc, setGscWeeklyData),
        fetchWithCache('/api/gsc-keywords-weekly', 'gscKeywords', CACHE_TTL.gsc, setGscKeywordsData),
      ])
    } catch (err) {
      console.error("Failed to load GSC data:", err)
    } finally {
      setGscLoading(false)
      setLoadedTabs(prev => new Set([...prev, 'gsc']))
    }
  }

  // Fetch AWR SEO data
  const fetchAwrData = async () => {
    if (loadedTabs.has('seo-rankings') && awrRankings) return
    setAwrLoading(true)
    try {
      const [rankings, visibility, competitors] = await Promise.all([
        fetch('/api/awr/rankings').then(r => r.json()),
        fetch('/api/awr/visibility').then(r => r.json()),
        fetch('/api/awr/competitors').then(r => r.json()),
      ])
      setAwrRankings(rankings)
      setAwrVisibility(visibility)
      setAwrCompetitors(competitors)
    } catch (err) {
      console.error("Failed to load AWR data:", err)
    } finally {
      setAwrLoading(false)
      setLoadedTabs(prev => new Set([...prev, 'seo-rankings', 'seo-ai-search', 'seo-competitors']))
    }
  }

  // Initial load: Sales tab first (priority)
  useEffect(() => {
    // Clear old traffic cache to force fetch of new weekly data
    if (typeof window !== 'undefined') {
      const hasWeeklyCache = localStorage.getItem('dashboard_trafficBySourceWeekly')
      if (!hasWeeklyCache) {
        // Clear traffic tab caches to force re-fetch with new endpoint
        localStorage.removeItem('dashboard_traffic')
      }
    }

    // Load cached data immediately for instant display
    const cachedMetrics = getFromCache<MetricsResponse>('metrics')
    const cachedHourly = getFromCache<HourlyComparisonResponse>('hourly')
    const cachedWeekly = getFromCache<WeeklyTrendsResponse>('weekly')
    const cachedExtendedWeekly = getFromCache<ExtendedWeeklyTrendsResponse>('weeklyExtended')
    const cachedProductMix = getFromCache<ProductMixResponse>('productMix')
    const cachedMonthlyTrends = getFromCache<MonthlyTrendsResponse>('monthlyTrends')
    const cachedWeeklyQtyYoY = getFromCache<WeeklyQtyYoYResponse>('weeklyQtyYoY')
    const cachedMonthlyQtyYoY = getFromCache<MonthlyQtyYoYResponse>('monthlyQtyYoY')
    const cachedEod = getFromCache<EODForecastResponse>('eod')
    const cachedEow = getFromCache<EOWForecastResponse>('eow')
    const cachedTrafficWeekly = getFromCache<TrafficBySourceWeeklyResponse>('trafficBySourceWeekly')
    const cachedTrafficTrends = getFromCache<TrafficTrendsResponse>('trafficTrends')

    if (cachedMetrics) setMetrics(cachedMetrics)
    if (cachedHourly) setHourlyComparison(cachedHourly)
    if (cachedWeekly) setWeeklyTrends(cachedWeekly)
    if (cachedExtendedWeekly) setExtendedWeeklyTrends(cachedExtendedWeekly)
    if (cachedProductMix) setProductMix(cachedProductMix)
    if (cachedMonthlyTrends) setMonthlyTrends(cachedMonthlyTrends)
    if (cachedWeeklyQtyYoY) setWeeklyQtyYoY(cachedWeeklyQtyYoY)
    if (cachedMonthlyQtyYoY) setMonthlyQtyYoY(cachedMonthlyQtyYoY)
    if (cachedEod) setEodForecast(cachedEod)
    if (cachedEow) setEowForecast(cachedEow)
    if (cachedTrafficWeekly) setTrafficBySourceWeekly(cachedTrafficWeekly)
    if (cachedTrafficTrends) setTrafficTrends(cachedTrafficTrends)

    // If we have cached data, show it immediately and mark as not loading
    if (cachedMetrics && cachedHourly && cachedWeekly && cachedProductMix && cachedEow) {
      setSalesLoading(false)
    }

    // Then fetch fresh data (revalidate)
    fetchSalesData()

    // Pre-fetch other tabs in background after a delay
    const prefetchTimer = setTimeout(() => {
      fetchTrafficData()
      fetchGoogleAdsData()
    }, 1000) // 1 second delay to not block initial render

    return () => clearTimeout(prefetchTimer)
  }, [])

  // Lazy load tab data when tab changes
  useEffect(() => {
    if (activeTab === 'traffic') fetchTrafficData()
    else if (activeTab === 'conversions') { fetchTrafficData(); fetchConversionData() }
    else if (activeTab === 'google-ads') fetchGoogleAdsData()
    else if (activeTab === 'bing-ads') fetchBingAdsData()
    else if (activeTab === 'subscriptions') fetchSubscriptionsData()
    else if (activeTab === 'landing-pages') fetchLandingPagesData()
    else if (activeTab === 'gsc') fetchGscData()
    else if (activeTab === 'seo-rankings' || activeTab === 'seo-ai-search' || activeTab === 'seo-competitors') fetchAwrData()
  }, [activeTab])

  // Auto-refresh sales data every 5 minutes when on sales tab
  useEffect(() => {
    if (activeTab !== 'sales') return

    const refreshInterval = setInterval(() => {
      console.log('[Auto-refresh] Refreshing sales data...')
      fetchSalesData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(refreshInterval)
  }, [activeTab])

  const sections: Array<{
    id: SectionType
    label: string
    icon: any
    description: string
  }> = [
    { id: "revenue", label: "Revenue", icon: DollarSign, description: "Daily sales, subscription health, and product revenue" },
    { id: "advertising", label: "Advertising", icon: Target, description: "Google Ads and Bing Ads campaign performance" },
    { id: "organic", label: "Organic & SEO", icon: TrendingUp, description: "Traffic sources, conversions, search rankings, and landing pages" },
    { id: "tools", label: "Insights & Tools", icon: Sparkles, description: "SEO rank tracking, AI search, and competitor intelligence" },
    { id: "reports", label: "Other Reports", icon: FileText, description: "Forecasting, AI analysis, and operational tools" },
  ]

  const sectionTabs: Record<SectionType, Array<{ id: TabType; label: string; icon: any }>> = {
    revenue: [
      { id: "sales", label: "Sales", icon: DollarSign },
      { id: "subscriptions", label: "Subscriptions", icon: RefreshCw },
    ],
    advertising: [
      { id: "google-ads", label: "Google Ads", icon: TrendingUp },
      { id: "bing-ads", label: "Bing Ads", icon: Target },
    ],
    organic: [
      { id: "traffic", label: "Traffic", icon: Users },
      { id: "conversions", label: "Conversions", icon: CheckCircle2 },
      { id: "gsc", label: "Search Console", icon: Search },
      { id: "landing-pages", label: "Landing Pages", icon: MapPin },
    ],
    tools: [
      { id: "seo-rankings", label: "Rank Tracker", icon: TrendingUp },
      { id: "seo-ai-search", label: "AI Search", icon: Brain },
      { id: "seo-competitors", label: "Competitor Intel", icon: Swords },
    ],
    reports: [],
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <header className="border-b border-[#D2D2D7] bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
              Command Center
            </h1>
            {metrics && (
              <span className="text-sm text-[#6E6E73]">
                {metrics.today.date_range}
              </span>
            )}
          </div>
          {/* Section Navigation (Row 1) */}
          <div className="flex items-center -mb-px" ref={sectionRowRef}>
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  ref={(el) => { sectionRefs.current[section.id] = el }}
                  onClick={() => handleSectionClick(section.id)}
                  title={section.description}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold uppercase tracking-wide border-b-3 transition-colors ${
                    activeSection === section.id
                      ? "border-[#0066CC] text-[#0066CC]"
                      : "border-transparent text-[#6E6E73] hover:text-[#1D1D1F]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              )
            })}
          </div>
          {/* Sub-Tab Navigation (Row 2) — centered under active section */}
          {sectionTabs[activeSection].length > 0 && (
            <div className="relative border-t border-[#E5E5E5] -mb-px">
              <div ref={subTabsRef} className="flex items-center" style={{ paddingLeft: subTabOffset }}>
                {sectionTabs[activeSection].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSubTabClick(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-[#0066CC] text-[#0066CC]"
                          : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                  </button>
                )
              })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${activeTab === 'sales' ? 'max-w-[1440px]' : 'max-w-[1920px]'}`}>
        {/* Sales Tab */}
        {activeTab === "sales" && (
          <>
            {/* TOP ROW - Simple KPI Cards */}
            {loading && !metrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <CardSkeleton key={i} className="h-[100px]" />
                ))}
              </div>
            ) : metrics ? (
              <>
              {/* Top Row - 4 Simple KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Today with time comparison */}
                {(() => {
                  const now = new Date()
                  const hour = now.getHours()
                  const minutes = now.getMinutes()
                  const timeStr = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:${minutes.toString().padStart(2, '0')}${hour >= 12 ? 'pm' : 'am'}`
                  const hourLabel = hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`
                  const todayData = hourlyComparison?.periods.find(p => p.period_label === "Today")
                  const lastWeekData = hourlyComparison?.periods.find(p => p.period_label === "1 Week Ago" || p.period_label === "-1W")
                  const twoWeeksData = hourlyComparison?.periods.find(p => p.period_label === "2 Weeks Ago" || p.period_label === "-2W")
                  const threeWeeksData = hourlyComparison?.periods.find(p => p.period_label === "3 Weeks Ago" || p.period_label === "-3W")
                  const todaySales = todayData?.hourly_sales[hourLabel] ?? metrics.today.direct_qty
                  const lastWeekSales = lastWeekData?.hourly_sales[hourLabel] ?? 0
                  const twoWeeksSales = twoWeeksData?.hourly_sales[hourLabel] ?? 0
                  const threeWeeksSales = threeWeeksData?.hourly_sales[hourLabel] ?? 0
                  return (
                    <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-5 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                      <div className="text-sm font-medium text-white/70 mb-1">Today @ {timeStr}</div>
                      <div className="text-7xl font-bold text-white mb-2">{formatNumber(metrics.today.direct_qty)}</div>
                      <div className="w-full space-y-0.5 text-sm px-2">
                        <div className="flex justify-center gap-4"><span className="text-white/60">1WA</span><span className="font-semibold text-white/80">{lastWeekSales}</span></div>
                        <div className="flex justify-center gap-4"><span className="text-white/60">2WA</span><span className="font-semibold text-white/80">{twoWeeksSales}</span></div>
                        <div className="flex justify-center gap-4"><span className="text-white/60">3WA</span><span className="font-semibold text-white/80">{threeWeeksSales}</span></div>
                      </div>
                    </div>
                  )
                })()}
                {/* Yesterday */}
                <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                  <div className="text-lg font-medium text-white/70 mb-1">Yesterday</div>
                  <div className="text-7xl font-bold text-white">{formatNumber(metrics.yesterday.direct_qty)}</div>
                  <div className="mt-2 text-center">
                    <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(metrics.yesterday.py_qty)}</div>
                    <div className={`text-lg font-semibold ${metrics.yesterday.qty_change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                      {metrics.yesterday.qty_change_pct >= 0 ? "+" : ""}{metrics.yesterday.qty_change_pct}% ({metrics.yesterday.direct_qty - metrics.yesterday.py_qty >= 0 ? "+" : ""}{metrics.yesterday.direct_qty - metrics.yesterday.py_qty})
                    </div>
                  </div>
                </div>
                {/* This Week */}
                <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                  <div className="text-lg font-medium text-white/70 mb-1">This Week</div>
                  <div className="text-7xl font-bold text-white">{formatNumber(metrics.this_week.direct_qty)}</div>
                  <div className="mt-2 text-center">
                    <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(metrics.this_week.py_qty)}</div>
                    <div className={`text-lg font-semibold ${metrics.this_week.qty_change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                      {metrics.this_week.qty_change_pct >= 0 ? "+" : ""}{metrics.this_week.qty_change_pct}% ({metrics.this_week.direct_qty - metrics.this_week.py_qty >= 0 ? "+" : ""}{metrics.this_week.direct_qty - metrics.this_week.py_qty})
                    </div>
                  </div>
                </div>
                {/* MTD */}
                <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                  <div className="text-lg font-medium text-white/70 mb-1">MTD</div>
                  <div className="text-7xl font-bold text-white">{formatNumber(metrics.this_month.direct_qty)}</div>
                  <div className="mt-2 text-center">
                    <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(metrics.this_month.py_qty)}</div>
                    <div className={`text-lg font-semibold ${metrics.this_month.qty_change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                      {metrics.this_month.qty_change_pct >= 0 ? "+" : ""}{metrics.this_month.qty_change_pct}% ({metrics.this_month.direct_qty - metrics.this_month.py_qty >= 0 ? "+" : ""}{metrics.this_month.direct_qty - metrics.this_month.py_qty})
                    </div>
                  </div>
                </div>
              </div>

            {/* Weekly Trends Heatmap - Direct QTY (cumulative, column-based) */}
            {extendedWeeklyTrends && (
              <div className="mb-6">
                <Card className="bg-white border-[#D2D2D7] shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#0066CC]" />
                      Weekly Trends (Direct QTY)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-xl">
                      <table className="w-full text-lg bg-[#1D1D1F]">
                        <thead>
                          <tr className="border-b border-[#3D3D3F]">
                            <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Week</th>
                            {extendedWeeklyTrends.days.map((day) => (
                              <th key={day} className="text-center py-3 px-1 font-semibold text-white whitespace-nowrap">{day}</th>
                            ))}
                            <th className="text-center py-3 px-3 font-bold text-white bg-[#0066CC] whitespace-nowrap">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const days = extendedWeeklyTrends.days
                            return extendedWeeklyTrends.direct_qty.map((week, idx) => {
                              const isCurrentWeek = week.week_label === "Current Week"
                              const cellBg = isCurrentWeek ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                              const rowValues = days.map(day => week.daily_cumulative[day]).filter((v): v is number => typeof v === 'number')
                              const rowMax = Math.max(...rowValues, 1)

                              return (
                                <tr key={idx} className="border-b border-white/5">
                                  <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                    <div className="font-semibold text-white">{week.week_label}</div>
                                    <div className="text-xs text-white/40">{week.week_start}</div>
                                  </td>
                                  {days.map(day => {
                                    const value = week.daily_cumulative[day]
                                    const pct = value ? value / rowMax : 0
                                    const bg = value === null || value === undefined
                                      ? '#1D1D1F'
                                      : `hsl(220, ${20 + pct * 70}%, ${18 + pct * 17}%)`
                                    return (
                                      <td
                                        key={day}
                                        style={{ backgroundColor: bg }}
                                        className={`text-center py-3 px-1 ${value === null ? "text-white/20" : "text-white font-semibold"}`}
                                      >
                                        {value ?? '-'}
                                      </td>
                                    )
                                  })}
                                  <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${week.week_total === null ? "text-white/20" : "text-white"}`}>
                                    {week.week_total ?? '-'}
                                  </td>
                                </tr>
                              )
                            })
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

              {/* Hourly Comparison Section */}
              <div className="mb-6">
                  {/* Hourly Comparison Table */}
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[#0066CC]" />
                        Hourly Sales Comparison
                      </CardTitle>
                      <CardDescription className="text-sm text-[#6E6E73]">Comparing today to the same weekday across prior periods</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
                        </div>
                      ) : error ? (
                        <div className="h-64 flex items-center justify-center text-[#FF3B30]">
                          {error}
                        </div>
                      ) : hourlyComparison ? (
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">
                                  Period
                                </th>
                                {hourlyComparison.hours.map((hour) => (
                                  <th key={hour} className="text-center py-3 px-1 font-semibold text-white whitespace-nowrap">
                                    {hour.replace('am', 'a').replace('pm', 'p')}
                                  </th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white bg-[#0066CC] whitespace-nowrap">
                                  EOD
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {hourlyComparison.periods.map((period) => {
                                const isToday = period.period_label === "Today"
                                const isShaded = period.period_label === "1 Year Ago" || period.period_label === "-1Y" || period.period_label.includes("Avg")
                                const cellBg = isToday ? "bg-[#1A3A52]" : isShaded ? "bg-[#2D2D2F]" : "bg-[#1D1D1F]"
                                // Row-based heatmap: max within this row
                                const rowValues = hourlyComparison.hours.map(h => period.hourly_sales[h]).filter((v): v is number => v !== null)
                                const rowMax = Math.max(...rowValues, 1)

                                return (
                                  <tr key={period.period_label} className="border-b border-white/5">
                                    <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                      <div className="font-semibold text-white">{abbreviatePeriodLabel(period.period_label)}</div>
                                      {period.period_date && (
                                        <div className="text-xs text-white/40">{period.period_date}</div>
                                      )}
                                    </td>
                                    {hourlyComparison.hours.map((hour) => {
                                      const value = period.hourly_sales[hour]
                                      const pct = value ? value / rowMax : 0
                                      const bg = value === null
                                        ? '#1D1D1F'
                                        : `hsl(220, ${20 + pct * 70}%, ${18 + pct * 17}%)`
                                      return (
                                        <td
                                          key={hour}
                                          style={{ backgroundColor: bg }}
                                          className={`text-center py-3 px-1 ${value === null ? "text-white/20" : "text-white font-semibold"}`}
                                        >
                                          {value === null ? "-" : value}
                                        </td>
                                      )
                                    })}
                                    <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${period.end_of_day === null ? "text-white/20" : "text-white"}`}>
                                      {period.end_of_day === null ? "-" : period.end_of_day}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

              {/* New: Actual Sales Per Hour (non-cumulative) */}
              {hourlyComparison && (
                <Card className="bg-white border-[#D2D2D7] shadow-sm mt-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Actual Sales Per Hour
                    </CardTitle>
                    <CardDescription className="text-sm text-[#6E6E73]">Individual hourly sales (non-cumulative)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-xl">
                      <table className="w-full text-lg bg-[#1D1D1F]">
                        <thead>
                          <tr className="border-b border-[#3D3D3F]">
                            <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">
                              Period
                            </th>
                            {hourlyComparison.hours.map((hour) => (
                              <th key={hour} className="text-center py-3 px-1 font-semibold text-white whitespace-nowrap">
                                {hour.replace('am', 'a').replace('pm', 'p')}
                              </th>
                            ))}
                            <th className="text-center py-3 px-3 font-bold text-white bg-emerald-700 whitespace-nowrap">
                              EOD
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const hours = hourlyComparison.hours
                            const getIndividualValue = (period: typeof hourlyComparison.periods[0], hourIdx: number) => {
                              const currentVal = period.hourly_sales[hours[hourIdx]]
                              if (currentVal === null) return null
                              if (hourIdx === 0) return currentVal
                              const prevVal = period.hourly_sales[hours[hourIdx - 1]]
                              if (prevVal === null) return currentVal
                              return currentVal - prevVal
                            }

                            return hourlyComparison.periods.map((period) => {
                              const isToday = period.period_label === "Today"
                              const isShaded = period.period_label === "1 Year Ago" || period.period_label === "-1Y" || period.period_label.includes("Avg")
                              const cellBg = isToday ? "bg-[#1A3A52]" : isShaded ? "bg-[#2D2D2F]" : "bg-[#1D1D1F]"
                              // Row-based max
                              const rowValues = hours.map((_, hIdx) => getIndividualValue(period, hIdx)).filter((v): v is number => v !== null)
                              const rowMax = Math.max(...rowValues, 1)

                              return (
                                <tr key={period.period_label} className="border-b border-white/5">
                                  <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                    <div className="font-semibold text-white">{abbreviatePeriodLabel(period.period_label)}</div>
                                    {period.period_date && (
                                      <div className="text-xs text-white/40">{period.period_date}</div>
                                    )}
                                  </td>
                                  {hours.map((hour, hIdx) => {
                                    const value = getIndividualValue(period, hIdx)
                                    const pct = value ? value / rowMax : 0
                                    const bg = value === null
                                      ? '#1D1D1F'
                                      : `hsl(155, ${40 + pct * 40}%, ${45 - pct * 25}%)`
                                    return (
                                      <td
                                        key={hour}
                                        style={{ backgroundColor: bg }}
                                        className={`text-center py-3 px-1 ${value === null ? "text-white/20" : "text-white font-semibold"}`}
                                      >
                                        {value === null ? "-" : value}
                                      </td>
                                    )
                                  })}
                                  <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${period.end_of_day === null ? "text-white/20" : "text-white"}`}>
                                    {period.end_of_day === null ? "-" : period.end_of_day}
                                  </td>
                                </tr>
                              )
                            })
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              </div>
              </>
            ) : null}

            {/* New: Daily Sales by Day (non-cumulative) */}
            {extendedWeeklyTrends && (
              <div className="mt-8">
                <Card className="bg-white border-[#D2D2D7] shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                      Daily Sales (Direct QTY)
                    </CardTitle>
                    <CardDescription className="text-sm text-[#6E6E73]">Individual daily sales (non-cumulative)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-xl">
                      <table className="w-full text-lg bg-[#1D1D1F]">
                        <thead>
                          <tr className="border-b border-[#3D3D3F]">
                            <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Week</th>
                            {extendedWeeklyTrends.days.map((day) => (
                              <th key={day} className="text-center py-3 px-1 font-semibold text-white whitespace-nowrap">{day}</th>
                            ))}
                            <th className="text-center py-3 px-3 font-bold text-white bg-emerald-700 whitespace-nowrap">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const days = extendedWeeklyTrends.days
                            const getIndividualValue = (week: typeof extendedWeeklyTrends.direct_qty[0], dayIdx: number) => {
                              const currentVal = week.daily_cumulative[days[dayIdx]]
                              if (currentVal === null || currentVal === undefined) return null
                              if (dayIdx === 0) return currentVal
                              const prevVal = week.daily_cumulative[days[dayIdx - 1]]
                              if (prevVal === null || prevVal === undefined) return currentVal
                              return currentVal - prevVal
                            }

                            return extendedWeeklyTrends.direct_qty.map((week, idx) => {
                              const isCurrentWeek = week.week_label === "Current Week"
                              const cellBg = isCurrentWeek ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                              // Row-based max
                              const rowValues = days.map((_, dIdx) => getIndividualValue(week, dIdx)).filter((v): v is number => v !== null)
                              const rowMax = Math.max(...rowValues, 1)

                              return (
                                <tr key={idx} className="border-b border-white/5">
                                  <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                    <div className="font-semibold text-white">{week.week_label}</div>
                                    <div className="text-xs text-white/40">{week.week_start}</div>
                                  </td>
                                  {days.map((day, dIdx) => {
                                    const value = getIndividualValue(week, dIdx)
                                    const pct = value ? value / rowMax : 0
                                    const bg = value === null
                                      ? '#1D1D1F'
                                      : `hsl(155, ${40 + pct * 40}%, ${45 - pct * 25}%)`
                                    return (
                                      <td
                                        key={day}
                                        style={{ backgroundColor: bg }}
                                        className={`text-center py-3 px-1 ${value === null ? "text-white/20" : "text-white font-semibold"}`}
                                      >
                                        {value ?? '-'}
                                      </td>
                                    )
                                  })}
                                  <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${week.week_total === null ? "text-white/20" : "text-white"}`}>
                                    {week.week_total ?? '-'}
                                  </td>
                                </tr>
                              )
                            })
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Weekly Trends Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-[#0066CC]" />
                Weekly Trends
              </h2>

              {/* Row 1: Direct QTY and Direct Revenue */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Direct QTY */}
                <Card className="bg-white border-[#D2D2D7] shadow-sm gap-1 py-3">
                  <CardHeader className="px-4 gap-0">
                    <CardTitle className="text-xl font-bold text-[#1D1D1F]">
                      Direct QTY
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4">
                    {loading ? (
                      <div className="h-32 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                      </div>
                    ) : extendedWeeklyTrends ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#D2D2D7]">
                              <th className="text-left py-2 px-1 font-semibold text-[#1D1D1F] min-w-[80px]">Week</th>
                              {extendedWeeklyTrends.days.map((day) => (
                                <th key={day} className="text-center py-2 px-1 font-medium text-[#6E6E73]">{day}</th>
                              ))}
                              <th className="text-center py-2 px-1 font-semibold text-[#1D1D1F] bg-[#F5F5F7]">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extendedWeeklyTrends.direct_qty.map((week) => {
                              const isCurrentWeek = week.week_label === "Current Week"
                              return (
                                <tr key={week.week_label} className={`border-b border-[#E5E5E5] ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className={`py-2 px-1 ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                    <div className="font-medium text-[#1D1D1F] text-sm">{week.week_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{week.week_start}</div>
                                  </td>
                                  {extendedWeeklyTrends.days.map((day) => {
                                    const value = week.daily_cumulative[day]
                                    return (
                                      <td key={day} className={`text-center py-2 px-1 ${value === null ? "text-[#D2D2D7]" : "text-[#1D1D1F]"}`}>
                                        {value === null ? "-" : value}
                                      </td>
                                    )
                                  })}
                                  <td className={`text-center py-2 px-1 font-semibold bg-[#F5F5F7] ${week.week_total === null ? "text-[#D2D2D7]" : "text-[#0066CC]"}`}>
                                    {week.week_total === null ? "-" : week.week_total}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Direct Revenue */}
                <Card className="bg-white border-[#D2D2D7] shadow-sm gap-1 py-3">
                  <CardHeader className="px-4 gap-0">
                    <CardTitle className="text-xl font-bold text-[#1D1D1F]">
                      Direct Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4">
                    {loading ? (
                      <div className="h-32 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                      </div>
                    ) : extendedWeeklyTrends ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#D2D2D7]">
                              <th className="text-left py-2 px-1 font-semibold text-[#1D1D1F] min-w-[80px]">Week</th>
                              {extendedWeeklyTrends.days.map((day) => (
                                <th key={day} className="text-center py-2 px-1 font-medium text-[#6E6E73]">{day}</th>
                              ))}
                              <th className="text-center py-2 px-1 font-semibold text-[#1D1D1F] bg-[#F5F5F7]">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extendedWeeklyTrends.direct_revenue.map((week) => {
                              const isCurrentWeek = week.week_label === "Current Week"
                              return (
                                <tr key={week.week_label} className={`border-b border-[#E5E5E5] ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className={`py-2 px-1 ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                    <div className="font-medium text-[#1D1D1F] text-sm">{week.week_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{week.week_start}</div>
                                  </td>
                                  {extendedWeeklyTrends.days.map((day) => {
                                    const value = week.daily_cumulative[day]
                                    return (
                                      <td key={day} className={`text-center py-2 px-1 ${value === null ? "text-[#D2D2D7]" : "text-[#1D1D1F]"}`}>
                                        {value === null ? "-" : value ? `$${Math.round(value / 1000)}k` : "$0"}
                                      </td>
                                    )
                                  })}
                                  <td className={`text-center py-2 px-1 font-semibold bg-[#F5F5F7] ${week.week_total === null ? "text-[#D2D2D7]" : "text-[#0066CC]"}`}>
                                    {week.week_total === null ? "-" : `$${Math.round(week.week_total / 1000)}k`}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Renewal QTY and Renewal Revenue */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Renewal QTY */}
                <Card className="bg-white border-[#D2D2D7] shadow-sm gap-1 py-3">
                  <CardHeader className="px-4 gap-0">
                    <CardTitle className="text-xl font-bold text-[#1D1D1F]">
                      Renewal QTY
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4">
                    {loading ? (
                      <div className="h-32 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                      </div>
                    ) : extendedWeeklyTrends ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#D2D2D7]">
                              <th className="text-left py-2 px-1 font-semibold text-[#1D1D1F] min-w-[80px]">Week</th>
                              {extendedWeeklyTrends.days.map((day) => (
                                <th key={day} className="text-center py-2 px-1 font-medium text-[#6E6E73]">{day}</th>
                              ))}
                              <th className="text-center py-2 px-1 font-semibold text-[#1D1D1F] bg-[#F5F5F7]">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extendedWeeklyTrends.renewal_qty.map((week) => {
                              const isCurrentWeek = week.week_label === "Current Week"
                              return (
                                <tr key={week.week_label} className={`border-b border-[#E5E5E5] ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className={`py-2 px-1 ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                    <div className="font-medium text-[#1D1D1F] text-sm">{week.week_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{week.week_start}</div>
                                  </td>
                                  {extendedWeeklyTrends.days.map((day) => {
                                    const value = week.daily_cumulative[day]
                                    return (
                                      <td key={day} className={`text-center py-2 px-1 ${value === null ? "text-[#D2D2D7]" : "text-[#1D1D1F]"}`}>
                                        {value === null ? "-" : value}
                                      </td>
                                    )
                                  })}
                                  <td className={`text-center py-2 px-1 font-semibold bg-[#F5F5F7] ${week.week_total === null ? "text-[#D2D2D7]" : "text-[#0066CC]"}`}>
                                    {week.week_total === null ? "-" : week.week_total}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Renewal Revenue */}
                <Card className="bg-white border-[#D2D2D7] shadow-sm gap-1 py-3">
                  <CardHeader className="px-4 gap-0">
                    <CardTitle className="text-xl font-bold text-[#1D1D1F]">
                      Renewal Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4">
                    {loading ? (
                      <div className="h-32 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                      </div>
                    ) : extendedWeeklyTrends ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#D2D2D7]">
                              <th className="text-left py-2 px-1 font-semibold text-[#1D1D1F] min-w-[80px]">Week</th>
                              {extendedWeeklyTrends.days.map((day) => (
                                <th key={day} className="text-center py-2 px-1 font-medium text-[#6E6E73]">{day}</th>
                              ))}
                              <th className="text-center py-2 px-1 font-semibold text-[#1D1D1F] bg-[#F5F5F7]">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extendedWeeklyTrends.renewal_revenue.map((week) => {
                              const isCurrentWeek = week.week_label === "Current Week"
                              return (
                                <tr key={week.week_label} className={`border-b border-[#E5E5E5] ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className={`py-2 px-1 ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                    <div className="font-medium text-[#1D1D1F] text-sm">{week.week_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{week.week_start}</div>
                                  </td>
                                  {extendedWeeklyTrends.days.map((day) => {
                                    const value = week.daily_cumulative[day]
                                    return (
                                      <td key={day} className={`text-center py-2 px-1 ${value === null ? "text-[#D2D2D7]" : "text-[#1D1D1F]"}`}>
                                        {value === null ? "-" : value ? `$${Math.round(value / 1000)}k` : "$0"}
                                      </td>
                                    )
                                  })}
                                  <td className={`text-center py-2 px-1 font-semibold bg-[#F5F5F7] ${week.week_total === null ? "text-[#D2D2D7]" : "text-[#0066CC]"}`}>
                                    {week.week_total === null ? "-" : `$${Math.round(week.week_total / 1000)}k`}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Total Gross Revenue and Product Mix */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Total Gross Revenue */}
                <Card className="bg-white border-[#D2D2D7] shadow-sm gap-1 py-3">
                  <CardHeader className="px-4 gap-0">
                    <CardTitle className="text-xl font-bold text-[#1D1D1F]">
                      Total Gross Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 px-4">
                    {loading ? (
                      <div className="h-32 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                      </div>
                    ) : extendedWeeklyTrends ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#D2D2D7]">
                              <th className="text-left py-2 px-1 font-semibold text-[#1D1D1F] min-w-[80px]">Week</th>
                              {extendedWeeklyTrends.days.map((day) => (
                                <th key={day} className="text-center py-2 px-1 font-medium text-[#6E6E73]">{day}</th>
                              ))}
                              <th className="text-center py-2 px-1 font-semibold text-[#1D1D1F] bg-[#F5F5F7]">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {extendedWeeklyTrends.total_gross_revenue.map((week) => {
                              const isCurrentWeek = week.week_label === "Current Week"
                              return (
                                <tr key={week.week_label} className={`border-b border-[#E5E5E5] ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className={`py-2 px-1 ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                    <div className="font-medium text-[#1D1D1F] text-sm">{week.week_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{week.week_start}</div>
                                  </td>
                                  {extendedWeeklyTrends.days.map((day) => {
                                    const value = week.daily_cumulative[day]
                                    return (
                                      <td key={day} className={`text-center py-2 px-1 ${value === null ? "text-[#D2D2D7]" : "text-[#1D1D1F]"}`}>
                                        {value === null ? "-" : value ? `$${Math.round(value / 1000)}k` : "$0"}
                                      </td>
                                    )
                                  })}
                                  <td className={`text-center py-2 px-1 font-semibold bg-[#F5F5F7] ${week.week_total === null ? "text-[#D2D2D7]" : "text-emerald-600"}`}>
                                    {week.week_total === null ? "-" : `$${Math.round(week.week_total / 1000)}k`}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

              {/* Product Mix By Week Table */}
              <Card className="bg-white border-[#D2D2D7] shadow-sm gap-1 py-3">
                <CardHeader className="px-4 gap-0">
                  <CardTitle className="text-xl font-bold text-[#1D1D1F]">
                    Product Mix By Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-4">
                  {loading ? (
                    <div className="h-32 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                    </div>
                  ) : error ? (
                    <div className="h-48 flex items-center justify-center text-[#FF3B30] text-sm">
                      {error}
                    </div>
                  ) : productMix ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#D2D2D7]">
                            <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">
                              Week
                            </th>
                            <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">
                              Total
                            </th>
                            <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">
                              Cert
                            </th>
                            <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">
                              Learner
                            </th>
                            <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">
                              Team
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {productMix.weeks.map((week) => {
                            const isCurrentWeek = week.week_label === "Current Week"
                            return (
                              <tr
                                key={week.week_label}
                                className={`border-b border-[#E5E5E5] ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}
                              >
                                <td className={`py-2 px-2 ${isCurrentWeek ? "bg-[#E8F4FF]" : ""}`}>
                                  <div className="font-medium text-[#1D1D1F] text-sm">{week.week_label}</div>
                                  <div className="text-xs text-[#6E6E73]">{week.week_start}</div>
                                </td>
                                <td className="text-center py-2 px-2 font-medium text-[#1D1D1F]">
                                  {week.total}
                                </td>
                                <td className="text-center py-2 px-2 text-[#1D1D1F]">
                                  {week.cert_pct}%
                                </td>
                                <td className="text-center py-2 px-2 text-[#1D1D1F]">
                                  {week.learner_pct}%
                                </td>
                                <td className="text-center py-2 px-2 text-[#1D1D1F]">
                                  {week.team_pct}%
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              </div>
            </div>

            {/* Monthly Trends Section */}
            {monthlyTrends && monthlyTrends.months.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#0066CC]" />
                  Monthly Trends
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Direct QTY */}
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-[#1D1D1F]">Direct QTY</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b-2 border-[#D2D2D7]">
                              <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Period</th>
                              {monthlyTrends.weeks.map(wk => (
                                <th key={wk} className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">{wk}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTrends.months.map((row) => {
                              const isCurrentMonth = row.row_label === "Current Month"
                              return (
                                <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-[#1D1D1F] text-sm">{row.row_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{row.month_label}</div>
                                  </td>
                                  {monthlyTrends.weeks.map(wk => (
                                    <td key={wk} className="text-center py-2 px-2 text-[#1D1D1F] font-medium">
                                      {row.direct_qty[wk] !== null && row.direct_qty[wk] !== undefined ? row.direct_qty[wk]!.toLocaleString() : "—"}
                                    </td>
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Direct Revenue */}
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-[#1D1D1F]">Direct Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b-2 border-[#D2D2D7]">
                              <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Period</th>
                              {monthlyTrends.weeks.map(wk => (
                                <th key={wk} className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">{wk}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTrends.months.map((row) => {
                              const isCurrentMonth = row.row_label === "Current Month"
                              return (
                                <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-[#1D1D1F] text-sm">{row.row_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{row.month_label}</div>
                                  </td>
                                  {monthlyTrends.weeks.map(wk => (
                                    <td key={wk} className="text-center py-2 px-2 text-[#1D1D1F] font-medium">
                                      {row.direct_revenue[wk] !== null && row.direct_revenue[wk] !== undefined ? `$${row.direct_revenue[wk]!.toLocaleString()}` : "—"}
                                    </td>
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Renewal QTY */}
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-[#1D1D1F]">Renewal QTY</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b-2 border-[#D2D2D7]">
                              <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Period</th>
                              {monthlyTrends.weeks.map(wk => (
                                <th key={wk} className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">{wk}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTrends.months.map((row) => {
                              const isCurrentMonth = row.row_label === "Current Month"
                              return (
                                <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-[#1D1D1F] text-sm">{row.row_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{row.month_label}</div>
                                  </td>
                                  {monthlyTrends.weeks.map(wk => (
                                    <td key={wk} className="text-center py-2 px-2 text-[#1D1D1F] font-medium">
                                      {row.renewal_qty[wk] !== null && row.renewal_qty[wk] !== undefined ? row.renewal_qty[wk]!.toLocaleString() : "—"}
                                    </td>
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Renewal Revenue */}
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-[#1D1D1F]">Renewal Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b-2 border-[#D2D2D7]">
                              <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Period</th>
                              {monthlyTrends.weeks.map(wk => (
                                <th key={wk} className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">{wk}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTrends.months.map((row) => {
                              const isCurrentMonth = row.row_label === "Current Month"
                              return (
                                <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-[#1D1D1F] text-sm">{row.row_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{row.month_label}</div>
                                  </td>
                                  {monthlyTrends.weeks.map(wk => (
                                    <td key={wk} className="text-center py-2 px-2 text-[#1D1D1F] font-medium">
                                      {row.renewal_revenue[wk] !== null && row.renewal_revenue[wk] !== undefined ? `$${row.renewal_revenue[wk]!.toLocaleString()}` : "—"}
                                    </td>
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Gross Revenue */}
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-[#1D1D1F]">Total Gross Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b-2 border-[#D2D2D7]">
                              <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Period</th>
                              {monthlyTrends.weeks.map(wk => (
                                <th key={wk} className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">{wk}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTrends.months.map((row) => {
                              const isCurrentMonth = row.row_label === "Current Month"
                              return (
                                <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-[#1D1D1F] text-sm">{row.row_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{row.month_label}</div>
                                  </td>
                                  {monthlyTrends.weeks.map(wk => (
                                    <td key={wk} className="text-center py-2 px-2 text-[#1D1D1F] font-medium">
                                      {row.total_gross_revenue[wk] !== null && row.total_gross_revenue[wk] !== undefined ? `$${row.total_gross_revenue[wk]!.toLocaleString()}` : "—"}
                                    </td>
                                  ))}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Product Mix By Month */}
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold text-[#1D1D1F]">Product Mix By Month</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-base">
                          <thead>
                            <tr className="border-b-2 border-[#D2D2D7]">
                              <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Period</th>
                              <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Total</th>
                              <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Cert %</th>
                              <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Team %</th>
                              <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Learner %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthlyTrends.months.map((row) => {
                              const isCurrentMonth = row.row_label === "Current Month"
                              const total = row.total_direct_qty
                              const certPct = total > 0 ? Math.round((row.cert_total / total) * 100) : 0
                              const teamPct = total > 0 ? Math.round((row.team_total / total) * 100) : 0
                              const learnerPct = total > 0 ? Math.round((row.learner_total / total) * 100) : 0
                              return (
                                <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8F4FF]" : ""}`}>
                                  <td className="py-2 px-2">
                                    <div className="font-medium text-[#1D1D1F] text-sm">{row.row_label}</div>
                                    <div className="text-xs text-[#6E6E73]">{row.month_label}</div>
                                  </td>
                                  <td className="text-center py-2 px-2 text-[#1D1D1F] font-medium">{total}</td>
                                  <td className="text-center py-2 px-2 text-[#1D1D1F]">{certPct}%</td>
                                  <td className="text-center py-2 px-2 text-[#1D1D1F]">{teamPct}%</td>
                                  <td className="text-center py-2 px-2 text-[#1D1D1F]">{learnerPct}%</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Year-over-Year Weekly Sales Chart */}
            <div className="mt-8">
              <Card className="bg-white border-[#D2D2D7] shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#0066CC]" />
                    Direct Qty Total by Week
                  </CardTitle>
                  <CardDescription className="text-sm text-[#6E6E73]">
                    Year-over-year comparison of weekly direct sales
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {loading ? (
                    <div className="h-[500px] flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                    </div>
                  ) : error ? (
                    <div className="h-[500px] flex items-center justify-center text-[#FF3B30] text-sm">
                      {error}
                    </div>
                  ) : weeklyQtyYoY ? (
                    <div className="h-[500px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={weeklyQtyYoY.data}
                          margin={{ top: 25, right: 30, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                          <XAxis
                            dataKey="week_label"
                            tick={{ fontSize: 12, fill: '#6E6E73' }}
                            tickLine={{ stroke: '#D2D2D7' }}
                            interval={3}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: '#6E6E73' }}
                            tickLine={{ stroke: '#D2D2D7' }}
                            axisLine={{ stroke: '#D2D2D7' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #D2D2D7',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              fontSize: 14,
                            }}
                            labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                            formatter={(value, name) => {
                              if (value === null || value === undefined) return ['-', String(name)]
                              const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                              return [Number(value).toLocaleString(), yearLabel]
                            }}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: '10px', fontSize: 13 }}
                            formatter={(value: string) => {
                              if (value === 'y2024') return '2024'
                              if (value === 'y2025') return '2025'
                              if (value === 'y2026') return '2026'
                              return value
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="y2024"
                            stroke="#8E8E93"
                            strokeWidth={2}
                            dot={{ fill: '#8E8E93', strokeWidth: 2, r: 4 }}
                            connectNulls
                            name="y2024"
                          />
                          <Line
                            type="monotone"
                            dataKey="y2025"
                            stroke="#0066CC"
                            strokeWidth={2}
                            dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }}
                            connectNulls
                            name="y2025"
                          />
                          <Line
                            type="monotone"
                            dataKey="y2026"
                            stroke="#34C759"
                            strokeWidth={3}
                            dot={{ fill: '#34C759', strokeWidth: 2, r: 5 }}
                            connectNulls
                            name="y2026"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* Year-over-Year Monthly Sales Chart */}
            <div className="mt-8">
              <Card className="bg-white border-[#D2D2D7] shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#0066CC]" />
                    Direct Qty Total by Month
                  </CardTitle>
                  <CardDescription className="text-sm text-[#6E6E73]">
                    Year-over-year comparison of monthly direct sales (YTD)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {loading ? (
                    <div className="h-[500px] flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                    </div>
                  ) : error ? (
                    <div className="h-[500px] flex items-center justify-center text-[#FF3B30] text-sm">
                      {error}
                    </div>
                  ) : monthlyQtyYoY ? (
                    <div className="h-[500px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={monthlyQtyYoY.data}
                          margin={{ top: 25, right: 30, left: 10, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                          <XAxis
                            dataKey="month_label"
                            tick={{ fontSize: 13, fill: '#6E6E73' }}
                            tickLine={{ stroke: '#D2D2D7' }}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: '#6E6E73' }}
                            tickLine={{ stroke: '#D2D2D7' }}
                            axisLine={{ stroke: '#D2D2D7' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #D2D2D7',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              fontSize: 14,
                            }}
                            labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                            formatter={(value, name) => {
                              if (value === null || value === undefined) return ['-', String(name)]
                              const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                              return [Number(value).toLocaleString(), yearLabel]
                            }}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: '10px', fontSize: 13 }}
                            formatter={(value: string) => {
                              if (value === 'y2024') return '2024'
                              if (value === 'y2025') return '2025'
                              if (value === 'y2026') return '2026'
                              return value
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="y2024"
                            stroke="#8E8E93"
                            strokeWidth={2}
                            dot={{ fill: '#8E8E93', strokeWidth: 2, r: 5 }}
                            connectNulls
                            name="y2024"
                          />
                          <Line
                            type="monotone"
                            dataKey="y2025"
                            stroke="#0066CC"
                            strokeWidth={2}
                            dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }}
                            connectNulls
                            name="y2025"
                          />
                          <Line
                            type="monotone"
                            dataKey="y2026"
                            stroke="#34C759"
                            strokeWidth={3}
                            dot={{ fill: '#34C759', strokeWidth: 2, r: 6 }}
                            connectNulls
                            name="y2026"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* Cumulative Direct Qty by Week */}
            <div className="mt-8">
              <Card className="bg-white border-[#D2D2D7] shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#34C759]" />
                    Cumulative Direct Qty Total by Week
                  </CardTitle>
                  <CardDescription className="text-sm text-[#6E6E73]">
                    Year-over-year running total of weekly direct sales
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {loading ? (
                    <div className="h-[500px] flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                    </div>
                  ) : error ? (
                    <div className="h-[500px] flex items-center justify-center text-[#FF3B30] text-sm">
                      {error}
                    </div>
                  ) : weeklyQtyYoY ? (() => {
                    let cum2024 = 0, cum2025 = 0, cum2026 = 0
                    const cumData = weeklyQtyYoY.data.map(d => {
                      if (d.y2024 !== null) cum2024 += d.y2024
                      if (d.y2025 !== null) cum2025 += d.y2025
                      if (d.y2026 !== null) cum2026 += d.y2026
                      return {
                        week_label: d.week_label,
                        y2024: d.y2024 !== null ? cum2024 : null,
                        y2025: d.y2025 !== null ? cum2025 : null,
                        y2026: d.y2026 !== null ? cum2026 : null,
                      }
                    })
                    return (
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={cumData}
                            margin={{ top: 25, right: 30, left: 20, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                            <XAxis
                              dataKey="week_label"
                              tick={{ fontSize: 12, fill: '#6E6E73' }}
                              tickLine={{ stroke: '#D2D2D7' }}
                              interval={3}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: '#6E6E73' }}
                              tickLine={{ stroke: '#D2D2D7' }}
                              axisLine={{ stroke: '#D2D2D7' }}
                              tickFormatter={(v) => v.toLocaleString()}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #D2D2D7',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                fontSize: 14,
                              }}
                              labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                              formatter={(value, name) => {
                                if (value === null || value === undefined) return ['-', String(name)]
                                const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                return [Number(value).toLocaleString(), yearLabel]
                              }}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: '10px', fontSize: 13 }}
                              formatter={(value: string) => {
                                if (value === 'y2024') return '2024'
                                if (value === 'y2025') return '2025'
                                if (value === 'y2026') return '2026'
                                return value
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="y2024"
                              stroke="#8E8E93"
                              strokeWidth={2}
                              dot={{ fill: '#8E8E93', strokeWidth: 2, r: 3 }}
                              connectNulls
                              name="y2024"
                            />
                            <Line
                              type="monotone"
                              dataKey="y2025"
                              stroke="#0066CC"
                              strokeWidth={2}
                              dot={{ fill: '#0066CC', strokeWidth: 2, r: 3 }}
                              connectNulls
                              name="y2025"
                            />
                            <Line
                              type="monotone"
                              dataKey="y2026"
                              stroke="#34C759"
                              strokeWidth={3}
                              dot={{ fill: '#34C759', strokeWidth: 2, r: 5 }}
                              connectNulls
                              name="y2026"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  })() : null}
                </CardContent>
              </Card>
            </div>

            {/* Cumulative Direct Qty by Month */}
            <div className="mt-8">
              <Card className="bg-white border-[#D2D2D7] shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#34C759]" />
                    Cumulative Direct Qty Total by Month
                  </CardTitle>
                  <CardDescription className="text-sm text-[#6E6E73]">
                    Year-over-year running total of monthly direct sales (YTD)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {loading ? (
                    <div className="h-[500px] flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                    </div>
                  ) : error ? (
                    <div className="h-[500px] flex items-center justify-center text-[#FF3B30] text-sm">
                      {error}
                    </div>
                  ) : monthlyQtyYoY ? (() => {
                    let cum2024 = 0, cum2025 = 0, cum2026 = 0
                    const cumData = monthlyQtyYoY.data.map(d => {
                      if (d.y2024 !== null) cum2024 += d.y2024
                      if (d.y2025 !== null) cum2025 += d.y2025
                      if (d.y2026 !== null) cum2026 += d.y2026
                      return {
                        month_label: d.month_label,
                        y2024: d.y2024 !== null ? cum2024 : null,
                        y2025: d.y2025 !== null ? cum2025 : null,
                        y2026: d.y2026 !== null ? cum2026 : null,
                      }
                    })
                    return (
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={cumData}
                            margin={{ top: 25, right: 30, left: 20, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                            <XAxis
                              dataKey="month_label"
                              tick={{ fontSize: 13, fill: '#6E6E73' }}
                              tickLine={{ stroke: '#D2D2D7' }}
                            />
                            <YAxis
                              tick={{ fontSize: 12, fill: '#6E6E73' }}
                              tickLine={{ stroke: '#D2D2D7' }}
                              axisLine={{ stroke: '#D2D2D7' }}
                              tickFormatter={(v) => v.toLocaleString()}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #D2D2D7',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                fontSize: 14,
                              }}
                              labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                              formatter={(value, name) => {
                                if (value === null || value === undefined) return ['-', String(name)]
                                const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                return [Number(value).toLocaleString(), yearLabel]
                              }}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: '10px', fontSize: 13 }}
                              formatter={(value: string) => {
                                if (value === 'y2024') return '2024'
                                if (value === 'y2025') return '2025'
                                if (value === 'y2026') return '2026'
                                return value
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="y2024"
                              stroke="#8E8E93"
                              strokeWidth={2}
                              dot={{ fill: '#8E8E93', strokeWidth: 2, r: 5 }}
                              connectNulls
                              name="y2024"
                            />
                            <Line
                              type="monotone"
                              dataKey="y2025"
                              stroke="#0066CC"
                              strokeWidth={2}
                              dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }}
                              connectNulls
                              name="y2025"
                            />
                            <Line
                              type="monotone"
                              dataKey="y2026"
                              stroke="#34C759"
                              strokeWidth={3}
                              dot={{ fill: '#34C759', strokeWidth: 2, r: 6 }}
                              connectNulls
                              name="y2026"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  })() : null}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Traffic Tab */}
        {activeTab === "traffic" && (
          <>
            {/* Traffic Source Toggle */}
            <div className="flex flex-wrap gap-2 mb-6 sticky top-[108px] z-[5] bg-[#F5F5F7] py-3 -mt-3">
              {([
                { key: 'total' as TrafficSource, label: 'Total Traffic', color: '#0066CC' },
                { key: 'organic' as TrafficSource, label: 'Organic', color: '#34C759' },
                { key: 'direct' as TrafficSource, label: 'Direct', color: '#FF9500' },
                { key: 'referral' as TrafficSource, label: 'Referral', color: '#AF52DE' },
                { key: 'paid' as TrafficSource, label: 'Paid', color: '#FF3B30' },
              ]).map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setTrafficSource(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    trafficSource === key
                      ? 'text-white shadow-md'
                      : 'bg-white text-[#6E6E73] border border-[#D2D2D7] hover:border-[#8E8E93]'
                  }`}
                  style={trafficSource === key ? { backgroundColor: color } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="text-xs text-[#8E8E93] -mt-4 mb-4">Data from Google Analytics 4</div>

            {trafficLoading && !traffic ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
              </div>
            ) : traffic ? (
              <>
                {/* Traffic KPI Cards - Dark Style with PY */}
                {(() => {
                  const kpiData = trafficTrends?.kpi?.[trafficSource]
                  return (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Yesterday */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">Yesterday</div>
                        <div className="text-7xl font-bold text-white">{formatNumber(kpiData?.yesterday.value ?? 0)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(kpiData.yesterday.py)}</div>
                            <div className={`text-lg font-semibold ${kpiData.yesterday.change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.yesterday.change_pct >= 0 ? "+" : ""}{kpiData.yesterday.change_pct}% ({kpiData.yesterday.diff >= 0 ? "+" : ""}{formatNumber(kpiData.yesterday.diff)})
                            </div>
                          </div>
                        )}
                      </div>
                      {/* This Week */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">This Week</div>
                        <div className="text-7xl font-bold text-white">{formatNumber(kpiData?.this_week.value ?? 0)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(kpiData.this_week.py)}</div>
                            <div className={`text-lg font-semibold ${kpiData.this_week.change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.this_week.change_pct >= 0 ? "+" : ""}{kpiData.this_week.change_pct}% ({kpiData.this_week.diff >= 0 ? "+" : ""}{formatNumber(kpiData.this_week.diff)})
                            </div>
                          </div>
                        )}
                      </div>
                      {/* MTD */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">MTD</div>
                        <div className="text-7xl font-bold text-white">{formatNumber(kpiData?.mtd.value ?? 0)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(kpiData.mtd.py)}</div>
                            <div className={`text-lg font-semibold ${kpiData.mtd.change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.mtd.change_pct >= 0 ? "+" : ""}{kpiData.mtd.change_pct}% ({kpiData.mtd.diff >= 0 ? "+" : ""}{formatNumber(kpiData.mtd.diff)})
                            </div>
                          </div>
                        )}
                      </div>
                      {/* YTD */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">YTD</div>
                        <div className="text-7xl font-bold text-white">{formatNumber(kpiData?.ytd?.value ?? 0)}</div>
                        {kpiData?.ytd && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(kpiData.ytd.py)}</div>
                            <div className={`text-lg font-semibold ${kpiData.ytd.change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.ytd.change_pct >= 0 ? "+" : ""}{kpiData.ytd.change_pct}% ({kpiData.ytd.diff >= 0 ? "+" : ""}{formatNumber(kpiData.ytd.diff)})
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Weekly Trends Heatmap - Traffic */}
                {trafficTrends && trafficTrends.weekly_trends.data[trafficSource] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-[#0066CC]" />
                          Weekly Trends ({trafficSource === 'total' ? 'Total Traffic' : trafficSource.charAt(0).toUpperCase() + trafficSource.slice(1) + ' Traffic'})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Week</th>
                                {trafficTrends.weekly_trends.days.map((day) => (
                                  <th key={day} className="text-center py-3 px-1 font-semibold text-white whitespace-nowrap">{day}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white bg-[#0066CC] whitespace-nowrap">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const days = trafficTrends.weekly_trends.days
                                const weekRows = trafficTrends.weekly_trends.data[trafficSource]
                                const allValues = weekRows.flatMap(week =>
                                  days.map(day => week.daily_cumulative[day]).filter((v): v is number => typeof v === 'number')
                                )
                                const maxValue = Math.max(...allValues, 1)

                                const getHeatmapClass = (value: number | null | undefined) => {
                                  if (value === null || value === undefined) return 'bg-[#1D1D1F]'
                                  const intensity = Math.round((value / maxValue) * 100)
                                  if (intensity > 80) return 'bg-blue-600'
                                  if (intensity > 60) return 'bg-blue-500'
                                  if (intensity > 40) return 'bg-blue-600/60'
                                  if (intensity > 20) return 'bg-blue-600/40'
                                  return 'bg-blue-600/20'
                                }

                                return weekRows.map((week, idx) => {
                                  const isCurrentWeek = week.week_label === "Current Week"
                                  const cellBg = isCurrentWeek ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{week.week_label}</div>
                                        <div className="text-xs text-white/40">{week.week_start}</div>
                                      </td>
                                      {days.map(day => {
                                        const value = week.daily_cumulative[day]
                                        return (
                                          <td
                                            key={day}
                                            className={`text-center py-3 px-1 ${getHeatmapClass(value)} ${value === null ? "text-white/20" : "text-white font-semibold"}`}
                                          >
                                            {value !== null && value !== undefined ? value.toLocaleString() : '-'}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${week.week_total === null ? "text-white/20" : "text-white"}`}>
                                        {week.week_total !== null ? week.week_total.toLocaleString() : '-'}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Monthly Trends Heatmap - Traffic */}
                {trafficTrends && trafficTrends.monthly_trends.months.length > 0 && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-[#0066CC]" />
                          Monthly Trends ({trafficSource === 'total' ? 'Total Traffic' : trafficSource.charAt(0).toUpperCase() + trafficSource.slice(1) + ' Traffic'})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Month</th>
                                {trafficTrends.monthly_trends.weeks.map((wk) => (
                                  <th key={wk} className="text-center py-3 px-3 font-semibold text-white whitespace-nowrap">{wk}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white bg-[#0066CC] whitespace-nowrap">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const weeks = trafficTrends.monthly_trends.weeks
                                const monthRows = trafficTrends.monthly_trends.months
                                const allValues = monthRows.flatMap(row =>
                                  weeks.map(wk => row[trafficSource][wk]).filter((v): v is number => typeof v === 'number')
                                )
                                const maxValue = Math.max(...allValues, 1)

                                const getHeatmapClass = (value: number | null | undefined) => {
                                  if (value === null || value === undefined) return 'bg-[#1D1D1F]'
                                  const intensity = Math.round((value / maxValue) * 100)
                                  if (intensity > 80) return 'bg-blue-600'
                                  if (intensity > 60) return 'bg-blue-500'
                                  if (intensity > 40) return 'bg-blue-600/60'
                                  if (intensity > 20) return 'bg-blue-600/40'
                                  return 'bg-blue-600/20'
                                }

                                const getSourceTotal = (row: TrafficTrendMonthRow): number => {
                                  if (trafficSource === 'total') return row.grand_total
                                  return row[`${trafficSource}_total` as keyof TrafficTrendMonthRow] as number
                                }

                                return monthRows.map((row, idx) => {
                                  const isCurrentMonth = row.row_label === "Current Month"
                                  const cellBg = isCurrentMonth ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                                  const sourceTotal = getSourceTotal(row)
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{row.row_label}</div>
                                        <div className="text-xs text-white/40">{row.month_label}</div>
                                      </td>
                                      {weeks.map(wk => {
                                        const value = row[trafficSource][wk]
                                        return (
                                          <td
                                            key={wk}
                                            className={`text-center py-3 px-3 ${getHeatmapClass(value)} ${value === null || value === undefined ? "text-white/20" : "text-white font-semibold"}`}
                                          >
                                            {value !== null && value !== undefined ? value.toLocaleString() : '-'}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${sourceTotal === 0 ? "text-white/20" : "text-white"}`}>
                                        {sourceTotal > 0 ? sourceTotal.toLocaleString() : '-'}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Traffic Breakdown - Weekly Tables */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {!trafficBySourceWeekly ? (
                    <Card className="bg-white border-[#D2D2D7] shadow-sm p-8 lg:col-span-2">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#0066CC]" />
                        <span className="ml-2 text-[#6E6E73]">Loading weekly data...</span>
                      </div>
                    </Card>
                  ) : (
                    <>
                    {/* Sessions by Source - Weekly */}
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#0066CC]" />
                          Sessions by Source
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="overflow-x-auto">
                          <table className="w-full text-base">
                            <thead>
                              <tr className="border-b border-[#D2D2D7]">
                                <th className="text-left py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Week</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Total</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Organic</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Direct</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Referral</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Paid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trafficBySourceWeekly.weeks.map((week, idx) => (
                                <tr
                                  key={week.week_label}
                                  className={`border-b border-[#E5E5E5] ${idx === 0 ? "bg-[#E8F0FE]" : ""}`}
                                >
                                  <td className="py-2 px-2">
                                    <div className="font-semibold text-[#1D1D1F] text-base">{week.week_label}</div>
                                    <div className="text-sm text-[#6E6E73]">{week.week_start}</div>
                                  </td>
                                  <td className="text-center py-2 px-2 font-semibold text-[#1D1D1F]">
                                    {formatNumber(week.total_sessions)}
                                  </td>
                                  <td className="text-center py-2 px-2 text-[#6E6E73]">
                                    {week.organic_sessions_pct.toFixed(0)}%
                                  </td>
                                  <td className="text-center py-2 px-2 text-[#6E6E73]">
                                    {week.direct_sessions_pct.toFixed(0)}%
                                  </td>
                                  <td className="text-center py-2 px-2 text-[#6E6E73]">
                                    {week.referral_sessions_pct.toFixed(0)}%
                                  </td>
                                  <td className="text-center py-2 px-2 text-[#6E6E73]">
                                    {week.paid_sessions_pct.toFixed(0)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Conversions by Source - Weekly */}
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[#0066CC]" />
                          Conversions by Source
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="overflow-x-auto">
                          <table className="w-full text-base">
                            <thead>
                              <tr className="border-b border-[#D2D2D7]">
                                <th className="text-left py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Week</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Total</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Conv %</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">GADS+Bing</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Organic</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Direct</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Referral</th>
                                <th className="text-center py-2 px-2 font-medium text-[#6E6E73] uppercase text-sm tracking-wider">Paid</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trafficBySourceWeekly.weeks.map((week, idx) => {
                                const convRate = week.total_sessions > 0
                                  ? ((week.total_conversions / week.total_sessions) * 100).toFixed(2)
                                  : "0.00"
                                return (
                                  <tr
                                    key={week.week_label}
                                    className={`border-b border-[#E5E5E5] ${idx === 0 ? "bg-[#E8F0FE]" : ""}`}
                                  >
                                    <td className="py-2 px-2">
                                      <div className="font-semibold text-[#1D1D1F] text-base">{week.week_label}</div>
                                      <div className="text-sm text-[#6E6E73]">{week.week_start}</div>
                                    </td>
                                    <td className="text-center py-2 px-2 font-semibold text-[#1D1D1F]">
                                      {week.total_conversions}
                                    </td>
                                    <td className="text-center py-2 px-2 font-semibold text-[#34C759]">
                                      {convRate}%
                                    </td>
                                    <td className="text-center py-2 px-2 text-[#6E6E73]">
                                      {week.gads_bing_conversions_pct.toFixed(0)}%
                                    </td>
                                    <td className="text-center py-2 px-2 text-[#6E6E73]">
                                      {week.organic_conversions_pct.toFixed(0)}%
                                    </td>
                                    <td className="text-center py-2 px-2 text-[#6E6E73]">
                                      {week.direct_conversions_pct.toFixed(0)}%
                                    </td>
                                    <td className="text-center py-2 px-2 text-[#6E6E73]">
                                      {week.referral_conversions_pct.toFixed(0)}%
                                    </td>
                                    <td className="text-center py-2 px-2 text-[#6E6E73]">
                                      {week.paid_conversions_pct.toFixed(0)}%
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                    </>
                  )}
                </div>

                {/* Monthly Traffic Trends */}
                {trafficTrends && trafficTrends.monthly_trends.months.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#0066CC]" />
                      Monthly Traffic Trends — {trafficSource === 'total' ? 'Total' : trafficSource.charAt(0).toUpperCase() + trafficSource.slice(1)}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Traffic by Month */}
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold text-[#1D1D1F]">
                            {trafficSource === 'total' ? 'Total' : trafficSource.charAt(0).toUpperCase() + trafficSource.slice(1)} Sessions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-base">
                              <thead>
                                <tr className="border-b-2 border-[#D2D2D7]">
                                  <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Period</th>
                                  {trafficTrends.monthly_trends.weeks.map(wk => (
                                    <th key={wk} className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">{wk}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {trafficTrends.monthly_trends.months.map((row) => {
                                  const isCurrentMonth = row.row_label === "Current Month"
                                  const data = row[trafficSource]
                                  return (
                                    <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8F4FF]" : ""}`}>
                                      <td className="py-2 px-2">
                                        <div className="font-medium text-[#1D1D1F] text-sm">{row.row_label}</div>
                                        <div className="text-xs text-[#6E6E73]">{row.month_label}</div>
                                      </td>
                                      {trafficTrends.monthly_trends.weeks.map(wk => (
                                        <td key={wk} className="text-center py-2 px-2 text-[#1D1D1F] font-medium">
                                          {data[wk] !== null && data[wk] !== undefined ? data[wk]!.toLocaleString() : "—"}
                                        </td>
                                      ))}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Source Mix by Month */}
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold text-[#1D1D1F]">Source Mix By Month</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-base">
                              <thead>
                                <tr className="border-b-2 border-[#D2D2D7]">
                                  <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Period</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Total</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Organic %</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Direct %</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Referral %</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-xs tracking-wide">Paid %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {trafficTrends.monthly_trends.months.map((row) => {
                                  const isCurrentMonth = row.row_label === "Current Month"
                                  const gt = row.grand_total
                                  const orgPct = gt > 0 ? Math.round((row.organic_total / gt) * 100) : 0
                                  const dirPct = gt > 0 ? Math.round((row.direct_total / gt) * 100) : 0
                                  const refPct = gt > 0 ? Math.round((row.referral_total / gt) * 100) : 0
                                  const paidPct = gt > 0 ? Math.round((row.paid_total / gt) * 100) : 0
                                  return (
                                    <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8F4FF]" : ""}`}>
                                      <td className="py-2 px-2">
                                        <div className="font-medium text-[#1D1D1F] text-sm">{row.row_label}</div>
                                        <div className="text-xs text-[#6E6E73]">{row.month_label}</div>
                                      </td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F] font-medium">{gt.toLocaleString()}</td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F]">{orgPct}%</td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F]">{dirPct}%</td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F]">{refPct}%</td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F]">{paidPct}%</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* YoY Traffic by Week */}
                {trafficTrends && trafficTrends.weekly_yoy[trafficSource] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[#0066CC]" />
                          {trafficSource === 'total' ? 'Total' : trafficSource.charAt(0).toUpperCase() + trafficSource.slice(1)} Traffic by Week
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6E6E73]">
                          Year-over-year comparison of weekly sessions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="h-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={trafficTrends.weekly_yoy[trafficSource]}
                              margin={{ top: 25, right: 30, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                              <XAxis dataKey="week_label" tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} interval={3} />
                              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => v.toLocaleString()} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                formatter={(value, name) => {
                                  if (value === null || value === undefined) return ['-', String(name)]
                                  const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                  return [Number(value).toLocaleString(), yearLabel]
                                }}
                              />
                              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                              <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 4 }} connectNulls name="y2024" />
                              <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }} connectNulls name="y2025" />
                              <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 5 }} connectNulls name="y2026" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* YoY Traffic by Month */}
                {trafficTrends && trafficTrends.monthly_yoy[trafficSource] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#0066CC]" />
                          {trafficSource === 'total' ? 'Total' : trafficSource.charAt(0).toUpperCase() + trafficSource.slice(1)} Traffic by Month
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6E6E73]">
                          Year-over-year comparison of monthly sessions (YTD)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="h-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={trafficTrends.monthly_yoy[trafficSource]}
                              margin={{ top: 25, right: 30, left: 20, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                              <XAxis dataKey="month_label" tick={{ fontSize: 13, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} />
                              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => v.toLocaleString()} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                formatter={(value, name) => {
                                  if (value === null || value === undefined) return ['-', String(name)]
                                  const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                  return [Number(value).toLocaleString(), yearLabel]
                                }}
                              />
                              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                              <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 5 }} connectNulls name="y2024" />
                              <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }} connectNulls name="y2025" />
                              <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 6 }} connectNulls name="y2026" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Cumulative Traffic by Week */}
                {trafficTrends && trafficTrends.weekly_yoy[trafficSource] && (() => {
                  let cum2024 = 0, cum2025 = 0, cum2026 = 0
                  const cumData = trafficTrends.weekly_yoy[trafficSource].map(d => {
                    if (d.y2024 !== null) cum2024 += d.y2024
                    if (d.y2025 !== null) cum2025 += d.y2025
                    if (d.y2026 !== null) cum2026 += d.y2026
                    return { week_label: d.week_label, y2024: d.y2024 !== null ? cum2024 : null, y2025: d.y2025 !== null ? cum2025 : null, y2026: d.y2026 !== null ? cum2026 : null }
                  })
                  return (
                    <div className="mt-8">
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#34C759]" />
                            Cumulative {trafficSource === 'total' ? 'Total' : trafficSource.charAt(0).toUpperCase() + trafficSource.slice(1)} Traffic by Week
                          </CardTitle>
                          <CardDescription className="text-sm text-[#6E6E73]">
                            Year-over-year running total of weekly sessions
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={cumData} margin={{ top: 25, right: 30, left: 20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                                <XAxis dataKey="week_label" tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} interval={3} />
                                <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => v.toLocaleString()} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                  labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                  formatter={(value, name) => {
                                    if (value === null || value === undefined) return ['-', String(name)]
                                    const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                    return [Number(value).toLocaleString(), yearLabel]
                                  }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                                <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 3 }} connectNulls name="y2024" />
                                <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 3 }} connectNulls name="y2025" />
                                <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 5 }} connectNulls name="y2026" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}

                {/* Cumulative Traffic by Month */}
                {trafficTrends && trafficTrends.monthly_yoy[trafficSource] && (() => {
                  let cum2024 = 0, cum2025 = 0, cum2026 = 0
                  const cumData = trafficTrends.monthly_yoy[trafficSource].map(d => {
                    if (d.y2024 !== null) cum2024 += d.y2024
                    if (d.y2025 !== null) cum2025 += d.y2025
                    if (d.y2026 !== null) cum2026 += d.y2026
                    return { month_label: d.month_label, y2024: d.y2024 !== null ? cum2024 : null, y2025: d.y2025 !== null ? cum2025 : null, y2026: d.y2026 !== null ? cum2026 : null }
                  })
                  return (
                    <div className="mt-8">
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#34C759]" />
                            Cumulative {trafficSource === 'total' ? 'Total' : trafficSource.charAt(0).toUpperCase() + trafficSource.slice(1)} Traffic by Month
                          </CardTitle>
                          <CardDescription className="text-sm text-[#6E6E73]">
                            Year-over-year running total of monthly sessions (YTD)
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={cumData} margin={{ top: 25, right: 30, left: 20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                                <XAxis dataKey="month_label" tick={{ fontSize: 13, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => v.toLocaleString()} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                  labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                  formatter={(value, name) => {
                                    if (value === null || value === undefined) return ['-', String(name)]
                                    const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                    return [Number(value).toLocaleString(), yearLabel]
                                  }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                                <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 5 }} connectNulls name="y2024" />
                                <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }} connectNulls name="y2025" />
                                <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 6 }} connectNulls name="y2026" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </>
            ) : (
              <div className="text-center text-[#6E6E73] py-12">
                No traffic data available
              </div>
            )}
          </>
        )}

        {/* Conversions Tab */}
        {activeTab === "conversions" && (
          <>
            {/* View Toggle + Source Filter */}
            <div className="flex items-center gap-4 mb-6 sticky top-[108px] z-[5] bg-[#F5F5F7] py-3 -mt-3">
              {/* Counts vs Rate toggle */}
              <div className="flex bg-white rounded-lg border border-[#D2D2D7] p-0.5">
                <button
                  onClick={() => setConvView('counts')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    convView === 'counts' ? 'bg-[#0066CC] text-white shadow-sm' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  Counts
                </button>
                <button
                  onClick={() => setConvView('rate')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    convView === 'rate' ? 'bg-[#5856D6] text-white shadow-sm' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  Rate %
                </button>
              </div>
              <div className="h-6 w-px bg-[#D2D2D7]" />
              {/* Source filter pills */}
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'total' as ConversionSource, label: convView === 'counts' ? 'Total Conversions' : 'Total', color: convView === 'counts' ? '#34C759' : '#5856D6' },
                  { key: 'organic' as ConversionSource, label: 'Organic', color: '#0066CC' },
                  { key: 'direct' as ConversionSource, label: 'Direct', color: '#FF9500' },
                  { key: 'referral' as ConversionSource, label: 'Referral', color: '#AF52DE' },
                  { key: 'paid' as ConversionSource, label: 'Paid', color: '#FF3B30' },
                ]).map(({ key, label, color }) => {
                  const activeSource = convView === 'counts' ? conversionSource : convPctSource
                  const setSource = convView === 'counts' ? setConversionSource : setConvPctSource
                  return (
                    <button
                      key={key}
                      onClick={() => setSource(key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activeSource === key
                          ? 'text-white shadow-md'
                          : 'bg-white text-[#6E6E73] border border-[#D2D2D7] hover:border-[#8E8E93]'
                      }`}
                      style={activeSource === key ? { backgroundColor: color } : {}}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Counts View */}
            {convView === 'counts' && (
            <>

            {conversionsLoading && !conversionTrends ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#34C759]" />
              </div>
            ) : conversionTrends ? (
              <>
                {/* Conversion KPI Cards */}
                {(() => {
                  const kpiData = conversionTrends?.kpi?.[conversionSource]
                  return (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Yesterday */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">Yesterday</div>
                        <div className="text-7xl font-bold text-white">{formatNumber(kpiData?.yesterday.value ?? 0)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(kpiData.yesterday.py)}</div>
                            <div className={`text-lg font-semibold ${kpiData.yesterday.change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.yesterday.change_pct >= 0 ? "+" : ""}{kpiData.yesterday.change_pct}% ({kpiData.yesterday.diff >= 0 ? "+" : ""}{formatNumber(kpiData.yesterday.diff)})
                            </div>
                          </div>
                        )}
                      </div>
                      {/* This Week */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">This Week</div>
                        <div className="text-7xl font-bold text-white">{formatNumber(kpiData?.this_week.value ?? 0)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(kpiData.this_week.py)}</div>
                            <div className={`text-lg font-semibold ${kpiData.this_week.change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.this_week.change_pct >= 0 ? "+" : ""}{kpiData.this_week.change_pct}% ({kpiData.this_week.diff >= 0 ? "+" : ""}{formatNumber(kpiData.this_week.diff)})
                            </div>
                          </div>
                        )}
                      </div>
                      {/* MTD */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">MTD</div>
                        <div className="text-7xl font-bold text-white">{formatNumber(kpiData?.mtd.value ?? 0)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(kpiData.mtd.py)}</div>
                            <div className={`text-lg font-semibold ${kpiData.mtd.change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.mtd.change_pct >= 0 ? "+" : ""}{kpiData.mtd.change_pct}% ({kpiData.mtd.diff >= 0 ? "+" : ""}{formatNumber(kpiData.mtd.diff)})
                            </div>
                          </div>
                        )}
                      </div>
                      {/* YTD */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">YTD</div>
                        <div className="text-7xl font-bold text-white">{formatNumber(kpiData?.ytd?.value ?? 0)}</div>
                        {kpiData?.ytd && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatNumber(kpiData.ytd.py)}</div>
                            <div className={`text-lg font-semibold ${kpiData.ytd.change_pct >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.ytd.change_pct >= 0 ? "+" : ""}{kpiData.ytd.change_pct}% ({kpiData.ytd.diff >= 0 ? "+" : ""}{formatNumber(kpiData.ytd.diff)})
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Weekly Trends Heatmap - Conversions */}
                {conversionTrends.weekly_trends.data[conversionSource] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-[#34C759]" />
                          Weekly Trends ({conversionSource === 'total' ? 'Total Conversions' : conversionSource.charAt(0).toUpperCase() + conversionSource.slice(1) + ' Conversions'})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Week</th>
                                {conversionTrends.weekly_trends.days.map((day) => (
                                  <th key={day} className="text-center py-3 px-1 font-semibold text-white whitespace-nowrap">{day}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white bg-[#34C759] whitespace-nowrap">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const days = conversionTrends.weekly_trends.days
                                const weekRows = conversionTrends.weekly_trends.data[conversionSource]
                                const allValues = weekRows.flatMap(week =>
                                  days.map(day => week.daily_cumulative[day]).filter((v): v is number => typeof v === 'number')
                                )
                                const maxValue = Math.max(...allValues, 1)

                                const getHeatmapClass = (value: number | null | undefined) => {
                                  if (value === null || value === undefined) return 'bg-[#1D1D1F]'
                                  const intensity = Math.round((value / maxValue) * 100)
                                  if (intensity > 80) return 'bg-green-600'
                                  if (intensity > 60) return 'bg-green-500'
                                  if (intensity > 40) return 'bg-green-600/60'
                                  if (intensity > 20) return 'bg-green-600/40'
                                  return 'bg-green-600/20'
                                }

                                return weekRows.map((week, idx) => {
                                  const isCurrentWeek = week.week_label === "Current Week"
                                  const cellBg = isCurrentWeek ? "bg-[#1A3A2A]" : "bg-[#1D1D1F]"
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{week.week_label}</div>
                                        <div className="text-xs text-white/40">{week.week_start}</div>
                                      </td>
                                      {days.map(day => {
                                        const value = week.daily_cumulative[day]
                                        return (
                                          <td
                                            key={day}
                                            className={`text-center py-3 px-1 ${getHeatmapClass(value)} ${value === null ? "text-white/20" : "text-white font-semibold"}`}
                                          >
                                            {value !== null && value !== undefined ? value.toLocaleString() : '-'}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${week.week_total === null ? "text-white/20" : "text-white"}`}>
                                        {week.week_total !== null ? week.week_total.toLocaleString() : '-'}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Monthly Trends Heatmap - Conversions */}
                {conversionTrends.monthly_trends.months.length > 0 && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-[#34C759]" />
                          Monthly Trends ({conversionSource === 'total' ? 'Total Conversions' : conversionSource.charAt(0).toUpperCase() + conversionSource.slice(1) + ' Conversions'})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Month</th>
                                {conversionTrends.monthly_trends.weeks.map((wk) => (
                                  <th key={wk} className="text-center py-3 px-3 font-semibold text-white whitespace-nowrap">{wk}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white bg-[#34C759] whitespace-nowrap">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const weeks = conversionTrends.monthly_trends.weeks
                                const monthRows = conversionTrends.monthly_trends.months
                                const allValues = monthRows.flatMap(row =>
                                  weeks.map(wk => row[conversionSource][wk]).filter((v): v is number => typeof v === 'number')
                                )
                                const maxValue = Math.max(...allValues, 1)

                                const getHeatmapClass = (value: number | null | undefined) => {
                                  if (value === null || value === undefined) return 'bg-[#1D1D1F]'
                                  const intensity = Math.round((value / maxValue) * 100)
                                  if (intensity > 80) return 'bg-green-600'
                                  if (intensity > 60) return 'bg-green-500'
                                  if (intensity > 40) return 'bg-green-600/60'
                                  if (intensity > 20) return 'bg-green-600/40'
                                  return 'bg-green-600/20'
                                }

                                const getSourceTotal = (row: TrafficTrendMonthRow): number => {
                                  if (conversionSource === 'total') return row.grand_total
                                  return row[`${conversionSource}_total` as keyof TrafficTrendMonthRow] as number
                                }

                                return monthRows.map((row, idx) => {
                                  const isCurrentMonth = row.row_label === "Current Month"
                                  const cellBg = isCurrentMonth ? "bg-[#1A3A2A]" : "bg-[#1D1D1F]"
                                  const sourceTotal = getSourceTotal(row)
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{row.row_label}</div>
                                        <div className="text-xs text-white/40">{row.month_label}</div>
                                      </td>
                                      {weeks.map(wk => {
                                        const value = row[conversionSource][wk]
                                        return (
                                          <td
                                            key={wk}
                                            className={`text-center py-3 px-3 ${getHeatmapClass(value)} ${value === null || value === undefined ? "text-white/20" : "text-white font-semibold"}`}
                                          >
                                            {value !== null && value !== undefined ? value.toLocaleString() : '-'}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${sourceTotal === 0 ? "text-white/20" : "text-white"}`}>
                                        {sourceTotal > 0 ? sourceTotal.toLocaleString() : '-'}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Monthly Conversion Trends */}
                {conversionTrends.monthly_trends.months.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#34C759]" />
                      Monthly Conversion Trends — {conversionSource === 'total' ? 'Total' : conversionSource.charAt(0).toUpperCase() + conversionSource.slice(1)}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Conversions by Month */}
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-[#1D1D1F]">
                            {conversionSource === 'total' ? 'Total' : conversionSource.charAt(0).toUpperCase() + conversionSource.slice(1)} Conversions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b-2 border-[#D2D2D7]">
                                  <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">Period</th>
                                  {conversionTrends.monthly_trends.weeks.map(wk => (
                                    <th key={wk} className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">{wk}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {conversionTrends.monthly_trends.months.map((row) => {
                                  const isCurrentMonth = row.row_label === "Current Month"
                                  const data = row[conversionSource]
                                  return (
                                    <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8FFF0]" : ""}`}>
                                      <td className="py-2 px-2">
                                        <div className="font-medium text-[#1D1D1F] text-xs">{row.row_label}</div>
                                        <div className="text-[10px] text-[#6E6E73]">{row.month_label}</div>
                                      </td>
                                      {conversionTrends.monthly_trends.weeks.map(wk => (
                                        <td key={wk} className="text-center py-2 px-2 text-[#1D1D1F] font-medium">
                                          {data[wk] !== null && data[wk] !== undefined ? data[wk]!.toLocaleString() : "—"}
                                        </td>
                                      ))}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Source Mix by Month */}
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-[#1D1D1F]">Conversion Source Mix By Month</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b-2 border-[#D2D2D7]">
                                  <th className="text-left py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">Period</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">Total</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">Organic %</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">Direct %</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">Referral %</th>
                                  <th className="text-center py-2 px-2 font-semibold text-[#6E6E73] uppercase text-[10px] tracking-wide">Paid %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {conversionTrends.monthly_trends.months.map((row) => {
                                  const isCurrentMonth = row.row_label === "Current Month"
                                  const gt = row.grand_total
                                  const orgPct = gt > 0 ? Math.round((row.organic_total / gt) * 100) : 0
                                  const dirPct = gt > 0 ? Math.round((row.direct_total / gt) * 100) : 0
                                  const refPct = gt > 0 ? Math.round((row.referral_total / gt) * 100) : 0
                                  const paidPct = gt > 0 ? Math.round((row.paid_total / gt) * 100) : 0
                                  return (
                                    <tr key={row.row_label} className={`border-b border-[#E5E5E5] ${isCurrentMonth ? "bg-[#E8FFF0]" : ""}`}>
                                      <td className="py-2 px-2">
                                        <div className="font-medium text-[#1D1D1F] text-xs">{row.row_label}</div>
                                        <div className="text-[10px] text-[#6E6E73]">{row.month_label}</div>
                                      </td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F] font-medium">{gt.toLocaleString()}</td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F]">{orgPct}%</td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F]">{dirPct}%</td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F]">{refPct}%</td>
                                      <td className="text-center py-2 px-2 text-[#1D1D1F]">{paidPct}%</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* YoY Conversions by Week */}
                {conversionTrends.weekly_yoy[conversionSource] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[#34C759]" />
                          {conversionSource === 'total' ? 'Total' : conversionSource.charAt(0).toUpperCase() + conversionSource.slice(1)} Conversions by Week
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6E6E73]">
                          Year-over-year comparison of weekly conversions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="h-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={conversionTrends.weekly_yoy[conversionSource]}
                              margin={{ top: 25, right: 30, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                              <XAxis dataKey="week_label" tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} interval={3} />
                              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => v.toLocaleString()} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                formatter={(value, name) => {
                                  if (value === null || value === undefined) return ['-', String(name)]
                                  const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                  return [Number(value).toLocaleString(), yearLabel]
                                }}
                              />
                              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                              <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 4 }} connectNulls name="y2024" />
                              <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }} connectNulls name="y2025" />
                              <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 5 }} connectNulls name="y2026" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* YoY Conversions by Month */}
                {conversionTrends.monthly_yoy[conversionSource] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#34C759]" />
                          {conversionSource === 'total' ? 'Total' : conversionSource.charAt(0).toUpperCase() + conversionSource.slice(1)} Conversions by Month
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6E6E73]">
                          Year-over-year comparison of monthly conversions (YTD)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="h-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={conversionTrends.monthly_yoy[conversionSource]}
                              margin={{ top: 25, right: 30, left: 20, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                              <XAxis dataKey="month_label" tick={{ fontSize: 13, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} />
                              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => v.toLocaleString()} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                formatter={(value, name) => {
                                  if (value === null || value === undefined) return ['-', String(name)]
                                  const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                  return [Number(value).toLocaleString(), yearLabel]
                                }}
                              />
                              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                              <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 5 }} connectNulls name="y2024" />
                              <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }} connectNulls name="y2025" />
                              <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 6 }} connectNulls name="y2026" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Cumulative Conversions by Week */}
                {conversionTrends.weekly_yoy[conversionSource] && (() => {
                  let cum2024 = 0, cum2025 = 0, cum2026 = 0
                  const cumData = conversionTrends.weekly_yoy[conversionSource].map(d => {
                    if (d.y2024 !== null) cum2024 += d.y2024
                    if (d.y2025 !== null) cum2025 += d.y2025
                    if (d.y2026 !== null) cum2026 += d.y2026
                    return { week_label: d.week_label, y2024: d.y2024 !== null ? cum2024 : null, y2025: d.y2025 !== null ? cum2025 : null, y2026: d.y2026 !== null ? cum2026 : null }
                  })
                  return (
                    <div className="mt-8">
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#34C759]" />
                            Cumulative {conversionSource === 'total' ? 'Total' : conversionSource.charAt(0).toUpperCase() + conversionSource.slice(1)} Conversions by Week
                          </CardTitle>
                          <CardDescription className="text-sm text-[#6E6E73]">
                            Year-over-year running total of weekly conversions
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={cumData} margin={{ top: 25, right: 30, left: 20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                                <XAxis dataKey="week_label" tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} interval={3} />
                                <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => v.toLocaleString()} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                  labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                  formatter={(value, name) => {
                                    if (value === null || value === undefined) return ['-', String(name)]
                                    const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                    return [Number(value).toLocaleString(), yearLabel]
                                  }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                                <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 3 }} connectNulls name="y2024" />
                                <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 3 }} connectNulls name="y2025" />
                                <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 5 }} connectNulls name="y2026" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}

                {/* Cumulative Conversions by Month */}
                {conversionTrends.monthly_yoy[conversionSource] && (() => {
                  let cum2024 = 0, cum2025 = 0, cum2026 = 0
                  const cumData = conversionTrends.monthly_yoy[conversionSource].map(d => {
                    if (d.y2024 !== null) cum2024 += d.y2024
                    if (d.y2025 !== null) cum2025 += d.y2025
                    if (d.y2026 !== null) cum2026 += d.y2026
                    return { month_label: d.month_label, y2024: d.y2024 !== null ? cum2024 : null, y2025: d.y2025 !== null ? cum2025 : null, y2026: d.y2026 !== null ? cum2026 : null }
                  })
                  return (
                    <div className="mt-8">
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#34C759]" />
                            Cumulative {conversionSource === 'total' ? 'Total' : conversionSource.charAt(0).toUpperCase() + conversionSource.slice(1)} Conversions by Month
                          </CardTitle>
                          <CardDescription className="text-sm text-[#6E6E73]">
                            Year-over-year running total of monthly conversions (YTD)
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={cumData} margin={{ top: 25, right: 30, left: 20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                                <XAxis dataKey="month_label" tick={{ fontSize: 13, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => v.toLocaleString()} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                  labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                  formatter={(value, name) => {
                                    if (value === null || value === undefined) return ['-', String(name)]
                                    const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                    return [Number(value).toLocaleString(), yearLabel]
                                  }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                                <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 5 }} connectNulls name="y2024" />
                                <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }} connectNulls name="y2025" />
                                <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 6 }} connectNulls name="y2026" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </>
            ) : (
              <div className="text-center text-[#6E6E73] py-12">
                No conversion data available
              </div>
            )}
            </>
            )}

            {/* Rate View */}
            {convView === 'rate' && (
            <>
            {(trafficLoading || conversionsLoading) && (!trafficTrends || !conversionTrends) ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#5856D6]" />
              </div>
            ) : trafficTrends && conversionTrends ? (
              <>
                {/* Conversion % KPI Cards */}
                {(() => {
                  const convKpi = conversionTrends?.kpi?.[convPctSource]
                  const trafKpi = trafficTrends?.kpi?.[convPctSource]
                  const calcPct = (conv: number, traf: number) => traf > 0 ? Math.round((conv / traf) * 1000) / 10 : 0
                  return (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Yesterday */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">Yesterday</div>
                        <div className="text-7xl font-bold text-white">{calcPct(convKpi?.yesterday.value ?? 0, trafKpi?.yesterday.value ?? 0).toFixed(1)}%</div>
                        {convKpi && trafKpi && (() => {
                          const curr = calcPct(convKpi.yesterday.value, trafKpi.yesterday.value)
                          const py = calcPct(convKpi.yesterday.py, trafKpi.yesterday.py)
                          const diff = curr - py
                          return (
                            <div className="mt-2 text-center">
                              <div className="text-base text-white/50 mb-0.5">Prior Year: {py.toFixed(1)}%</div>
                              <div className={`text-lg font-semibold ${diff >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                                {diff >= 0 ? "+" : ""}{diff.toFixed(1)}pp
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                      {/* This Week */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">This Week</div>
                        <div className="text-7xl font-bold text-white">{calcPct(convKpi?.this_week.value ?? 0, trafKpi?.this_week.value ?? 0).toFixed(1)}%</div>
                        {convKpi && trafKpi && (() => {
                          const curr = calcPct(convKpi.this_week.value, trafKpi.this_week.value)
                          const py = calcPct(convKpi.this_week.py, trafKpi.this_week.py)
                          const diff = curr - py
                          return (
                            <div className="mt-2 text-center">
                              <div className="text-base text-white/50 mb-0.5">Prior Year: {py.toFixed(1)}%</div>
                              <div className={`text-lg font-semibold ${diff >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                                {diff >= 0 ? "+" : ""}{diff.toFixed(1)}pp
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                      {/* MTD */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">MTD</div>
                        <div className="text-7xl font-bold text-white">{calcPct(convKpi?.mtd.value ?? 0, trafKpi?.mtd.value ?? 0).toFixed(1)}%</div>
                        {convKpi && trafKpi && (() => {
                          const curr = calcPct(convKpi.mtd.value, trafKpi.mtd.value)
                          const py = calcPct(convKpi.mtd.py, trafKpi.mtd.py)
                          const diff = curr - py
                          return (
                            <div className="mt-2 text-center">
                              <div className="text-base text-white/50 mb-0.5">Prior Year: {py.toFixed(1)}%</div>
                              <div className={`text-lg font-semibold ${diff >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                                {diff >= 0 ? "+" : ""}{diff.toFixed(1)}pp
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                      {/* YTD */}
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">YTD</div>
                        <div className="text-7xl font-bold text-white">{calcPct(convKpi?.ytd?.value ?? 0, trafKpi?.ytd?.value ?? 0).toFixed(1)}%</div>
                        {convKpi?.ytd && trafKpi?.ytd && (() => {
                          const curr = calcPct(convKpi.ytd.value, trafKpi.ytd.value)
                          const py = calcPct(convKpi.ytd.py, trafKpi.ytd.py)
                          const diff = curr - py
                          return (
                            <div className="mt-2 text-center">
                              <div className="text-base text-white/50 mb-0.5">Prior Year: {py.toFixed(1)}%</div>
                              <div className={`text-lg font-semibold ${diff >= 0 ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                                {diff >= 0 ? "+" : ""}{diff.toFixed(1)}pp
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })()}

                {/* Weekly Trends Heatmap - Conversion % */}
                {conversionTrends.weekly_trends.data[convPctSource] && trafficTrends.weekly_trends.data[convPctSource] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-[#5856D6]" />
                          Weekly Conversion % ({convPctSource === 'total' ? 'Total' : convPctSource.charAt(0).toUpperCase() + convPctSource.slice(1)})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Week</th>
                                {conversionTrends.weekly_trends.days.map((day) => (
                                  <th key={day} className="text-center py-3 px-1 font-semibold text-white whitespace-nowrap">{day}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white bg-[#5856D6] whitespace-nowrap">Avg</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const days = conversionTrends.weekly_trends.days
                                const convWeeks = conversionTrends.weekly_trends.data[convPctSource]
                                const trafWeeks = trafficTrends.weekly_trends.data[convPctSource]
                                const trafMap = new Map(trafWeeks.map(w => [w.week_label, w]))

                                const getHeatmapClass = (pct: number | null) => {
                                  if (pct === null) return 'bg-[#1D1D1F]'
                                  if (pct >= 8) return 'bg-purple-600'
                                  if (pct >= 6) return 'bg-purple-500'
                                  if (pct >= 4) return 'bg-purple-600/60'
                                  if (pct >= 2) return 'bg-purple-600/40'
                                  return 'bg-purple-600/20'
                                }

                                return convWeeks.map((week, idx) => {
                                  const trafWeek = trafMap.get(week.week_label)
                                  const isCurrentWeek = week.week_label === "Current Week"
                                  const cellBg = isCurrentWeek ? "bg-[#1A1A3A]" : "bg-[#1D1D1F]"
                                  const weekConvTotal = week.week_total ?? 0
                                  const weekTrafTotal = trafWeek?.week_total ?? 0
                                  const weekPct = weekTrafTotal > 0 ? Math.round((weekConvTotal / weekTrafTotal) * 1000) / 10 : null
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{week.week_label}</div>
                                        <div className="text-xs text-white/40">{week.week_start}</div>
                                      </td>
                                      {days.map(day => {
                                        const convVal = week.daily_cumulative[day]
                                        const trafVal = trafWeek?.daily_cumulative[day]
                                        const pct = (convVal !== null && convVal !== undefined && trafVal && trafVal > 0) ? Math.round((convVal / trafVal) * 1000) / 10 : null
                                        return (
                                          <td
                                            key={day}
                                            className={`text-center py-3 px-1 ${getHeatmapClass(pct)} ${pct === null ? "text-white/20" : "text-white font-semibold"}`}
                                          >
                                            {pct !== null ? `${pct.toFixed(1)}%` : '-'}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${weekPct === null ? "text-white/20" : "text-white"}`}>
                                        {weekPct !== null ? `${weekPct.toFixed(1)}%` : '-'}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Monthly Trends Heatmap - Conversion % */}
                {conversionTrends.monthly_trends.months.length > 0 && trafficTrends.monthly_trends.months.length > 0 && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-[#5856D6]" />
                          Monthly Conversion % ({convPctSource === 'total' ? 'Total' : convPctSource.charAt(0).toUpperCase() + convPctSource.slice(1)})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Month</th>
                                {conversionTrends.monthly_trends.weeks.map((wk) => (
                                  <th key={wk} className="text-center py-3 px-3 font-semibold text-white whitespace-nowrap">{wk}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white bg-[#5856D6] whitespace-nowrap">Avg</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const weeks = conversionTrends.monthly_trends.weeks
                                const convMonths = conversionTrends.monthly_trends.months
                                const trafMonths = trafficTrends.monthly_trends.months
                                const trafMap = new Map(trafMonths.map(m => [m.month_key, m]))

                                const getHeatmapClass = (pct: number | null) => {
                                  if (pct === null) return 'bg-[#1D1D1F]'
                                  if (pct >= 8) return 'bg-purple-600'
                                  if (pct >= 6) return 'bg-purple-500'
                                  if (pct >= 4) return 'bg-purple-600/60'
                                  if (pct >= 2) return 'bg-purple-600/40'
                                  return 'bg-purple-600/20'
                                }

                                return convMonths.map((row, idx) => {
                                  const trafRow = trafMap.get(row.month_key)
                                  const isCurrentMonth = row.row_label === "Current Month"
                                  const cellBg = isCurrentMonth ? "bg-[#1A1A3A]" : "bg-[#1D1D1F]"
                                  const convTotal = convPctSource === 'total' ? row.grand_total : (row[`${convPctSource}_total` as keyof TrafficTrendMonthRow] as number)
                                  const trafTotal = trafRow ? (convPctSource === 'total' ? trafRow.grand_total : (trafRow[`${convPctSource}_total` as keyof TrafficTrendMonthRow] as number)) : 0
                                  const monthPct = trafTotal > 0 ? Math.round((convTotal / trafTotal) * 1000) / 10 : null
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{row.row_label}</div>
                                        <div className="text-xs text-white/40">{row.month_label}</div>
                                      </td>
                                      {weeks.map(wk => {
                                        const convVal = row[convPctSource][wk]
                                        const trafVal = trafRow?.[convPctSource]?.[wk]
                                        const pct = (convVal !== null && convVal !== undefined && trafVal && trafVal > 0) ? Math.round((convVal / trafVal) * 1000) / 10 : null
                                        return (
                                          <td
                                            key={wk}
                                            className={`text-center py-3 px-3 ${getHeatmapClass(pct)} ${pct === null ? "text-white/20" : "text-white font-semibold"}`}
                                          >
                                            {pct !== null ? `${pct.toFixed(1)}%` : '-'}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${monthPct === null ? "text-white/20" : "text-white"}`}>
                                        {monthPct !== null ? `${monthPct.toFixed(1)}%` : '-'}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* YoY Conversion % by Week */}
                {conversionTrends.weekly_yoy[convPctSource] && trafficTrends.weekly_yoy[convPctSource] && (() => {
                  const convData = conversionTrends.weekly_yoy[convPctSource]
                  const trafData = trafficTrends.weekly_yoy[convPctSource]
                  const trafMap = new Map(trafData.map(d => [d.week_num ?? d.week_label, d]))
                  const pctData = convData.map(d => {
                    const t = trafMap.get(d.week_num ?? d.week_label)
                    return {
                      week_label: d.week_label,
                      y2024: (d.y2024 !== null && t?.y2024 && t.y2024 > 0) ? Math.round((d.y2024 / t.y2024) * 100) : null,
                      y2025: (d.y2025 !== null && t?.y2025 && t.y2025 > 0) ? Math.round((d.y2025 / t.y2025) * 100) : null,
                      y2026: (d.y2026 !== null && t?.y2026 && t.y2026 > 0) ? Math.round((d.y2026 / t.y2026) * 100) : null,
                    }
                  })
                  return (
                    <div className="mt-8">
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-[#5856D6]" />
                            {convPctSource === 'total' ? 'Total' : convPctSource.charAt(0).toUpperCase() + convPctSource.slice(1)} Conversion % by Week
                          </CardTitle>
                          <CardDescription className="text-sm text-[#6E6E73]">
                            Year-over-year comparison of weekly conversion rate
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={pctData} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                                <XAxis dataKey="week_label" tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} interval={3} />
                                <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                  labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                  formatter={(value, name) => {
                                    if (value === null || value === undefined) return ['-', String(name)]
                                    const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                    return [`${value}%`, yearLabel]
                                  }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                                <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 4 }} connectNulls name="y2024" />
                                <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }} connectNulls name="y2025" />
                                <Line type="monotone" dataKey="y2026" stroke="#5856D6" strokeWidth={3} dot={{ fill: '#5856D6', strokeWidth: 2, r: 5 }} connectNulls name="y2026" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}

                {/* YoY Conversion % by Month */}
                {conversionTrends.monthly_yoy[convPctSource] && trafficTrends.monthly_yoy[convPctSource] && (() => {
                  const convData = conversionTrends.monthly_yoy[convPctSource]
                  const trafData = trafficTrends.monthly_yoy[convPctSource]
                  const trafMap = new Map(trafData.map(d => [d.month_num ?? d.month_label, d]))
                  const pctData = convData.map(d => {
                    const t = trafMap.get(d.month_num ?? d.month_label)
                    return {
                      month_label: d.month_label,
                      y2024: (d.y2024 !== null && t?.y2024 && t.y2024 > 0) ? Math.round((d.y2024 / t.y2024) * 100) : null,
                      y2025: (d.y2025 !== null && t?.y2025 && t.y2025 > 0) ? Math.round((d.y2025 / t.y2025) * 100) : null,
                      y2026: (d.y2026 !== null && t?.y2026 && t.y2026 > 0) ? Math.round((d.y2026 / t.y2026) * 100) : null,
                    }
                  })
                  return (
                    <div className="mt-8">
                      <Card className="bg-white border-[#D2D2D7] shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#5856D6]" />
                            {convPctSource === 'total' ? 'Total' : convPctSource.charAt(0).toUpperCase() + convPctSource.slice(1)} Conversion % by Month
                          </CardTitle>
                          <CardDescription className="text-sm text-[#6E6E73]">
                            Year-over-year comparison of monthly conversion rate
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="h-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={pctData} margin={{ top: 25, right: 30, left: 20, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                                <XAxis dataKey="month_label" tick={{ fontSize: 13, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }}
                                  labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }}
                                  formatter={(value, name) => {
                                    if (value === null || value === undefined) return ['-', String(name)]
                                    const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'
                                    return [`${value}%`, yearLabel]
                                  }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                                <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 5 }} connectNulls name="y2024" />
                                <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }} connectNulls name="y2025" />
                                <Line type="monotone" dataKey="y2026" stroke="#5856D6" strokeWidth={3} dot={{ fill: '#5856D6', strokeWidth: 2, r: 6 }} connectNulls name="y2026" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </>
            ) : (
              <div className="text-center text-[#6E6E73] py-12">
                No data available — both traffic and conversion data are required
              </div>
            )}
            </>
            )}
          </>
        )}

        {/* Google Ads Tab */}
        {activeTab === "google-ads" && (
          <>
            {/* Google Ads View + Metric Toggle */}
            <div className="flex flex-wrap gap-2 mb-6 sticky top-[108px] z-[5] bg-[#F5F5F7] py-3 -mt-3">
              {/* View mode pills */}
              {([
                { key: 'summary' as const, label: 'Summary', color: '#1D1D1F' },
                { key: 'cpc' as const, label: 'CPC Optimizer', color: '#10B981' },
                { key: 'age' as const, label: 'Age Analysis', color: '#8B5CF6' },
                { key: 'assets' as const, label: 'Asset Performance', color: '#F59E0B' },
              ]).map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => { setGadsView(key); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    gadsView === key
                      ? 'text-white shadow-md'
                      : 'bg-white text-[#6E6E73] border border-[#D2D2D7] hover:border-[#8E8E93]'
                  }`}
                  style={gadsView === key ? { backgroundColor: color } : {}}
                >
                  {label}
                </button>
              ))}
              {/* Separator */}
              <div className="w-px bg-[#D2D2D7] mx-1 self-stretch" />
              {/* Metric pills */}
              {(Object.keys(ADS_METRIC_LABELS) as AdsMetric[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setGadsView(null); setGadsMetric(key); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    gadsView === null && gadsMetric === key
                      ? 'text-white shadow-md'
                      : 'bg-white text-[#6E6E73] border border-[#D2D2D7] hover:border-[#8E8E93]'
                  }`}
                  style={gadsView === null && gadsMetric === key ? { backgroundColor: ADS_METRIC_COLORS[key] } : {}}
                >
                  {ADS_METRIC_LABELS[key]}
                </button>
              ))}
            </div>

            {/* Summary / CPC / Age views */}
            {gadsView === 'summary' && <GadsSummaryTab />}
            {gadsView === 'cpc' && <GadsCPCTab />}
            {gadsView === 'age' && <GadsAgeTab />}
            {gadsView === 'assets' && <GadsAssetTab />}

            {/* Metric view (existing KPI + heatmaps + YoY) */}
            {gadsView === null && (
            <>
            {googleAdsLoading && !gadsTrends ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
              </div>
            ) : gadsTrends ? (
              <>
                {/* GADS KPI Cards */}
                {(() => {
                  const kpiData = gadsTrends.kpi?.[gadsMetric]
                  return (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">Yesterday</div>
                        <div className="text-7xl font-bold text-white">{formatAdsValue(kpiData?.yesterday.value ?? 0, gadsMetric)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatAdsValue(kpiData.yesterday.py, gadsMetric)}</div>
                            <div className={`text-lg font-semibold ${isAdsChangePositive(gadsMetric, kpiData.yesterday.change_pct) ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.yesterday.change_pct >= 0 ? "+" : ""}{kpiData.yesterday.change_pct}% ({formatAdsDiff(kpiData.yesterday.diff, gadsMetric)})
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">This Week</div>
                        <div className="text-7xl font-bold text-white">{formatAdsValue(kpiData?.this_week.value ?? 0, gadsMetric)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatAdsValue(kpiData.this_week.py, gadsMetric)}</div>
                            <div className={`text-lg font-semibold ${isAdsChangePositive(gadsMetric, kpiData.this_week.change_pct) ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.this_week.change_pct >= 0 ? "+" : ""}{kpiData.this_week.change_pct}% ({formatAdsDiff(kpiData.this_week.diff, gadsMetric)})
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">MTD</div>
                        <div className="text-7xl font-bold text-white">{formatAdsValue(kpiData?.mtd.value ?? 0, gadsMetric)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatAdsValue(kpiData.mtd.py, gadsMetric)}</div>
                            <div className={`text-lg font-semibold ${isAdsChangePositive(gadsMetric, kpiData.mtd.change_pct) ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.mtd.change_pct >= 0 ? "+" : ""}{kpiData.mtd.change_pct}% ({formatAdsDiff(kpiData.mtd.diff, gadsMetric)})
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">YTD</div>
                        <div className="text-7xl font-bold text-white">{formatAdsValue(kpiData?.ytd?.value ?? 0, gadsMetric)}</div>
                        {kpiData?.ytd && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatAdsValue(kpiData.ytd.py, gadsMetric)}</div>
                            <div className={`text-lg font-semibold ${isAdsChangePositive(gadsMetric, kpiData.ytd.change_pct) ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.ytd.change_pct >= 0 ? "+" : ""}{kpiData.ytd.change_pct}% ({formatAdsDiff(kpiData.ytd.diff, gadsMetric)})
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* GADS Weekly Trends Heatmap */}
                {gadsTrends.weekly_trends.data[gadsMetric] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5" style={{ color: ADS_METRIC_COLORS[gadsMetric] }} />
                          Weekly Trends ({ADS_METRIC_LABELS[gadsMetric]})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Week</th>
                                {gadsTrends.weekly_trends.days.map((day) => (
                                  <th key={day} className="text-center py-3 px-1 font-semibold text-white whitespace-nowrap">{day}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white whitespace-nowrap" style={{ backgroundColor: ADS_METRIC_COLORS[gadsMetric] }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const days = gadsTrends.weekly_trends.days
                                const weekRows = gadsTrends.weekly_trends.data[gadsMetric]
                                const allValues = weekRows.flatMap(week =>
                                  days.map(day => week.daily_cumulative[day]).filter((v): v is number => typeof v === 'number')
                                )
                                const maxValue = Math.max(...allValues, 1)
                                const getHeatmapClass = (value: number | null | undefined) => {
                                  if (value === null || value === undefined) return 'bg-[#1D1D1F]'
                                  const intensity = Math.round((value / maxValue) * 100)
                                  if (intensity > 80) return 'bg-blue-600'
                                  if (intensity > 60) return 'bg-blue-500'
                                  if (intensity > 40) return 'bg-blue-600/60'
                                  if (intensity > 20) return 'bg-blue-600/40'
                                  return 'bg-blue-600/20'
                                }
                                return weekRows.map((week, idx) => {
                                  const isCurrentWeek = week.week_label === "Current Week"
                                  const cellBg = isCurrentWeek ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{week.week_label}</div>
                                        <div className="text-xs text-white/40">{week.week_start}</div>
                                      </td>
                                      {days.map(day => {
                                        const value = week.daily_cumulative[day]
                                        return (
                                          <td key={day} className={`text-center py-3 px-1 ${getHeatmapClass(value)} ${value === null ? "text-white/20" : "text-white font-semibold"}`}>
                                            {formatAdsValue(value, gadsMetric)}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${week.week_total === null ? "text-white/20" : "text-white"}`}>
                                        {formatAdsValue(week.week_total, gadsMetric)}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* GADS Monthly Trends Heatmap */}
                {gadsTrends.monthly_trends.months.length > 0 && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5" style={{ color: ADS_METRIC_COLORS[gadsMetric] }} />
                          Monthly Trends ({ADS_METRIC_LABELS[gadsMetric]})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Month</th>
                                {gadsTrends.monthly_trends.weeks.map((wk) => (
                                  <th key={wk} className="text-center py-3 px-3 font-semibold text-white whitespace-nowrap">{wk}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white whitespace-nowrap" style={{ backgroundColor: ADS_METRIC_COLORS[gadsMetric] }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const weeks = gadsTrends.monthly_trends.weeks
                                const monthRows = gadsTrends.monthly_trends.months
                                const metricData = monthRows.map(row => row[gadsMetric] as Record<string, number | null>)
                                const allValues = metricData.flatMap(d => d ? Object.values(d).filter((v): v is number => typeof v === 'number') : [])
                                const maxValue = Math.max(...allValues, 1)
                                const getHeatmapClass = (value: number | null | undefined) => {
                                  if (value === null || value === undefined) return 'bg-[#1D1D1F]'
                                  const intensity = Math.round((value / maxValue) * 100)
                                  if (intensity > 80) return 'bg-blue-600'
                                  if (intensity > 60) return 'bg-blue-500'
                                  if (intensity > 40) return 'bg-blue-600/60'
                                  if (intensity > 20) return 'bg-blue-600/40'
                                  return 'bg-blue-600/20'
                                }
                                return monthRows.map((row, idx) => {
                                  const isCurrentMonth = row.row_label === "Current Month"
                                  const cellBg = isCurrentMonth ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                                  const data = row[gadsMetric] as Record<string, number | null> | undefined
                                  const total = row[`${gadsMetric}_total`] as number ?? 0
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{row.row_label as string}</div>
                                        <div className="text-xs text-white/40">{row.month_label as string}</div>
                                      </td>
                                      {weeks.map(wk => {
                                        const value = data ? data[wk] : null
                                        return (
                                          <td key={wk} className={`text-center py-3 px-3 ${getHeatmapClass(value)} ${value === null || value === undefined ? "text-white/20" : "text-white font-semibold"}`}>
                                            {formatAdsValue(value, gadsMetric)}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${total === 0 ? "text-white/20" : "text-white"}`}>
                                        {formatAdsValue(total > 0 ? total : null, gadsMetric)}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* GADS YoY by Week */}
                {gadsTrends.weekly_yoy[gadsMetric] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" style={{ color: ADS_METRIC_COLORS[gadsMetric] }} />
                          Google Ads {ADS_METRIC_LABELS[gadsMetric]} by Week
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6E6E73]">Year-over-year comparison</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="h-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={gadsTrends.weekly_yoy[gadsMetric]} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                              <XAxis dataKey="week_label" tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} interval={3} />
                              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => (gadsMetric === 'avg_cpc' || gadsMetric === 'cost_per_conv' || gadsMetric === 'spend') ? `$${v.toLocaleString()}` : v.toLocaleString()} />
                              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }} labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }} formatter={(value, name) => { if (value === null || value === undefined) return ['-', String(name)]; const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'; return [formatAdsValue(Number(value), gadsMetric), yearLabel] }} />
                              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                              <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 4 }} connectNulls name="y2024" />
                              <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }} connectNulls name="y2025" />
                              <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 5 }} connectNulls name="y2026" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* GADS YoY by Month */}
                {gadsTrends.monthly_yoy[gadsMetric] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-4 w-4" style={{ color: ADS_METRIC_COLORS[gadsMetric] }} />
                          Google Ads {ADS_METRIC_LABELS[gadsMetric]} by Month
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6E6E73]">Year-over-year comparison (YTD)</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="h-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={gadsTrends.monthly_yoy[gadsMetric]} margin={{ top: 25, right: 30, left: 20, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                              <XAxis dataKey="month_label" tick={{ fontSize: 13, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} />
                              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => (gadsMetric === 'avg_cpc' || gadsMetric === 'cost_per_conv' || gadsMetric === 'spend') ? `$${v.toLocaleString()}` : v.toLocaleString()} />
                              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }} labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }} formatter={(value, name) => { if (value === null || value === undefined) return ['-', String(name)]; const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'; return [formatAdsValue(Number(value), gadsMetric), yearLabel] }} />
                              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                              <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 5 }} connectNulls name="y2024" />
                              <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }} connectNulls name="y2025" />
                              <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 6 }} connectNulls name="y2026" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="h-12 w-12 text-[#D2D2D7] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">No Google Ads Data</h3>
                  <p className="text-[#6E6E73]">Google Ads trend data is not available</p>
                </div>
              </div>
            )}
            </>
            )}
          </>
        )}

        {/* Bing Ads Tab */}
        {activeTab === "bing-ads" && (
          <>
            {/* Bing Ads View + Metric Toggle */}
            <div className="flex flex-wrap gap-2 mb-6 sticky top-[108px] z-[5] bg-[#F5F5F7] py-3 -mt-3">
              {/* View mode pills */}
              {([
                { key: 'summary' as const, label: 'Summary', color: '#1D1D1F' },
                { key: 'cpc' as const, label: 'CPC Optimizer', color: '#10B981' },
              ]).map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => { setBingView(key); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    bingView === key
                      ? 'text-white shadow-md'
                      : 'bg-white text-[#6E6E73] border border-[#D2D2D7] hover:border-[#8E8E93]'
                  }`}
                  style={bingView === key ? { backgroundColor: color } : {}}
                >
                  {label}
                </button>
              ))}
              {/* Separator */}
              <div className="w-px bg-[#D2D2D7] mx-1 self-stretch" />
              {/* Metric pills */}
              {(Object.keys(ADS_METRIC_LABELS) as AdsMetric[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { setBingView(null); setBingMetric(key); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    bingView === null && bingMetric === key
                      ? 'text-white shadow-md'
                      : 'bg-white text-[#6E6E73] border border-[#D2D2D7] hover:border-[#8E8E93]'
                  }`}
                  style={bingView === null && bingMetric === key ? { backgroundColor: ADS_METRIC_COLORS[key] } : {}}
                >
                  {ADS_METRIC_LABELS[key]}
                </button>
              ))}
            </div>

            {/* Summary / CPC views */}
            {bingView === 'summary' && <BingSummaryTab />}
            {bingView === 'cpc' && <BingCPCTab />}

            {/* Metric view (existing KPI + heatmaps + YoY) */}
            {bingView === null && (
            <>
            {bingAdsLoading && !bingTrends ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#0066CC]" />
              </div>
            ) : bingTrends ? (
              <>
                {/* Bing KPI Cards */}
                {(() => {
                  const kpiData = bingTrends.kpi?.[bingMetric]
                  return (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">Yesterday</div>
                        <div className="text-7xl font-bold text-white">{formatAdsValue(kpiData?.yesterday.value ?? 0, bingMetric)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatAdsValue(kpiData.yesterday.py, bingMetric)}</div>
                            <div className={`text-lg font-semibold ${isAdsChangePositive(bingMetric, kpiData.yesterday.change_pct) ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.yesterday.change_pct >= 0 ? "+" : ""}{kpiData.yesterday.change_pct}% ({formatAdsDiff(kpiData.yesterday.diff, bingMetric)})
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">This Week</div>
                        <div className="text-7xl font-bold text-white">{formatAdsValue(kpiData?.this_week.value ?? 0, bingMetric)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatAdsValue(kpiData.this_week.py, bingMetric)}</div>
                            <div className={`text-lg font-semibold ${isAdsChangePositive(bingMetric, kpiData.this_week.change_pct) ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.this_week.change_pct >= 0 ? "+" : ""}{kpiData.this_week.change_pct}% ({formatAdsDiff(kpiData.this_week.diff, bingMetric)})
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">MTD</div>
                        <div className="text-7xl font-bold text-white">{formatAdsValue(kpiData?.mtd.value ?? 0, bingMetric)}</div>
                        {kpiData && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatAdsValue(kpiData.mtd.py, bingMetric)}</div>
                            <div className={`text-lg font-semibold ${isAdsChangePositive(bingMetric, kpiData.mtd.change_pct) ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.mtd.change_pct >= 0 ? "+" : ""}{kpiData.mtd.change_pct}% ({formatAdsDiff(kpiData.mtd.diff, bingMetric)})
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="rounded-2xl bg-gradient-to-br from-[#1D1D1F] to-[#2D2D2F] p-6 shadow-lg border-0 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="text-lg font-medium text-white/70 mb-1">YTD</div>
                        <div className="text-7xl font-bold text-white">{formatAdsValue(kpiData?.ytd?.value ?? 0, bingMetric)}</div>
                        {kpiData?.ytd && (
                          <div className="mt-2 text-center">
                            <div className="text-base text-white/50 mb-0.5">Prior Year: {formatAdsValue(kpiData.ytd.py, bingMetric)}</div>
                            <div className={`text-lg font-semibold ${isAdsChangePositive(bingMetric, kpiData.ytd.change_pct) ? "text-[#34C759]" : "text-[#FF6B6B]"}`}>
                              {kpiData.ytd.change_pct >= 0 ? "+" : ""}{kpiData.ytd.change_pct}% ({formatAdsDiff(kpiData.ytd.diff, bingMetric)})
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Bing Weekly Trends Heatmap */}
                {bingTrends.weekly_trends.data[bingMetric] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5" style={{ color: ADS_METRIC_COLORS[bingMetric] }} />
                          Weekly Trends ({ADS_METRIC_LABELS[bingMetric]})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Week</th>
                                {bingTrends.weekly_trends.days.map((day) => (
                                  <th key={day} className="text-center py-3 px-1 font-semibold text-white whitespace-nowrap">{day}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white whitespace-nowrap" style={{ backgroundColor: ADS_METRIC_COLORS[bingMetric] }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const days = bingTrends.weekly_trends.days
                                const weekRows = bingTrends.weekly_trends.data[bingMetric]
                                const allValues = weekRows.flatMap(week =>
                                  days.map(day => week.daily_cumulative[day]).filter((v): v is number => typeof v === 'number')
                                )
                                const maxValue = Math.max(...allValues, 1)
                                const getHeatmapClass = (value: number | null | undefined) => {
                                  if (value === null || value === undefined) return 'bg-[#1D1D1F]'
                                  const intensity = Math.round((value / maxValue) * 100)
                                  if (intensity > 80) return 'bg-blue-600'
                                  if (intensity > 60) return 'bg-blue-500'
                                  if (intensity > 40) return 'bg-blue-600/60'
                                  if (intensity > 20) return 'bg-blue-600/40'
                                  return 'bg-blue-600/20'
                                }
                                return weekRows.map((week, idx) => {
                                  const isCurrentWeek = week.week_label === "Current Week"
                                  const cellBg = isCurrentWeek ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{week.week_label}</div>
                                        <div className="text-xs text-white/40">{week.week_start}</div>
                                      </td>
                                      {days.map(day => {
                                        const value = week.daily_cumulative[day]
                                        return (
                                          <td key={day} className={`text-center py-3 px-1 ${getHeatmapClass(value)} ${value === null ? "text-white/20" : "text-white font-semibold"}`}>
                                            {formatAdsValue(value, bingMetric)}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${week.week_total === null ? "text-white/20" : "text-white"}`}>
                                        {formatAdsValue(week.week_total, bingMetric)}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Bing Monthly Trends Heatmap */}
                {bingTrends.monthly_trends.months.length > 0 && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-5 w-5" style={{ color: ADS_METRIC_COLORS[bingMetric] }} />
                          Monthly Trends ({ADS_METRIC_LABELS[bingMetric]})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full text-lg bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="text-left py-3 px-3 font-bold text-white sticky left-0 bg-[#1D1D1F] min-w-[120px]">Month</th>
                                {bingTrends.monthly_trends.weeks.map((wk) => (
                                  <th key={wk} className="text-center py-3 px-3 font-semibold text-white whitespace-nowrap">{wk}</th>
                                ))}
                                <th className="text-center py-3 px-3 font-bold text-white whitespace-nowrap" style={{ backgroundColor: ADS_METRIC_COLORS[bingMetric] }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const weeks = bingTrends.monthly_trends.weeks
                                const monthRows = bingTrends.monthly_trends.months
                                const metricData = monthRows.map(row => row[bingMetric] as Record<string, number | null>)
                                const allValues = metricData.flatMap(d => d ? Object.values(d).filter((v): v is number => typeof v === 'number') : [])
                                const maxValue = Math.max(...allValues, 1)
                                const getHeatmapClass = (value: number | null | undefined) => {
                                  if (value === null || value === undefined) return 'bg-[#1D1D1F]'
                                  const intensity = Math.round((value / maxValue) * 100)
                                  if (intensity > 80) return 'bg-blue-600'
                                  if (intensity > 60) return 'bg-blue-500'
                                  if (intensity > 40) return 'bg-blue-600/60'
                                  if (intensity > 20) return 'bg-blue-600/40'
                                  return 'bg-blue-600/20'
                                }
                                return monthRows.map((row, idx) => {
                                  const isCurrentMonth = row.row_label === "Current Month"
                                  const cellBg = isCurrentMonth ? "bg-[#1A3A52]" : "bg-[#1D1D1F]"
                                  const data = row[bingMetric] as Record<string, number | null> | undefined
                                  const total = row[`${bingMetric}_total`] as number ?? 0
                                  return (
                                    <tr key={idx} className="border-b border-white/5">
                                      <td className={`py-3 px-3 sticky left-0 ${cellBg}`}>
                                        <div className="font-semibold text-white">{row.row_label as string}</div>
                                        <div className="text-xs text-white/40">{row.month_label as string}</div>
                                      </td>
                                      {weeks.map(wk => {
                                        const value = data ? data[wk] : null
                                        return (
                                          <td key={wk} className={`text-center py-3 px-3 ${getHeatmapClass(value)} ${value === null || value === undefined ? "text-white/20" : "text-white font-semibold"}`}>
                                            {formatAdsValue(value, bingMetric)}
                                          </td>
                                        )
                                      })}
                                      <td className={`text-center py-3 px-3 font-bold bg-[#2D2D2F] ${total === 0 ? "text-white/20" : "text-white"}`}>
                                        {formatAdsValue(total > 0 ? total : null, bingMetric)}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Bing YoY by Week */}
                {bingTrends.weekly_yoy[bingMetric] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" style={{ color: ADS_METRIC_COLORS[bingMetric] }} />
                          Bing Ads {ADS_METRIC_LABELS[bingMetric]} by Week
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6E6E73]">Year-over-year comparison</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="h-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={bingTrends.weekly_yoy[bingMetric]} margin={{ top: 25, right: 30, left: 10, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                              <XAxis dataKey="week_label" tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} interval={3} />
                              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => (bingMetric === 'avg_cpc' || bingMetric === 'cost_per_conv' || bingMetric === 'spend') ? `$${v.toLocaleString()}` : v.toLocaleString()} />
                              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }} labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }} formatter={(value, name) => { if (value === null || value === undefined) return ['-', String(name)]; const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'; return [formatAdsValue(Number(value), bingMetric), yearLabel] }} />
                              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                              <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 4 }} connectNulls name="y2024" />
                              <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }} connectNulls name="y2025" />
                              <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 5 }} connectNulls name="y2026" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Bing YoY by Month */}
                {bingTrends.monthly_yoy[bingMetric] && (
                  <div className="mt-8">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
                          <Calendar className="h-4 w-4" style={{ color: ADS_METRIC_COLORS[bingMetric] }} />
                          Bing Ads {ADS_METRIC_LABELS[bingMetric]} by Month
                        </CardTitle>
                        <CardDescription className="text-sm text-[#6E6E73]">Year-over-year comparison (YTD)</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="h-[500px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={bingTrends.monthly_yoy[bingMetric]} margin={{ top: 25, right: 30, left: 20, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                              <XAxis dataKey="month_label" tick={{ fontSize: 13, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} />
                              <YAxis tick={{ fontSize: 12, fill: '#6E6E73' }} tickLine={{ stroke: '#D2D2D7' }} axisLine={{ stroke: '#D2D2D7' }} tickFormatter={(v) => (bingMetric === 'avg_cpc' || bingMetric === 'cost_per_conv' || bingMetric === 'spend') ? `$${v.toLocaleString()}` : v.toLocaleString()} />
                              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #D2D2D7', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: 14 }} labelStyle={{ color: '#1D1D1F', fontWeight: 600, fontSize: 14 }} formatter={(value, name) => { if (value === null || value === undefined) return ['-', String(name)]; const yearLabel = name === 'y2024' ? '2024' : name === 'y2025' ? '2025' : '2026'; return [formatAdsValue(Number(value), bingMetric), yearLabel] }} />
                              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 13 }} formatter={(v: string) => v === 'y2024' ? '2024' : v === 'y2025' ? '2025' : v === 'y2026' ? '2026' : v} />
                              <Line type="monotone" dataKey="y2024" stroke="#8E8E93" strokeWidth={2} dot={{ fill: '#8E8E93', strokeWidth: 2, r: 5 }} connectNulls name="y2024" />
                              <Line type="monotone" dataKey="y2025" stroke="#0066CC" strokeWidth={2} dot={{ fill: '#0066CC', strokeWidth: 2, r: 5 }} connectNulls name="y2025" />
                              <Line type="monotone" dataKey="y2026" stroke="#34C759" strokeWidth={3} dot={{ fill: '#34C759', strokeWidth: 2, r: 6 }} connectNulls name="y2026" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="h-12 w-12 text-[#D2D2D7] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">No Bing Ads Data</h3>
                  <p className="text-[#6E6E73]">Bing Ads trend data is not available</p>
                </div>
              </div>
            )}
            </>
            )}
          </>
        )}


        {/* Other Reports Hub */}
        {activeSection === "reports" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Jedi Council",
                description: "Multi-agent AI analysis with Claude, GPT-4o, and Gemini",
                icon: Sparkles,
                href: "https://jedi-council-zeta.vercel.app",
                external: true,
                gradient: "from-purple-500 to-indigo-500",
              },
              {
                title: "The Prophet",
                description: "Sales forecasting and predictive analytics",
                icon: Brain,
                href: "/data",
                external: false,
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                title: "Live Help",
                description: "Real-time room status and availability",
                icon: Users,
                href: "/live-help",
                external: false,
                gradient: "from-green-500 to-emerald-500",
              },
              {
                title: "P&L Recap",
                description: "Monthly profit and loss reports",
                icon: DollarSign,
                href: "/recap",
                external: false,
                gradient: "from-orange-500 to-amber-500",
              },
            ].map((card) => {
              const CardIcon = card.icon
              return (
                <a
                  key={card.title}
                  href={card.href}
                  {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group bg-white rounded-xl border border-[#D2D2D7] shadow-sm hover:shadow-md transition-all p-6 flex flex-col gap-4"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                    <CardIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-[#6E6E73] mt-1">{card.description}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-sm font-medium text-[#0066CC]">
                    <span>Open</span>
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {/* SEO Rank Tracker Tab */}
        {activeTab === "seo-rankings" && (
          <>
            {awrLoading && !awrRankings ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#6E6E73]" />
              </div>
            ) : awrRankings ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-[#86868B] uppercase">Visibility</p>
                      <p className="text-2xl font-bold text-[#1D1D1F] mt-1">{awrRankings.summary.visibility_percent}%</p>
                      <p className={`text-xs mt-1 ${awrRankings.summary.visibility_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {awrRankings.summary.visibility_change >= 0 ? '+' : ''}{awrRankings.summary.visibility_change}% vs prev
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-[#86868B] uppercase">Avg Rank</p>
                      <p className="text-2xl font-bold text-[#1D1D1F] mt-1">{awrRankings.summary.average_rank}</p>
                      <p className={`text-xs mt-1 ${awrRankings.summary.average_rank_change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {awrRankings.summary.average_rank_change > 0 ? '+' : ''}{awrRankings.summary.average_rank_change} positions
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-[#86868B] uppercase">Top 3</p>
                      <p className="text-2xl font-bold text-[#1D1D1F] mt-1">{awrRankings.summary.top3}<span className="text-base text-[#86868B]">/{awrRankings.summary.total_keywords}</span></p>
                      <p className="text-xs mt-1 text-[#86868B]">{((awrRankings.summary.top3 / awrRankings.summary.total_keywords) * 100).toFixed(0)}% of keywords</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-[#86868B] uppercase">First Place</p>
                      <p className="text-2xl font-bold text-[#1D1D1F] mt-1">{awrRankings.summary.first_place}</p>
                      <p className={`text-xs mt-1 ${awrRankings.summary.first_place_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {awrRankings.summary.first_place_change >= 0 ? '+' : ''}{awrRankings.summary.first_place_change} vs prev
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white border-[#D2D2D7] shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xl font-semibold text-[#1D1D1F] flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-[#0A84FF]" />
                      Keyword Rankings
                    </CardTitle>
                    <p className="text-sm text-[#6E6E73]">{awrRankings.search_engine} &bull; {awrRankings.snapshot_date}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-xl">
                      <table className="w-full bg-[#1D1D1F]">
                        <thead>
                          <tr className="border-b border-[#3D3D3F]">
                            {[
                              { key: 'keyword', label: 'Keyword' },
                              { key: 'position', label: 'Pos' },
                              { key: 'position_change', label: 'Chg' },
                              { key: 'search_volume', label: 'Volume' },
                              { key: 'cpc', label: 'CPC' },
                              { key: 'estimated_visits', label: 'Est. Visits' },
                              { key: 'traffic_cost', label: 'Traffic Cost' },
                            ].map(col => (
                              <th
                                key={col.key}
                                onClick={() => {
                                  if (awrSortField === col.key) setAwrSortDir(d => d === 'asc' ? 'desc' : 'asc')
                                  else { setAwrSortField(col.key); setAwrSortDir(col.key === 'keyword' ? 'asc' : 'desc') }
                                }}
                                className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white transition-colors"
                              >
                                {col.label} {awrSortField === col.key && (awrSortDir === 'asc' ? '↑' : '↓')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {awrRankings.keywords
                            .slice()
                            .sort((a: any, b: any) => {
                              const parseCurr = (v: string) => parseFloat(v.replace(/[$,]/g, '')) || 0
                              let aV: any, bV: any
                              switch (awrSortField) {
                                case 'keyword': aV = a.keyword; bV = b.keyword; break
                                case 'cpc': aV = parseCurr(a.cpc); bV = parseCurr(b.cpc); break
                                case 'traffic_cost': aV = parseCurr(a.traffic_cost); bV = parseCurr(b.traffic_cost); break
                                default: aV = a[awrSortField]; bV = b[awrSortField]
                              }
                              if (typeof aV === 'string') return awrSortDir === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV)
                              return awrSortDir === 'asc' ? aV - bV : bV - aV
                            })
                            .map((kw: any) => (
                              <tr key={kw.keyword} className="border-b border-[#2D2D2F] hover:bg-[#2A2A2C] transition-colors">
                                <td className="px-3 py-2.5">
                                  <span className="text-sm font-medium text-white">{kw.keyword}</span>
                                  <div className="text-xs text-gray-500">{kw.search_intent?.join(' · ')}</div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                    kw.position === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                    kw.position <= 3 ? 'bg-green-500/20 text-green-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>{kw.position}</span>
                                </td>
                                <td className="px-3 py-2.5">
                                  {kw.position_change > 0 ? (
                                    <span className="text-green-400 text-sm flex items-center gap-0.5"><ArrowUp className="h-3 w-3" />+{kw.position_change}</span>
                                  ) : kw.position_change < 0 ? (
                                    <span className="text-red-400 text-sm flex items-center gap-0.5"><ArrowDown className="h-3 w-3" />{kw.position_change}</span>
                                  ) : (
                                    <span className="text-gray-500 text-sm"><Minus className="h-3 w-3 inline" /> 0</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{kw.search_volume?.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{kw.cpc}</td>
                                <td className="px-3 py-2.5 text-sm font-medium text-white">{kw.estimated_visits?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="px-3 py-2.5 text-sm text-emerald-400">{kw.traffic_cost}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </>
        )}

        {/* SEO AI Search Tab */}
        {activeTab === "seo-ai-search" && (
          <>
            {awrLoading && !awrVisibility ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#6E6E73]" />
              </div>
            ) : awrVisibility ? (() => {
              const chatgpt = awrVisibility.search_engines?.find((e: any) => e.short_name === 'ChatGPT')
              const aioD = awrVisibility.search_engines?.find((e: any) => e.short_name === 'AIO Desktop')
              const aioM = awrVisibility.search_engines?.find((e: any) => e.short_name === 'AIO Mobile')
              return (
                <div className="space-y-6">
                  {/* ChatGPT Alert */}
                  {chatgpt && chatgpt.visibility_change < -5 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-red-700">ChatGPT Visibility Drop</div>
                        <p className="text-sm text-red-600 mt-1">
                          Visibility dropped <strong>{chatgpt.visibility_change}%</strong> this week.
                          Ranked keywords fell to {chatgpt.ranked}/174, with {Math.abs(chatgpt.visits_change).toLocaleString(undefined, { maximumFractionDigits: 0 })} estimated visits lost.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-[#86868B] uppercase">ChatGPT</p>
                        <p className="text-2xl font-bold text-[#1D1D1F] mt-1">{chatgpt?.visibility_percent ?? '—'}%</p>
                        <p className={`text-xs mt-1 ${(chatgpt?.visibility_change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(chatgpt?.visibility_change ?? 0) >= 0 ? '+' : ''}{chatgpt?.visibility_change ?? 0}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-[#86868B] uppercase">AIO Desktop</p>
                        <p className="text-2xl font-bold text-[#1D1D1F] mt-1">{aioD?.visibility_percent ?? '—'}%</p>
                        <p className={`text-xs mt-1 ${(aioD?.visibility_change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(aioD?.visibility_change ?? 0) >= 0 ? '+' : ''}{aioD?.visibility_change ?? 0}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-[#86868B] uppercase">AIO Mobile</p>
                        <p className="text-2xl font-bold text-[#1D1D1F] mt-1">{aioM?.visibility_percent ?? '—'}%</p>
                        <p className={`text-xs mt-1 ${(aioM?.visibility_change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(aioM?.visibility_change ?? 0) >= 0 ? '+' : ''}{aioM?.visibility_change ?? 0}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs font-medium text-[#86868B] uppercase">ChatGPT Ranked</p>
                        <p className="text-2xl font-bold text-[#1D1D1F] mt-1">{chatgpt?.ranked ?? '—'}<span className="text-base text-[#86868B]">/174</span></p>
                        <p className={`text-xs mt-1 ${(chatgpt?.ranked_change ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(chatgpt?.ranked_change ?? 0) >= 0 ? '+' : ''}{chatgpt?.ranked_change ?? 0}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Search Engine Comparison */}
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xl font-semibold text-[#1D1D1F] flex items-center gap-2">
                        <Search className="h-6 w-6 text-[#0A84FF]" />
                        Search Engine Comparison
                      </CardTitle>
                      <p className="text-sm text-[#6E6E73]">All 6 tracked engines</p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto rounded-xl">
                        <table className="w-full bg-[#1D1D1F]">
                          <thead>
                            <tr className="border-b border-[#3D3D3F]">
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Engine</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Visibility</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Avg Rank</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Click Share</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Est. Visits</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">1st Place</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Ranked</th>
                            </tr>
                          </thead>
                          <tbody>
                            {awrVisibility.search_engines?.map((engine: any) => (
                              <tr key={engine.name} className={`border-b border-[#2D2D2F] hover:bg-[#2A2A2C] transition-colors ${
                                engine.short_name === 'ChatGPT' && engine.visibility_change < -5 ? 'bg-red-500/10' : ''
                              }`}>
                                <td className="px-3 py-2.5">
                                  <div className="text-sm font-medium text-white">{engine.short_name}</div>
                                  <div className="text-xs text-gray-500">{engine.type === 'ai' ? 'AI Search' : 'Organic'}</div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="text-sm text-white">{engine.visibility_percent}%</div>
                                  <div className={`text-xs ${engine.visibility_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {engine.visibility_change >= 0 ? '+' : ''}{engine.visibility_change}%
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{engine.average_rank}</td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{engine.click_share}%</td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{engine.estimated_visits?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{engine.first_place}</td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{engine.ranked}/174</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Keyword Group Visibility */}
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-lg font-semibold text-[#1D1D1F]">Visibility by Keyword Group</CardTitle>
                      <p className="text-sm text-[#6E6E73]">Google Desktop Organic</p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto rounded-xl">
                        <table className="w-full bg-[#1D1D1F]">
                          <thead>
                            <tr className="border-b border-[#3D3D3F]">
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Group</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Visibility</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Avg Rank</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Click Share</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Keywords</th>
                              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">1st Place</th>
                            </tr>
                          </thead>
                          <tbody>
                            {awrVisibility.keyword_groups?.map((g: any) => (
                              <tr key={g.group} className="border-b border-[#2D2D2F] hover:bg-[#2A2A2C] transition-colors">
                                <td className="px-3 py-2.5 text-sm font-medium text-white">{g.group}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-[#3D3D3F] rounded-full h-1.5">
                                      <div className="bg-[#0A84FF] h-1.5 rounded-full" style={{ width: `${g.visibility_percent}%` }} />
                                    </div>
                                    <span className="text-sm text-white">{g.visibility_percent}%</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{g.average_rank}</td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{g.click_share}%</td>
                                <td className="px-3 py-2.5 text-sm text-gray-400">{g.keywords}</td>
                                <td className="px-3 py-2.5 text-sm text-gray-300">{g.first_place}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })() : null}
          </>
        )}

        {/* SEO Competitor Intel Tab */}
        {activeTab === "seo-competitors" && (
          <>
            {awrLoading && !awrCompetitors ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#6E6E73]" />
              </div>
            ) : awrCompetitors ? (() => {
              const qbt = awrCompetitors.comparison?.['quickbookstraining.com']
              const intuit = awrCompetitors.comparison?.['intuit.com']
              const qbtDist = awrCompetitors.domain_distribution?.['quickbookstraining.com']
              const intuitDist = awrCompetitors.domain_distribution?.['intuit.com']

              const CompareMetric = ({ label, qbtVal, intuitVal, qbtChg, intuitChg, lowerBetter = false }: {
                label: string; qbtVal: number; intuitVal: number; qbtChg?: number; intuitChg?: number; lowerBetter?: boolean
              }) => {
                const qbtWins = lowerBetter ? qbtVal < intuitVal : qbtVal > intuitVal
                return (
                  <Card className="bg-white border-[#D2D2D7] shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-[#86868B] uppercase mb-3">{label}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-[#86868B] mb-0.5">{qbtWins ? '👑 ' : ''}QBT</p>
                          <p className={`text-xl font-bold ${qbtWins ? 'text-[#0066CC]' : 'text-[#1D1D1F]'}`}>{qbtVal.toLocaleString()}</p>
                          {qbtChg !== undefined && (
                            <p className={`text-xs mt-0.5 ${(lowerBetter ? qbtChg <= 0 : qbtChg >= 0) ? 'text-green-600' : 'text-red-600'}`}>
                              {qbtChg >= 0 ? '+' : ''}{qbtChg}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-[#86868B] mb-0.5">{!qbtWins ? '👑 ' : ''}Intuit</p>
                          <p className={`text-xl font-bold ${!qbtWins ? 'text-purple-600' : 'text-[#1D1D1F]'}`}>{intuitVal.toLocaleString()}</p>
                          {intuitChg !== undefined && (
                            <p className={`text-xs mt-0.5 ${(lowerBetter ? intuitChg <= 0 : intuitChg >= 0) ? 'text-green-600' : 'text-red-600'}`}>
                              {intuitChg >= 0 ? '+' : ''}{intuitChg}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              }

              const distSegs = [
                { label: '1st', key: 'first_place', color: '#EAB308' },
                { label: '2-5', key: 'pos_2_5', color: '#22C55E' },
                { label: '6-10', key: 'pos_6_10', color: '#3B82F6' },
                { label: '11-20', key: 'pos_11_20', color: '#A855F7' },
                { label: '21-50', key: 'pos_21_50', color: '#F97316' },
                { label: 'N/R', key: 'not_ranked', color: '#6B7280' },
              ]

              return (
                <div className="space-y-6">
                  {qbt && intuit && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <CompareMetric label="Visibility %" qbtVal={qbt.visibility_percent} intuitVal={intuit.visibility_percent} qbtChg={qbt.visibility_change} intuitChg={intuit.visibility_change} />
                      <CompareMetric label="Avg Rank" qbtVal={qbt.average_rank} intuitVal={intuit.average_rank} qbtChg={qbt.avg_rank_change} intuitChg={intuit.avg_rank_change} lowerBetter />
                      <CompareMetric label="First Place" qbtVal={qbt.first_place} intuitVal={intuit.first_place} qbtChg={qbt.first_place_change} intuitChg={intuit.first_place_change} />
                      <CompareMetric label="Top 3" qbtVal={qbt.top3} intuitVal={intuit.top3} qbtChg={qbt.top3_change} intuitChg={intuit.top3_change} />
                      <CompareMetric label="Click Share %" qbtVal={qbt.click_share} intuitVal={intuit.click_share} qbtChg={qbt.click_share_change} intuitChg={intuit.click_share_change} />
                      <CompareMetric label="Est. Visits" qbtVal={Math.round(qbt.estimated_visits)} intuitVal={Math.round(intuit.estimated_visits)} qbtChg={Math.round(qbt.visits_change)} intuitChg={Math.round(intuit.visits_change)} />
                    </div>
                  )}

                  {/* Distribution bars */}
                  {qbtDist && intuitDist && (
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F]">Ranking Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { name: 'QBT', dist: qbtDist },
                            { name: 'Intuit', dist: intuitDist },
                          ].map(({ name, dist }) => (
                            <div key={name}>
                              <p className="text-sm font-medium text-[#1D1D1F] mb-1">{name}</p>
                              <div className="flex rounded-lg overflow-hidden h-7">
                                {distSegs.map(seg => {
                                  const val = dist[seg.key] || 0
                                  const pct = (val / 174) * 100
                                  if (pct === 0) return null
                                  return (
                                    <div
                                      key={seg.key}
                                      className="flex items-center justify-center text-xs font-bold text-white"
                                      style={{ width: `${pct}%`, backgroundColor: seg.color }}
                                      title={`${seg.label}: ${val}`}
                                    >
                                      {pct > 5 ? val : ''}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-4 flex-wrap mt-1">
                            {distSegs.map(seg => (
                              <div key={seg.key} className="flex items-center gap-1.5 text-xs text-[#86868B]">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: seg.color }} />
                                {seg.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Intuit Top URLs */}
                  {awrCompetitors.intuit_top_urls && (
                    <Card className="bg-white border-[#D2D2D7] shadow-sm">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-[#1D1D1F]">Intuit&apos;s Top Ranking URLs</CardTitle>
                        <p className="text-sm text-[#6E6E73]">Pages competing for your keyword set</p>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">URL</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Ranked</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">1st</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">2-5</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">6-10</th>
                              </tr>
                            </thead>
                            <tbody>
                              {awrCompetitors.intuit_top_urls.map((u: any) => (
                                <tr key={u.url} className="border-b border-[#2D2D2F] hover:bg-[#2A2A2C] transition-colors">
                                  <td className="px-3 py-2.5 text-sm text-gray-300 truncate max-w-[400px]">{u.url}</td>
                                  <td className="px-3 py-2.5 text-sm text-gray-300">{u.ranked_keywords}</td>
                                  <td className="px-3 py-2.5 text-sm text-yellow-400 font-medium">{u.first_place}</td>
                                  <td className="px-3 py-2.5 text-sm text-gray-300">{u.pos_2_5}</td>
                                  <td className="px-3 py-2.5 text-sm text-gray-300">{u.pos_6_10}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })() : null}
          </>
        )}

        {/* Landing Pages Tab */}
        {activeTab === "landing-pages" && (
          <div className="space-y-8">
            {landingPagesLoading && !landingPagesData ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#6E6E73]" />
              </div>
            ) : landingPagesData && gadsLandingPagesData ? (
              <>
                {/* GA4 Landing Pages */}
                <Card className="bg-white border-[#D2D2D7] shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xl font-semibold text-[#1D1D1F] flex items-center gap-2">
                      <MapPin className="h-6 w-6 text-[#0A84FF]" />
                      GA4 Landing Pages
                    </CardTitle>
                    <p className="text-base text-[#6E6E73]">Weekly users, conversions & conversion rate by page</p>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const activeWeeks = landingPagesData.landing_pages[0]?.weeks
                        .map((_, idx) => idx)
                        .filter(idx => !landingPagesData.landing_pages.every(lp => Math.round(lp.weeks[idx]?.users || 0) === 0)) || []
                      return (
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th rowSpan={2} className="text-left py-3 px-4 font-bold text-white text-lg sticky left-0 bg-[#1D1D1F] min-w-[220px] border-b-2 border-[#3D3D3F]">Landing Page</th>
                                {activeWeeks.map(idx => {
                                  const week = landingPagesData.landing_pages[0].weeks[idx]
                                  return (
                                    <th key={idx} colSpan={3} className="text-center py-3 px-1 border-l border-[#3D3D3F]">
                                      <div className="font-semibold text-white text-base">{week.label}</div>
                                      <div className="text-sm text-white/40">{week.date_range.split(' - ')[0]}</div>
                                    </th>
                                  )
                                })}
                              </tr>
                              <tr className="border-b-2 border-[#3D3D3F]">
                                {activeWeeks.flatMap(idx => [
                                  <th key={`${idx}-u`} className="text-center py-2 px-1 text-sm font-medium text-blue-400/70 border-l border-[#3D3D3F]">New Visitors</th>,
                                  <th key={`${idx}-c`} className="text-center py-2 px-1 text-sm font-medium text-white/40">Conv</th>,
                                  <th key={`${idx}-r`} className="text-center py-2 px-1 text-sm font-medium text-white/40">CVR%</th>
                                ])}
                              </tr>
                            </thead>
                            <tbody>
                              {landingPagesData.landing_pages.map((lp, lpIdx) => {
                                const rowBg = lpIdx % 2 === 0 ? 'bg-[#1D1D1F]' : 'bg-[#252528]'
                                return (
                                  <tr key={lpIdx} className={`border-b border-white/5 ${rowBg}`}>
                                    <td className={`py-3 px-4 font-medium text-white text-base sticky left-0 ${rowBg} truncate max-w-[260px]`} title={lp.landing_page}>
                                      {lp.landing_page}
                                    </td>
                                    {activeWeeks.flatMap(weekIdx => {
                                      const week = lp.weeks[weekIdx]
                                      const users = Math.round(week.users)
                                      if (users === 0 && week.purchases === 0) {
                                        return [
                                          <td key={`${weekIdx}-u`} className="text-center py-3 px-1 text-white/15 border-l border-white/5">—</td>,
                                          <td key={`${weekIdx}-c`} className="text-center py-3 px-1 text-white/15">—</td>,
                                          <td key={`${weekIdx}-r`} className="text-center py-3 px-1 text-white/15">—</td>
                                        ]
                                      }
                                      return [
                                        <td key={`${weekIdx}-u`} className="text-center py-3 px-2 border-l border-white/5">
                                          <span className="font-bold text-white text-lg">{users.toLocaleString()}</span>
                                        </td>,
                                        <td key={`${weekIdx}-c`} className="text-center py-3 px-2 text-emerald-400 text-base font-semibold">{week.purchases}</td>,
                                        <td key={`${weekIdx}-r`} className={`text-center py-3 px-2 text-base font-semibold ${week.conversion_rate >= 1.5 ? 'text-emerald-400' : week.conversion_rate >= 0.5 ? 'text-amber-400' : 'text-white/40'}`}>
                                          {week.conversion_rate.toFixed(2)}%
                                        </td>
                                      ]
                                    })}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Google Ads Landing Pages */}
                <Card className="bg-white border-[#D2D2D7] shadow-sm">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xl font-semibold text-[#1D1D1F] flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-[#34C759]" />
                      Google Ads Landing Pages
                    </CardTitle>
                    <p className="text-base text-[#6E6E73]">Weekly clicks, conversions & conversion rate by page</p>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const normalizePath = (p: string) => p.replace(/\/+$/, '') || '/'
                      const ga4Order = landingPagesData.landing_pages.map(lp => normalizePath(lp.landing_page))
                      const sorted = [...gadsLandingPagesData.landing_pages].sort((a, b) => {
                        const aIdx = ga4Order.indexOf(normalizePath(a.landing_page))
                        const bIdx = ga4Order.indexOf(normalizePath(b.landing_page))
                        if (aIdx === -1 && bIdx === -1) return 0
                        if (aIdx === -1) return 1
                        if (bIdx === -1) return -1
                        return aIdx - bIdx
                      })
                      const activeWeeks = sorted[0]?.weeks
                        .map((_, idx) => idx)
                        .filter(idx => !sorted.every(lp => Math.round(lp.weeks[idx]?.clicks || 0) === 0)) || []
                      return (
                        <div className="overflow-x-auto rounded-xl">
                          <table className="w-full bg-[#1D1D1F]">
                            <thead>
                              <tr className="border-b border-[#3D3D3F]">
                                <th rowSpan={2} className="text-left py-3 px-4 font-bold text-white text-lg sticky left-0 bg-[#1D1D1F] min-w-[220px] border-b-2 border-[#3D3D3F]">Landing Page</th>
                                {activeWeeks.map(idx => {
                                  const week = sorted[0].weeks[idx]
                                  return (
                                    <th key={idx} colSpan={3} className="text-center py-3 px-1 border-l border-[#3D3D3F]">
                                      <div className="font-semibold text-white text-base">{week.label}</div>
                                      <div className="text-sm text-white/40">{week.date_range.split(' - ')[0]}</div>
                                    </th>
                                  )
                                })}
                              </tr>
                              <tr className="border-b-2 border-[#3D3D3F]">
                                {activeWeeks.flatMap(idx => [
                                  <th key={`${idx}-k`} className="text-center py-2 px-1 text-sm font-medium text-green-400/70 border-l border-[#3D3D3F]">Clicks</th>,
                                  <th key={`${idx}-c`} className="text-center py-2 px-1 text-sm font-medium text-white/40">Conv</th>,
                                  <th key={`${idx}-r`} className="text-center py-2 px-1 text-sm font-medium text-white/40">CVR%</th>
                                ])}
                              </tr>
                            </thead>
                            <tbody>
                              {sorted.map((lp, lpIdx) => {
                                const rowBg = lpIdx % 2 === 0 ? 'bg-[#1D1D1F]' : 'bg-[#252528]'
                                return (
                                  <tr key={lpIdx} className={`border-b border-white/5 ${rowBg}`}>
                                    <td className={`py-3 px-4 font-medium text-white text-base sticky left-0 ${rowBg} truncate max-w-[260px]`} title={lp.landing_page}>
                                      {lp.landing_page}
                                    </td>
                                    {activeWeeks.flatMap(weekIdx => {
                                      const week = lp.weeks[weekIdx]
                                      const clicks = Math.round(week.clicks)
                                      const conversions = Math.round(week.conversions)
                                      if (clicks === 0 && conversions === 0) {
                                        return [
                                          <td key={`${weekIdx}-k`} className="text-center py-3 px-1 text-white/15 border-l border-white/5">—</td>,
                                          <td key={`${weekIdx}-c`} className="text-center py-3 px-1 text-white/15">—</td>,
                                          <td key={`${weekIdx}-r`} className="text-center py-3 px-1 text-white/15">—</td>
                                        ]
                                      }
                                      return [
                                        <td key={`${weekIdx}-k`} className="text-center py-3 px-2 border-l border-white/5">
                                          <span className="font-bold text-white text-lg">{clicks.toLocaleString()}</span>
                                        </td>,
                                        <td key={`${weekIdx}-c`} className="text-center py-3 px-2 text-emerald-400 text-base font-semibold">{conversions}</td>,
                                        <td key={`${weekIdx}-r`} className={`text-center py-3 px-2 text-base font-semibold ${week.conversion_rate >= 5 ? 'text-emerald-400' : week.conversion_rate >= 2 ? 'text-amber-400' : 'text-white/40'}`}>
                                          {week.conversion_rate.toFixed(2)}%
                                        </td>
                                      ]
                                    })}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-white border-[#D2D2D7] shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-[#6E6E73]">Failed to load landing pages data</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Search Console Tab */}
        {activeTab === "gsc" && (
          <div className="space-y-5">
            {gscLoading && !gscWeeklyData ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : gscWeeklyData?.data ? (
              <>
                {/* Hero Cards Row */}
                {(() => {
                  const weeks = gscWeeklyData.data
                  const latest = weeks[0]
                  const prev = weeks[1]
                  const impChange = prev?.impressions > 0 ? ((latest.impressions - prev.impressions) / prev.impressions) * 100 : 0
                  const clickChange = prev?.clicks > 0 ? ((latest.clicks - prev.clicks) / prev.clicks) * 100 : 0
                  const ctrChange = prev?.ctr > 0 ? ((latest.ctr - prev.ctr) / prev.ctr) * 100 : 0

                  const heroCards = [
                    { label: 'IMPRESSIONS', value: formatNumber(latest.impressions), change: impChange, prev: formatNumber(prev?.impressions || 0), border: 'border-cyan-900/30', accent: 'bg-cyan-500/5' },
                    { label: 'CLICKS', value: formatNumber(latest.clicks), change: clickChange, prev: formatNumber(prev?.clicks || 0), border: 'border-emerald-900/30', accent: 'bg-emerald-500/5' },
                    { label: 'CTR', value: `${latest.ctr.toFixed(2)}%`, change: ctrChange, prev: `${(prev?.ctr || 0).toFixed(2)}%`, border: 'border-violet-900/30', accent: 'bg-violet-500/5' },
                  ]

                  return (
                    <div className="grid grid-cols-3 gap-4">
                      {heroCards.map(card => (
                        <div key={card.label} className={`bg-gradient-to-br from-[#0f2027] to-[#203a43] rounded-xl p-5 ${card.border} border relative overflow-hidden text-center`}>
                          <div className={`absolute top-0 right-0 w-24 h-24 ${card.accent} rounded-full -translate-y-8 translate-x-8`} />
                          <div className="text-gray-400 text-sm font-medium tracking-wide mb-3">{card.label}</div>
                          <div className="text-5xl font-black text-white tracking-tight mb-2">{card.value}</div>
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <span className={card.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {card.change >= 0 ? '+' : ''}{card.change.toFixed(1)}% WoW
                            </span>
                            <span className="text-gray-500">was {card.prev}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <span className="text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">query !~ login</span>
                            <span className="text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full">country = USA</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Week label */}
                <div className="text-gray-500 text-sm text-center">
                  Latest complete week: {gscWeeklyData.data[0]?.week}
                </div>

                {/* Weekly Trend + Monthly Summary side by side */}
                <div className="grid grid-cols-2 gap-4">
                  {/* 14-Week Trend Table */}
                  <div className="bg-[#111827] rounded-xl p-5 border border-gray-800/50">
                    <div className="text-gray-300 text-lg font-semibold tracking-wide mb-3">WEEKLY TREND</div>
                    <div className="overflow-y-auto max-h-[520px]">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#111827]">
                          <tr className="border-b border-gray-700/50">
                            <th className="text-left text-gray-400 font-medium py-2 px-3">Week</th>
                            <th className="text-right text-gray-400 font-medium py-2 px-3">Impressions</th>
                            <th className="text-right text-gray-400 font-medium py-2 px-3">Clicks</th>
                            <th className="text-right text-gray-400 font-medium py-2 px-3">CTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gscWeeklyData.data.slice().reverse().map((week: any, i: number, arr: any[]) => (
                            <tr key={week.week_start} className={`border-b border-gray-800/30 ${i === arr.length - 1 ? 'bg-gray-800/20' : ''}`}>
                              <td className="py-2 px-3 text-gray-300">{week.week}</td>
                              <td className="py-2 px-3 text-right text-white">{formatNumber(week.impressions)}</td>
                              <td className="py-2 px-3 text-right text-white">{formatNumber(week.clicks)}</td>
                              <td className="py-2 px-3 text-right text-cyan-400 font-semibold">{week.ctr.toFixed(2)}%</td>
                            </tr>
                          ))}
                          {gscWeeklyData.wtdWeek && (
                            <tr className="border-b border-gray-800/30 bg-amber-900/10">
                              <td className="py-2 px-3 text-amber-400 font-semibold">{gscWeeklyData.wtdWeek.week} (WTD)</td>
                              <td className="py-2 px-3 text-right text-white">{formatNumber(gscWeeklyData.wtdWeek.impressions)}</td>
                              <td className="py-2 px-3 text-right text-white">{formatNumber(gscWeeklyData.wtdWeek.clicks)}</td>
                              <td className="py-2 px-3 text-right text-cyan-400 font-semibold">{gscWeeklyData.wtdWeek.ctr.toFixed(2)}%</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Monthly Summary Table */}
                  <div className="bg-[#111827] rounded-xl p-5 border border-gray-800/50">
                    <div className="text-gray-300 text-lg font-semibold tracking-wide mb-3">MONTHLY SUMMARY</div>
                    <div className="overflow-y-auto max-h-[520px]">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-[#111827]">
                          <tr className="border-b border-gray-700/50">
                            <th className="text-left text-gray-400 font-medium py-2 px-3">Month</th>
                            <th className="text-right text-gray-400 font-medium py-2 px-3">Impressions</th>
                            <th className="text-right text-gray-400 font-medium py-2 px-3">Clicks</th>
                            <th className="text-right text-gray-400 font-medium py-2 px-3">CTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gscWeeklyData.monthlyData?.slice().reverse().map((m: any, i: number, arr: any[]) => (
                            <tr key={m.month_key} className={`border-b border-gray-800/30 ${i === arr.length - 1 ? 'bg-gray-800/20' : ''} ${m.isMtd ? 'bg-amber-900/10' : ''}`}>
                              <td className={`py-2 px-3 ${m.isMtd ? 'text-amber-400 font-semibold' : 'text-gray-300'}`}>{m.month}</td>
                              <td className="py-2 px-3 text-right text-white">{formatNumber(m.impressions)}</td>
                              <td className="py-2 px-3 text-right text-white">{formatNumber(m.clicks)}</td>
                              <td className="py-2 px-3 text-right text-cyan-400 font-semibold">{m.ctr.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Year-over-Year Comparison */}
                {gscWeeklyData.yoyData && (() => {
                  const currentWeeks = gscWeeklyData.data.filter((w: any) => w.year === new Date().getFullYear()).slice(0, 4)
                  const yoyWeeks = gscWeeklyData.yoyData

                  const sumCurrent = { impressions: 0, clicks: 0 }
                  const sumYoY = { impressions: 0, clicks: 0 }
                  currentWeeks.forEach((w: any) => { sumCurrent.impressions += w.impressions; sumCurrent.clicks += w.clicks })
                  yoyWeeks.forEach((w: any) => { sumYoY.impressions += w.impressions; sumYoY.clicks += w.clicks })

                  const impYoY = sumYoY.impressions > 0 ? ((sumCurrent.impressions - sumYoY.impressions) / sumYoY.impressions) * 100 : 0
                  const clickYoY = sumYoY.clicks > 0 ? ((sumCurrent.clicks - sumYoY.clicks) / sumYoY.clicks) * 100 : 0
                  const currentCtr = sumCurrent.impressions > 0 ? (sumCurrent.clicks / sumCurrent.impressions) * 100 : 0
                  const yoyCtr = sumYoY.impressions > 0 ? (sumYoY.clicks / sumYoY.impressions) * 100 : 0
                  const ctrYoY = yoyCtr > 0 ? ((currentCtr - yoyCtr) / yoyCtr) * 100 : 0

                  const yoyCards = [
                    { label: 'IMPRESSIONS YoY', change: impYoY, current: formatNumber(sumCurrent.impressions), previous: formatNumber(sumYoY.impressions) },
                    { label: 'CLICKS YoY', change: clickYoY, current: formatNumber(sumCurrent.clicks), previous: formatNumber(sumYoY.clicks) },
                    { label: 'CTR YoY', change: ctrYoY, current: `${currentCtr.toFixed(2)}%`, previous: `${yoyCtr.toFixed(2)}%` },
                  ]

                  return (
                    <div className="bg-[#111827] rounded-xl p-6 border border-gray-800/50">
                      <div className="text-gray-300 text-lg font-semibold tracking-wide mb-4">YEAR-OVER-YEAR (4-WEEK AVG)</div>
                      <div className="grid grid-cols-3 gap-4">
                        {yoyCards.map(card => (
                          <div key={card.label} className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-lg p-5 text-center border border-gray-700/30">
                            <div className="text-gray-400 text-sm font-medium mb-2">{card.label}</div>
                            <div className={`text-3xl font-black mb-2 ${card.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {card.change >= 0 ? '+' : ''}{card.change.toFixed(1)}%
                            </div>
                            <div className="text-gray-400 text-xs">
                              {card.current} <span className="text-gray-600">vs</span> {card.previous}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Top 20 Keywords Table */}
                {gscKeywordsData?.data && (
                  <div className="bg-[#111827] rounded-xl p-6 border border-gray-800/50">
                    <div className="text-gray-300 text-lg font-semibold tracking-wide mb-4">TOP 50 KEYWORDS</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700/50">
                            <th className="text-left text-gray-400 font-semibold text-base py-3 px-4">#</th>
                            <th className="text-left text-gray-400 font-semibold text-base py-3 px-4">Query</th>
                            {gscKeywordsData.weeks?.map((week: string) => (
                              <th key={week} className="text-right text-gray-400 font-semibold text-base py-3 px-4 whitespace-nowrap">
                                <div>{week}</div>
                                <div className="text-xs text-gray-500">imp / clicks / ctr</div>
                              </th>
                            ))}
                            <th className="text-right text-gray-400 font-semibold text-base py-3 px-4">Total Clicks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gscKeywordsData.data.map((kw: any, i: number) => {
                            const totalClicks = kw.weeks.reduce((sum: number, w: any) => sum + w.clicks, 0)
                            return (
                              <tr key={kw.query} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                <td className="py-3 px-4 text-gray-500 font-mono text-xs">{i + 1}</td>
                                <td className="py-3 px-4 text-white font-medium max-w-[300px] truncate">{kw.query}</td>
                                {kw.weeks.map((w: any, wi: number) => {
                                  const ctr = w.impressions > 0 ? ((w.clicks / w.impressions) * 100).toFixed(1) : '0.0'
                                  return (
                                    <td key={wi} className="py-3 px-4 text-right whitespace-nowrap">
                                      <span className="text-gray-400">{formatNumber(w.impressions)}</span>
                                      <span className="text-gray-600 mx-1">/</span>
                                      <span className="text-emerald-400 font-semibold">{w.clicks}</span>
                                      <span className="text-gray-600 mx-1">/</span>
                                      <span className="text-cyan-400 font-semibold">{ctr}%</span>
                                    </td>
                                  )
                                })}
                                <td className="py-3 px-4 text-right text-cyan-400 font-bold">{totalClicks}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card className="bg-[#1C1C1E] border-[#2C2C2E]">
                <CardContent className="flex items-center justify-center py-10">
                  <p className="text-[#6E6E73]">No Search Console data available</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === "subscriptions" && (
          <div className="space-y-5">
            {subscriptionsLoading && !subscriptions ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : subscriptions ? (
              <>
                {/* Hero Metrics Row */}
                <div className="grid grid-cols-6 gap-4">
                  {/* Active Subscriptions */}
                  <div className="bg-gradient-to-br from-[#0f2027] to-[#203a43] rounded-xl p-5 border border-cyan-900/30 relative overflow-hidden text-center" title="Total number of subscriptions currently in 'active' status. Does not include cancelled, expired, or on-hold subscriptions.">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="text-gray-400 text-sm font-medium tracking-wide mb-3">ACTIVE SUBS</div>
                    <div className="text-5xl font-black text-white tracking-tight">
                      {formatNumber(subscriptions.metrics.active_subscriptions)}
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="bg-gradient-to-br from-[#0f2027] to-[#203a43] rounded-xl p-5 border border-emerald-900/30 relative overflow-hidden text-center" title="Monthly Recurring Revenue (MRR) — the sum of every currently active subscriber's recurring payment amount. This is not last month's revenue; it's a real-time snapshot of total monthly revenue if every active subscriber renews.">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="text-gray-400 text-sm font-medium tracking-wide mb-3">ACTIVE REVENUE</div>
                    <div className="text-5xl font-black text-white tracking-tight">
                      {formatCurrency(subscriptions.metrics.mrr)}
                    </div>
                  </div>

                  {/* Avg Revenue Per Sub */}
                  <div className="bg-gradient-to-br from-[#0f2027] to-[#203a43] rounded-xl p-5 border border-emerald-900/30 relative overflow-hidden text-center" title="Active Revenue divided by Active Subs — the average monthly recurring payment per active subscriber.">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="text-gray-400 text-sm font-medium tracking-wide mb-3">AVG REVENUE/SUB</div>
                    <div className="text-5xl font-black text-white tracking-tight">
                      {formatCurrencyDecimal(subscriptions.metrics.avg_order_value)}
                    </div>
                  </div>

                  {/* New This Week */}
                  <div className="bg-gradient-to-br from-[#0f2027] to-[#203a43] rounded-xl p-5 border border-green-900/30 relative overflow-hidden text-center" title="New subscriptions created since the start of the current week (Monday).">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="text-gray-400 text-sm font-medium tracking-wide mb-3">NEW THIS WEEK</div>
                    <div className="text-5xl font-black text-green-400 tracking-tight">
                      +{formatNumber(subscriptions.metrics.new_this_week)}
                    </div>
                  </div>

                  {/* New This Month */}
                  <div className="bg-gradient-to-br from-[#0f2027] to-[#203a43] rounded-xl p-5 border border-green-900/30 relative overflow-hidden text-center" title="New subscriptions created since the 1st of the current month.">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="text-gray-400 text-sm font-medium tracking-wide mb-3">NEW THIS MONTH</div>
                    <div className="text-5xl font-black text-green-400 tracking-tight">
                      +{formatNumber(subscriptions.metrics.new_this_month)}
                    </div>
                  </div>

                  {/* Cancelled This Month */}
                  <div className="bg-gradient-to-br from-[#0f2027] to-[#203a43] rounded-xl p-5 border border-red-900/30 relative overflow-hidden text-center" title="Subscriptions that were cancelled since the 1st of the current month.">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-8 translate-x-8" />
                    <div className="text-gray-400 text-sm font-medium tracking-wide mb-3">CANCELLED THIS MONTH</div>
                    <div className="text-5xl font-black text-red-400 tracking-tight">
                      -{formatNumber(subscriptions.metrics.cancelled_this_month)}
                    </div>
                  </div>
                </div>

                {/* Tier Breakdown Bar */}
                {subscriberMetrics?.available && subscriberMetrics.data?.tier_breakdown && (() => {
                  const t = subscriberMetrics.data.tier_breakdown
                  const total = t.tier_29 + t.tier_40 + t.tier_50_70 + t.tier_90_plus
                  const pct = (val: number) => total > 0 ? ((val / total) * 100) : 0
                  const tiers = [
                    { label: '$29', count: t.tier_29, color: 'from-blue-600 to-blue-500', barColor: '#3B82F6', textColor: 'text-blue-400' },
                    { label: '$40', count: t.tier_40, color: 'from-cyan-600 to-cyan-500', barColor: '#06B6D4', textColor: 'text-cyan-400' },
                    { label: '$50-70', count: t.tier_50_70, color: 'from-violet-600 to-violet-500', barColor: '#8B5CF6', textColor: 'text-violet-400' },
                    { label: '$90+', count: t.tier_90_plus, color: 'from-amber-600 to-amber-500', barColor: '#F59E0B', textColor: 'text-amber-400' },
                  ]
                  return (
                    <div className="bg-[#111827] rounded-xl p-5 border border-gray-800/50">
                      <div className="flex items-center justify-between mb-5">
                        <div className="text-gray-300 text-lg font-semibold tracking-wide">SUBSCRIPTION TIERS</div>
                        <div className="text-cyan-400 text-lg font-bold">
                          Avg: ${subscriberMetrics.data.current_avg_renewal.toFixed(2)}/mo
                        </div>
                      </div>
                      {/* Stacked progress bar */}
                      <div className="flex h-3 rounded-full overflow-hidden mb-5 bg-gray-800">
                        {tiers.map(tier => (
                          <div key={tier.label} className={`bg-gradient-to-r ${tier.color}`} style={{ width: `${pct(tier.count)}%` }} />
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {tiers.map(tier => (
                          <div key={tier.label} className={`bg-gray-800/40 rounded-lg p-4 text-center border-l-4`} style={{ borderLeftColor: tier.barColor }}>
                            <div className={`text-3xl font-black ${tier.textColor} mb-1`}>{tier.label}</div>
                            <div className="text-2xl font-bold text-white mb-2">{tier.count.toLocaleString()}</div>
                            <div className={`inline-block text-2xl font-bold px-3 py-0.5 rounded-full`} style={{ backgroundColor: `${tier.barColor}20`, color: tier.barColor }}>{Math.round(pct(tier.count))}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Quarterly Cohort Retention */}
                {subscriberMetrics?.available && subscriberMetrics.data?.quarterly_cohort_retention && (
                  <div className="bg-[#111827] rounded-xl p-6 border border-gray-800/50">
                    <div className="text-gray-300 text-lg font-semibold tracking-wide mb-1">QUARTERLY COHORT RETENTION</div>
                    <div className="text-gray-500 text-sm mb-5">New signups by quarter and what % are still active today</div>
                    <div className="grid grid-cols-5 gap-4">
                      {Object.entries(subscriberMetrics.data.quarterly_cohort_retention).map(([quarter, qData]) => {
                        const retPct = qData.retention_pct
                        const retColor = retPct >= 50 ? 'text-emerald-400' : retPct >= 35 ? 'text-yellow-400' : 'text-red-400'
                        const ringColor = retPct >= 50 ? 'border-emerald-500/30' : retPct >= 35 ? 'border-yellow-500/30' : 'border-red-500/30'
                        return (
                          <div key={quarter} className={`bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-lg p-4 text-center border ${ringColor}`}>
                            <div className="text-cyan-400 text-sm font-semibold mb-3">{quarter.replace(/(\d{4})(Q\d)/, '$1 $2')}</div>
                            <div className="text-3xl font-black text-white">{qData.total_adds.toLocaleString()}</div>
                            <div className="text-gray-400 text-sm mb-3">new adds</div>
                            <div className={`text-2xl font-bold ${retColor}`}>
                              {qData.still_active.toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-sm mb-1">still active</div>
                            {/* Retention gauge */}
                            <div className="mt-2">
                              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${retPct >= 50 ? 'bg-emerald-500' : retPct >= 35 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${retPct}%` }} />
                              </div>
                              <div className={`text-sm font-bold mt-1 ${retColor}`}>{retPct}%</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-700/50 flex justify-between items-center">
                      <div className="text-gray-400 text-sm">
                        Total adds: <span className="font-bold text-white">{Object.values(subscriberMetrics.data.quarterly_cohort_retention).reduce((a, b) => a + b.total_adds, 0).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        Still active: <span className="font-bold text-emerald-400">{Object.values(subscriberMetrics.data.quarterly_cohort_retention).reduce((a, b) => a + b.still_active, 0).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        Overall retention: <span className="font-bold text-emerald-400">
                          {(() => {
                            const totals = Object.values(subscriberMetrics.data.quarterly_cohort_retention).reduce((a, b) => ({ adds: a.adds + b.total_adds, active: a.active + b.still_active }), { adds: 0, active: 0 })
                            return totals.adds > 0 ? ((totals.active / totals.adds) * 100).toFixed(1) : '0'
                          })()}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Adds vs Immediate Cancels Chart */}
                {subscriberMetrics?.available && subscriberMetrics.data?.new_adds_by_month && (
                  <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-6 border border-gray-800/50">
                    <div className="text-gray-300 text-lg font-semibold tracking-wide mb-1">NEW ADDS vs IMMEDIATE CANCELS</div>
                    <div className="text-gray-500 text-sm mb-5">Monthly signups, cancels within 30 days, and cancel rate</div>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={Object.entries(subscriberMetrics.data.new_adds_by_month).map(([month, adds]) => ({
                            month: month.replace(' 20', ' \''),
                            newAdds: adds,
                            cancels: subscriberMetrics.data?.immediate_cancels_by_month?.[month] || 0,
                            rate: subscriberMetrics.data?.immediate_cancel_rate_by_month?.[month] || 0,
                          }))}
                          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="sub-adds-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                            </linearGradient>
                            <linearGradient id="sub-cancels-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.7} />
                            </linearGradient>
                            <linearGradient id="sub-rate-area" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#ffffff08" vertical={false} />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 25]}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '10px',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            }}
                            itemStyle={{ color: '#E5E7EB' }}
                            labelStyle={{ color: '#9CA3AF', fontWeight: 600 }}
                            formatter={(value, name) => {
                              const val = Number(value) || 0
                              if (name === 'rate') return [`${val}%`, 'Cancel Rate']
                              if (name === 'newAdds') return [val.toLocaleString(), 'New Adds']
                              if (name === 'cancels') return [val.toLocaleString(), 'Immediate Cancels']
                              return [val, name]
                            }}
                          />
                          <Bar yAxisId="left" dataKey="newAdds" fill="url(#sub-adds-gradient)" radius={[6, 6, 0, 0]} name="newAdds" />
                          <Bar yAxisId="left" dataKey="cancels" fill="url(#sub-cancels-gradient)" radius={[6, 6, 0, 0]} name="cancels" />
                          <Area yAxisId="right" type="monotone" dataKey="rate" fill="url(#sub-rate-area)" stroke="transparent" name="rateArea" />
                          <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#1a1a2e', stroke: '#F59E0B', strokeWidth: 3, r: 5 }} name="rate" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Inline legend */}
                    <div className="flex justify-center gap-6 mt-3">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500" /><span className="text-gray-400 text-sm">New Adds</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-gray-400 text-sm">Immediate Cancels</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-gray-400 text-sm">Cancel Rate %</span></div>
                    </div>
                    {/* Summary stats */}
                    <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between items-center">
                      <div className="text-gray-400 text-sm">
                        Total adds: <span className="font-bold text-emerald-400">{Object.values(subscriberMetrics.data.new_adds_by_month || {}).reduce((a, b) => a + b, 0).toLocaleString()}</span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        Total immediate cancels: <span className="font-bold text-red-400">{subscriberMetrics.data.immediate_cancels_total.toLocaleString()}</span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        <span className="font-bold text-amber-400">{subscriberMetrics.data.immediate_cancels_pct}%</span> of all cancellations
                      </div>
                    </div>
                  </div>
                )}

                {/* Adjusted Churn Rate by Month */}
                {subscriberMetrics?.available && subscriberMetrics.data?.adjusted_churn_by_month && (
                  <div className="bg-[#111827] rounded-xl p-6 border border-gray-800/50">
                    <div className="text-gray-300 text-lg font-semibold tracking-wide mb-1">ADJUSTED CHURN BY MONTH</div>
                    <div className="text-gray-500 text-sm mb-5">Excluding immediate cancels (subscribers who stayed &gt;30 days)</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
                      {Object.entries(subscriberMetrics.data.adjusted_churn_by_month).map(([month, count]) => {
                        const totalChurn = subscriberMetrics.data?.churn_by_month?.[month] || 0
                        const immediateChurn = subscriberMetrics.data?.immediate_by_churn_month?.[month] || 0
                        const attritionRate = subscriberMetrics.data?.adjusted_attrition_rate_by_month?.[month] || 0
                        const activeAtStart = subscriberMetrics.data?.active_at_start_by_month?.[month] || 0
                        const rateColor = attritionRate >= 5 ? 'text-red-400' : attritionRate >= 3.5 ? 'text-amber-400' : 'text-emerald-400'
                        return (
                          <div key={month} className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg p-3 text-center border border-gray-700/30" title={`${count} subscribers cancelled in ${month} after being subscribed for more than 30 days (${totalChurn} total cancels minus ${immediateChurn} immediate cancels). The ${attritionRate}% attrition rate = ${count} adjusted cancels ÷ ${activeAtStart.toLocaleString()} active subscribers at the start of ${month}.`}>
                            <div className="text-gray-300 text-sm font-medium mb-2">{month}</div>
                            <div className={`text-2xl font-black ${count > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                              {count}
                            </div>
                            <div className={`text-lg font-bold mt-1 ${rateColor}`}>
                              {attritionRate}%
                            </div>
                            <div className="text-gray-500 text-xs mt-0.5">
                              of {activeAtStart.toLocaleString()} active
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Summary metrics */}
                    {(() => {
                      const attritionRates = Object.values(subscriberMetrics.data?.adjusted_attrition_rate_by_month || {})
                      const avgAttrition = attritionRates.length > 0 ? (attritionRates.reduce((a, b) => a + b, 0) / attritionRates.length).toFixed(1) : '0'
                      return (
                        <div className="grid grid-cols-5 gap-4 pt-4 border-t border-gray-700/50">
                          <div className="text-center" title="Average total cancellations per month (including immediate cancels) over the last 12 months.">
                            <div className="text-gray-400 text-sm mb-1 tracking-wide">AVG TOTAL CHURN/MO</div>
                            <div className="text-2xl font-bold text-red-400">{subscriberMetrics.data.avg_churn_12mo}</div>
                          </div>
                          <div className="text-center" title="Average number of immediate cancels per month — subscribers who cancelled within 30 days of signing up.">
                            <div className="text-gray-400 text-sm mb-1 tracking-wide">AVG IMMEDIATE/MO</div>
                            <div className="text-2xl font-bold text-red-300">{Math.round(subscriberMetrics.data.immediate_cancels_avg_monthly)}</div>
                          </div>
                          <div className="text-center" title="Average monthly cancels after removing immediate cancels. These are subscribers who stayed more than 30 days before cancelling.">
                            <div className="text-gray-400 text-sm mb-1 tracking-wide">AVG ADJUSTED/MO</div>
                            <div className="text-2xl font-bold text-orange-400">{subscriberMetrics.data.avg_adjusted_churn_12mo}</div>
                          </div>
                          <div className="text-center" title="Average monthly attrition rate — adjusted cancels divided by active subscribers at the start of each month, averaged across all months shown.">
                            <div className="text-gray-400 text-sm mb-1 tracking-wide">AVG ATTRITION RATE</div>
                            <div className="text-2xl font-bold text-cyan-400">{avgAttrition}%</div>
                          </div>
                          <div className="text-center" title="What percentage of all cancellations are immediate (within 30 days). These are typically buyer's remorse or trial users who never intended to stay.">
                            <div className="text-gray-400 text-sm mb-1 tracking-wide">IMMEDIATE % OF CHURN</div>
                            <div className="text-2xl font-bold text-white">{subscriberMetrics.data.immediate_cancels_pct}%</div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Subscription Lifecycle */}
                {subscriberMetrics?.available && subscriberMetrics.data?.avg_subscription_months && (
                  <div className="bg-[#111827] rounded-xl p-6 border border-gray-800/50">
                    <div className="text-gray-300 text-lg font-semibold tracking-wide mb-1">SUBSCRIPTION LIFECYCLE</div>
                    <div className="text-gray-500 text-sm mb-5">Average subscription duration and cohort survival rates (on-hold excluded)</div>

                    {/* Duration hero stats — 3 groups */}
                    <div className="space-y-4 mb-6">
                      {/* Row 1: ALL SUBSCRIBERS (excl on-hold) */}
                      <div>
                        <div className="text-gray-400 text-xs font-semibold tracking-wider mb-2">ALL SUBSCRIBERS <span className="text-gray-600">(excl. on-hold)</span></div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/30 rounded-lg p-4 text-center border border-cyan-800/20" title="Average subscription length across all subscribers (active + cancelled/expired), excluding on-hold. Higher means subscribers stick around longer on average.">
                            <div className="text-gray-400 text-sm mb-2">AVG DURATION</div>
                            <div className="text-4xl font-black text-cyan-400">{subscriberMetrics.data.avg_subscription_months}</div>
                            <div className="text-gray-400 text-sm mt-1">months</div>
                          </div>
                          <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/30 rounded-lg p-4 text-center border border-cyan-800/20" title="The midpoint subscription length — half of all subscribers lasted longer than this, half lasted shorter. Less affected by outliers than the average.">
                            <div className="text-gray-400 text-sm mb-2">MEDIAN DURATION</div>
                            <div className="text-4xl font-black text-cyan-400">{subscriberMetrics.data.median_subscription_months}</div>
                            <div className="text-gray-400 text-sm mt-1">months</div>
                          </div>
                          <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 rounded-lg p-4 text-center border border-red-800/20" title="Percentage of all subscriptions ever created that have been cancelled or expired. This is the all-time churn rate across the full subscriber base.">
                            <div className="text-gray-400 text-sm mb-2">LIFETIME CHURN</div>
                            <div className="text-4xl font-black text-red-400">{subscriberMetrics.data.lifetime_churn_rate}%</div>
                            <div className="text-gray-400 text-sm mt-1">of all subs</div>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: ACTIVE vs CANCELLED/EXPIRED */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Active subscribers */}
                        <div>
                          <div className="text-emerald-400/80 text-xs font-semibold tracking-wider mb-2">ACTIVE SUBSCRIBERS</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/30 rounded-lg p-4 text-center border border-emerald-800/20" title="Average number of months that currently active subscribers have been subscribed. Measures how long your retained customers have been with you.">
                              <div className="text-gray-400 text-sm mb-2">AVG TENURE</div>
                              <div className="text-3xl font-black text-emerald-400">{subscriberMetrics.data.active_avg_subscription_months}</div>
                              <div className="text-gray-400 text-sm mt-1">months</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/30 rounded-lg p-4 text-center border border-emerald-800/20" title="The midpoint tenure for active subscribers — half have been subscribed longer than this, half shorter.">
                              <div className="text-gray-400 text-sm mb-2">MEDIAN TENURE</div>
                              <div className="text-3xl font-black text-emerald-400">{subscriberMetrics.data.active_median_subscription_months}</div>
                              <div className="text-gray-400 text-sm mt-1">months</div>
                            </div>
                          </div>
                        </div>

                        {/* Cancelled / Expired / Pending-Cancel */}
                        <div>
                          <div className="text-amber-400/80 text-xs font-semibold tracking-wider mb-2">CANCELLED / EXPIRED</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/30 rounded-lg p-4 text-center border border-amber-800/20" title="Average number of months that cancelled/expired subscribers were subscribed before they left. Shows how long churned customers typically stayed.">
                              <div className="text-gray-400 text-sm mb-2">AVG DURATION</div>
                              <div className="text-3xl font-black text-amber-400">{subscriberMetrics.data.cancelled_avg_subscription_months}</div>
                              <div className="text-gray-400 text-sm mt-1">months</div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/30 rounded-lg p-4 text-center border border-amber-800/20" title="The midpoint duration for cancelled/expired subscribers — half lasted longer than this before cancelling, half lasted shorter.">
                              <div className="text-gray-400 text-sm mb-2">MEDIAN DURATION</div>
                              <div className="text-3xl font-black text-amber-400">{subscriberMetrics.data.cancelled_median_subscription_months}</div>
                              <div className="text-gray-400 text-sm mt-1">months</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cohort Survival by Year */}
                    {subscriberMetrics.data.cohort_survival && (
                      <>
                        <div className="text-gray-400 text-sm font-medium mb-3 tracking-wide">COHORT SURVIVAL BY SIGNUP YEAR</div>
                        <div className="text-gray-500 text-sm mb-4">% of subscribers from each year still active today</div>
                        <div className="grid grid-cols-7 gap-3 mb-6">
                          {Object.entries(subscriberMetrics.data.cohort_survival).map(([year, pct]) => {
                            const survColor = pct >= 40 ? 'text-emerald-400' : pct >= 20 ? 'text-cyan-400' : pct >= 10 ? 'text-amber-400' : 'text-red-400'
                            const barColor = pct >= 40 ? 'bg-emerald-500' : pct >= 20 ? 'bg-cyan-500' : pct >= 10 ? 'bg-amber-500' : 'bg-red-500'
                            return (
                              <div key={year} className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg p-3 text-center border border-gray-700/30">
                                <div className="text-gray-300 text-sm font-semibold mb-2">{year}</div>
                                <div className={`text-2xl font-black ${survColor}`}>{pct}%</div>
                                <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <div className="text-gray-400 text-sm mt-1">still active</div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* Avg Duration by Signup Year */}
                    {subscriberMetrics.data.avg_duration_by_year && Object.keys(subscriberMetrics.data.avg_duration_by_year).length > 0 && (
                      <>
                        <div className="text-gray-400 text-sm font-medium mb-3 tracking-wide">AVG SUBSCRIPTION DURATION BY SIGNUP YEAR</div>
                        <div className="text-gray-500 text-sm mb-4">Average months subscribed before cancellation</div>
                        <div className="grid grid-cols-7 gap-3 mb-6">
                          {Object.entries(subscriberMetrics.data.avg_duration_by_year).map(([year, months]) => {
                            const durColor = months >= 12 ? 'text-emerald-400' : months >= 8 ? 'text-cyan-400' : months >= 4 ? 'text-amber-400' : 'text-red-400'
                            const barColor = months >= 12 ? 'bg-emerald-500' : months >= 8 ? 'bg-cyan-500' : months >= 4 ? 'bg-amber-500' : 'bg-red-500'
                            const maxMonths = Math.max(...Object.values(subscriberMetrics.data!.avg_duration_by_year))
                            const barWidth = maxMonths > 0 ? (months / maxMonths) * 100 : 0
                            return (
                              <div key={year} className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg p-3 text-center border border-gray-700/30">
                                <div className="text-gray-300 text-sm font-semibold mb-2">{year}</div>
                                <div className={`text-2xl font-black ${durColor}`}>{Number(months).toFixed(1)}</div>
                                <div className="text-gray-400 text-sm">months</div>
                                <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${barWidth}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* Renewal Trend by Cohort */}
                    {subscriberMetrics.data.renewal_trend && (
                      <div className="pt-4 border-t border-gray-700/50">
                        <div className="text-gray-400 text-sm font-medium mb-3 tracking-wide">AVG REVENUE PER SUB BY COHORT</div>
                        <div className="grid grid-cols-5 gap-4">
                          {[
                            { label: '2023 Cohort', value: subscriberMetrics.data.renewal_trend.cohort_2023_avg, color: 'text-gray-400' },
                            { label: '2024 Cohort', value: subscriberMetrics.data.renewal_trend.cohort_2024_avg, color: 'text-blue-400' },
                            { label: '2025 Cohort', value: subscriberMetrics.data.renewal_trend.cohort_2025_avg, color: 'text-cyan-400' },
                            { label: '2026 Cohort', value: subscriberMetrics.data.renewal_trend.cohort_2026_avg, color: 'text-emerald-400' },
                            { label: 'Projected 12mo', value: subscriberMetrics.data.renewal_trend.projected_12mo_avg, color: 'text-amber-400' },
                          ].map(item => (
                            <div key={item.label} className="text-center">
                              <div className={`text-2xl font-bold ${item.color}`}>${item.value.toFixed(2)}</div>
                              <div className="text-gray-400 text-sm">{item.label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="text-center mt-3">
                          <span className="text-emerald-400 text-sm font-semibold">+{subscriberMetrics.data.renewal_trend.projected_increase_pct}%</span>
                          <span className="text-gray-500 text-sm"> projected revenue increase per subscriber</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Immediate Cancels by Month */}
                {subscriberMetrics?.available && subscriberMetrics.data?.immediate_cancels_by_month && (
                  <div className="bg-[#111827] rounded-xl p-6 border border-gray-800/50">
                    <div className="text-gray-300 text-lg font-semibold tracking-wide mb-1">IMMEDIATE CANCELS BY MONTH</div>
                    <div className="text-gray-500 text-sm mb-5">Subscribers who cancelled within 30 days of signing up</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {Object.entries(subscriberMetrics.data.immediate_cancels_by_month).map(([month, count]) => {
                        const rate = subscriberMetrics.data?.immediate_cancel_rate_by_month?.[month] || 0
                        const newAdds = subscriberMetrics.data?.new_adds_by_month?.[month] || 0
                        const intensity = Math.min(rate / 20, 1)
                        return (
                          <div key={month} className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg p-3 text-center border border-gray-700/30 hover:border-red-500/30 transition-colors">
                            <div className="text-gray-300 text-sm font-medium mb-2">{month}</div>
                            <div className={`text-2xl font-black ${count > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                              {count}
                            </div>
                            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${intensity * 100}%` }} />
                            </div>
                            <div className="text-gray-400 text-sm mt-1.5">
                              {rate}% of {newAdds}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Status Breakdown Table */}
                <div className="bg-[#111827] rounded-xl p-6 border border-gray-800/50">
                  <div className="text-gray-300 text-lg font-semibold tracking-wide mb-1">STATUS BREAKDOWN</div>
                  <div className="text-gray-500 text-sm mb-5">All subscription statuses with counts and revenue</div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400 tracking-wide">STATUS</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 tracking-wide">COUNT</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 tracking-wide">% OF TOTAL</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-400 tracking-wide">TOTAL REVENUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.status_breakdown.map((status, idx) => {
                          const statusColors: Record<string, string> = {
                            'Active': 'text-emerald-400',
                            'On Hold': 'text-yellow-400',
                            'Cancelled': 'text-red-400',
                            'Pending Cancel': 'text-orange-400',
                          }
                          const dotColors: Record<string, string> = {
                            'Active': 'bg-emerald-400',
                            'On Hold': 'bg-yellow-400',
                            'Cancelled': 'bg-red-400',
                            'Pending Cancel': 'bg-orange-400',
                          }
                          return (
                            <tr key={idx} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2.5 h-2.5 rounded-full ${dotColors[status.status] || 'bg-gray-500'}`} />
                                  <span className={`font-medium text-lg ${statusColors[status.status] || 'text-gray-300'}`}>{status.status}</span>
                                </div>
                              </td>
                              <td className="text-right py-3 px-4 font-bold text-white text-lg">
                                {formatNumber(status.count)}
                              </td>
                              <td className="text-right py-3 px-4">
                                <span className="inline-flex items-center rounded-full bg-gray-800 px-3 py-1 text-sm font-medium text-gray-300">
                                  {status.percentage.toFixed(1)}%
                                </span>
                              </td>
                              <td className="text-right py-3 px-4 font-bold text-white text-lg">
                                {formatCurrency(status.total_revenue)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-800/30">
                          <td className="py-3 px-4 font-bold text-cyan-400 text-lg">Total</td>
                          <td className="text-right py-3 px-4 font-bold text-cyan-400 text-lg">
                            {formatNumber(subscriptions.metrics.total_subscriptions)}
                          </td>
                          <td className="text-right py-3 px-4 font-bold text-cyan-400">100%</td>
                          <td className="text-right py-3 px-4 font-bold text-cyan-400 text-lg">
                            {formatCurrency(subscriptions.status_breakdown.reduce((sum, s) => sum + s.total_revenue, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Last Updated */}
                <p className="text-xs text-gray-600 text-right">
                  Last updated: {new Date(subscriptions.last_updated).toLocaleString()}
                </p>
              </>
            ) : (
              <div className="bg-[#111827] rounded-xl p-12 text-center border border-gray-800/50">
                <p className="text-gray-500">Failed to load subscription data</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageContent />
    </Suspense>
  )
}
