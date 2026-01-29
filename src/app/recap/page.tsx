'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import './recap.css';

// Types
interface RecapData {
  displayMonth: string;
  months: string[];
  profitShare: number[];
  trainingPlans: number[];
  renewals: number[];
  subscribers: number[];
  newVisitors: number[];
  paidVisitors: number[];
  cpc: number[];
  refundPct: number[];
  intuitSales: number[];
  refundDollars: number[];
  chargebackDollars: number[];
  learnerUnits: number[];
  certUnits: number[];
  teamUnits: number[];
  cancels: number[];
  comments: Record<string, string>;
  expenseItems: string[];
}

// Logo SVG as data URI (QuickBooks logo)
const logoDataUri = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSJub25lIiB2aWV3Qm94PSIwIDAgMTU3IDQwIj48cGF0aCBmaWxsPSIjMkNBMDFDIiBkPSJNMTcuOTk5NyAzNkMyNy45NDEyIDM2IDM2IDI3Ljk0MTIgMzYgMTcuOTk5NyAzNiA4LjA1ODgzIDI3Ljk0MTIgMCAxNy45OTk3IDAgOC4wNTg4MyAwIDAgOC4wNTg4MyAwIDE3Ljk5OTcgMCAyNy45NDEyIDguMDU4ODMgMzYgMTcuOTk5NyAzNloiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMTEuOTk3OCAxMC45OTg2Yy0zLjg2ODE5IDAtNi45OTk4OCAzLjEzNjQtNi45OTk4OCA3LjAwMDUgMCAzLjg2MzYgMy4xMzE2OSA2Ljk5OTMgNi45OTk4OCA2Ljk5OTNoLjk5OTl2LTIuNTk5OGgtMS4wMDA0Yy0xLjE2NjYtLjAwMDgtMi4yODUxOC0uNDY0Ni0zLjExMDA3LTEuMjg5NS0uODI0ODgtLjgyNDktMS4yODg2NC0xLjk0MzQtMS4yODk0Mi0zLjExIDAtMi40Mjc5IDEuOTcxNTYtNC40MDA2IDQuMzk5NDktNC40MDA2aDIuNDA0NHYxMy42MDAzYy4wMDAyLjY4OTMuMjc0MSAxLjM1MDMuNzYxNSAxLjgzNzguNDg3NS40ODc0IDEuMTQ4NS43NjEzIDEuODM3OC43NjE1VjEwLjk5OTJoLTUuMDAzN2wuMDAwNS0uMDAwNlptMTIuMDA3OCAxMy45OTk4YzMuODY3NyAwIDctMy4xMzU3IDctNi45OTk5IDAtMy44NjM1LTMuMTMxNy02Ljk5OTMtNy02Ljk5OTNoLS45OTk4djIuNTk5OWgxLjAwMDRjMi40Mjc5IDAgNC4zOTk1IDEuOTcyMSA0LjM5OTUgNC40cy0xLjk3MTYgNC40MDA2LTQuMzk5NSA0LjQwMDZoLTIuNDA0NVY4Ljc5ODg5Yy0uMDAwMS0uNjg5NDMtLjI3NDEtMS4zNTA1OC0uNzYxNy0xLjgzODAyLS40ODc1LS40ODc0NS0xLjE0ODctLjc2MTI5LTEuODM4MS0uNzYxMjlWMjQuOTk5aDUuMDA0M3YtLjAwMTFsLS4wMDA2LjAwMDVaIi8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTUyLjYxMTYgNDBoLTIuNzU5NXYtNi45ODc4aC0uMDQ2M2MtLjcxMzcgMS4xMDE0LTIuMTE3MSAxLjc5MTMtMy42NTUxIDEuNzkxMy0zLjM1NzEgMC01LjQyNjEtMi42NjczLTUuNDI2MS01Ljg4NTggMC0zLjIxOTEgMi4yMDc1LTUuNzk0OCA1LjM1NDgtNS43OTQ4IDIuMDIxNCAwIDMuMjY2MS45ODY3IDMuODE2OCAxLjg2MjZoLjA2NzJ2LTEuNTQyaDIuNjQzNXYxNi41NTU5bC4wMDQ3LjAwMDZabS01LjkwNjEtNy40OTU3YzIuMDIxNCAwIDMuMjQxNy0xLjgxNDQgMy4yNDE3LTMuNTM5MSAwLTEuNzI0LTEuMjE2OC0zLjU4NjYtMy4yNDE3LTMuNTg2Ni0yLjEzNjMgMC0zLjE3MSAxLjgxNTYtMy4xNzEgMy41Mzk3LS4wMDQxIDEuNzI0IDEuMDMwNyAzLjU4NzIgMy4xNzEgMy41ODcydi0uMDAxMlptMTguMjkyMSAxLjk3OGgtMi42MjAydi0xLjc3MTZoLS4wNDc2Yy0uNDgyOSAxLjEwMTUtMS43OTEzIDIuMDkyOC0zLjQyNDMgMi4wOTI4LTIuODczNiAwLTQuMDcwOC0yLjIwODctNC4wNzA4LTQuNDU5MnYtNi44OTY4aDIuNzU4OXY2LjExNmMwIDEuMzEyNC4yOTc0IDIuOTQwOCAyLjA2ODQgMi45NDA4IDEuNzcxNiAwIDIuNTc2Mi0xLjUxNzYgMi41NzYyLTIuOTg4NHYtNi4wNjg0aDIuNzU4M3YxMS4wMzQ4aC4wMDExWm0yLjc3MTYtMTEuMjc1OWgyLjc1ODl2MTEuMDM0OGgtMi43NTg5VjIzLjIwNjRabTEzLjA3MjUgMy4yOTc5Yy0uNDM1OS0uNjIyNi0xLjM3OTctMS4wODIzLTIuMjc1NC0xLjA4MjMtMi4wMjE0IDAtMy4wMzU5IDEuODE1MS0zLjAzNTkgMy41MzkyIDAgMS43MjQgMS4wMzQ4IDMuNTM5NyAzLjEyNyAzLjUzOTcuODUyMSAwIDEuNzkxMy0uMzQ1IDIuMzIyOC0uOTg2N2wxLjcyNDEgMS43NDc4Yy0uOTIuOTg2Ny0yLjQzODIgMS41NDIxLTQuMDcwNyAxLjU0MjEtMy4yNjYxIDAtNS45Nzc0LTIuMTYtNS45Nzc0LTUuODM3NyAwLTMuNjc4MyAyLjY2NzgtNS44Mzk0IDUuOTEwMS01LjgzOTQgMS42MDkzIDAgMy4yODU4LjY0MjMgNC4xNjEyIDEuNzI0bC0xLjg4NTggMS42NTMzWm0zLjI0ODEtOS40MDA1aDIuNzU4M3YxMC45ODY2aC4wNjc4bDQuMTg0OS00LjY0NTJoMy41Mzk3bC00Ljc4MDIgNC45OTAyTDk0Ljk0MiAzNC40OGgtMy42NTQ1bC00LjM2ODEtNS42NTYyaC0uMDY3M1YzNC40OGgtMi43NTgyVjE3LjEwMzhoLS4wMDQxWm0xNC44Njg0IDB2Ny43NDg0aC4wNjczYy41NzUtLjcxMzEgMS42Nzc1LTEuNzI0MSAzLjcwMTUtMS43MjQxIDMuMTUxIDAgNS4zNTUgMi41Mjg3IDUuMzU1IDUuNzk0OCAwIDMuMjY2MS0yLjA2OSA1Ljg4NjQtNS40MjYgNS44ODY0LTEuNTQyIDAtMy4wMzYzLS43MTMxLTMuNzkyOS0xLjk3OGgtLjA0NzV2MS42NTY4aC0yLjYxOTdWMTcuMTAzOGgyLjc2MjNabTMuMTUwOCA4LjI3NTljLTIuMDIyIDAtMy4yNDE4IDEuODYyNi0zLjI0MTggMy41ODY3IDAgMS43MjQgMS4yMTU4IDMuNTM5NyAzLjI0MTggMy41Mzk3IDIuMTM3IDAgMy4xNy0xLjg2MzIgMy4xNy0zLjU4NzggMC0xLjcyNDctMS4wMzMtMy41Mzg2LTMuMTctMy41Mzg2Wm0xMy4xNzItMi4yNTI3YzMuMzMzIDAgNi4wMDEgMi4zMjI5IDYuMDAxIDUuNzk0NyAwIDMuNDcyNS0yLjY2OCA1Ljg4NjQtNi4wMDEgNS44ODY0LTMuMzM0IDAtNi4wMDEtMi40MTM5LTYuMDAxLTUuODg2NCAwLTMuNDcxOCAyLjY2Ny01Ljc5NDcgNi4wMDEtNS43OTQ3Wm0wIDkuMzc4NWMyLjE4MyAwIDMuMTk0LTEuODYyNiAzLjE5NC0zLjU4NzggMC0xLjcyNDctMS4wMTEtMy41MzkxLTMuMTk0LTMuNTM5MS0yLjE4NCAwLTMuMTk1IDEuODE1Ni0zLjE5NSAzLjUzOTEgMCAxLjcyNCAxLjAxMSAzLjU4NzggMy4xOTUgMy41ODc4Wm0xMy4yMDQtOS4zNzg1YzMuMzMzIDAgNi4wMDEgMi4zMjI5IDYuMDAxIDUuNzk0NyAwIDMuNDcyNS0yLjY2OCA1Ljg4NjQtNi4wMDEgNS44ODY0LTMuMzM0IDAtNi4wMDEtMi40MTM5LTYuMDAxLTUuODg2NCAwLTMuNDcxOCAyLjY2Ny01Ljc5NDcgNi4wMDEtNS43OTQ3Wm0wIDkuMzc4NWMyLjE4NCAwIDMuMTk0LTEuODYyNiAzLjE5NC0zLjU4NzggMC0xLjcyNDctMS4wMS0zLjUzOTEtMy4xOTQtMy41Mzkxcy0zLjE5NSAxLjgxNTYtMy4xOTUgMy41MzkxYy0uMDA0IDEuNzI0IDEuMDExIDMuNTg3OCAzLjE5NSAzLjU4NzhabTcuNjctMTUuNDAxN2gyLjc1OXYxMC45ODY2aC4wNjdsNC4xODYtNC42NDUyaDMuNTM5bC00Ljc4IDQuOTkwMiA1LjA4MSA2LjA0NDZoLTMuNjU0bC00LjM2OC01LjY1NjJoLS4wNjdWMzQuNDhoLTIuNzU5VjE3LjEwMzhoLS4wMDRabTE4LjM3OSA5LjI4NDZjLS40ODQtLjY0MTctMS40MDMtMS4xOTY1LTIuNDEzLTEuMTk2NS0uODcyIDAtMS43NzMuMzIxNy0xLjc3MyAxLjE5NzEgMCAuODc1My44NTMgMS4wODE3IDIuMzkgMS40NDY0IDEuNjM0LjM5MjQgMy41NjQgMS4xMjU4IDMuNTY0IDMuMjg1OCAwIDIuNjkxNi0yLjE4NCAzLjY3ODItNC41OTggMy42NzgyLTEuNyAwLTMuNDcyLS42NDE3LTQuNTMtMS44MTUxbDEuODE1LTEuNzAwOGMuNTk5Ljc4MDggMS42MzQgMS4zNzk3IDIuODI2IDEuMzc5Ny44MDUgMCAxLjc3Mi0uMzIxOCAxLjc3Mi0xLjMxMjUgMC0uOTE5NC0uODUzLTEuMTk2NS0yLjUyOS0xLjU4NTUtMS42MzMtLjM5MjQtMy4yNjYtMS4wNTgtMy4yNjYtMy4xMjY5IDAtMi40NjE1IDIuMjA4LTMuNTE1NCA0LjM5Mi0zLjUxNTQgMS41ODUgMCAzLjI0Mi41NTA3IDQuMTM4IDEuNjc2NWwtMS43ODggMS41ODk2di0uMDAwNlpNNzAuOTQ2NiA4LjM4MjYxYzAgMi43OTc2OSAyLjIzOTUgNC44NDI4OSA1LjA4NTIgNC44NDI4OSAyLjg0NjQgMCA1LjA4OTMtMi4wNDA2IDUuMDg5My00Ljg0Mjg5VjEuOTU3NjloLTIuNzU4MnY2LjA5NjIzYzAgMS41MDk1Ni0xLjAxMTEgMi41MjA1OC0yLjMzODYgMi41MjA1OC0xLjMyODEgMC0yLjMzOTEtMS4wMTEwMi0yLjMzOTEtMi41MjA1OFYxLjk1NzY5aC0yLjc1NDhsLjAxNjIgNi40MjQ5MlptMTcuNTQ1LTMuODQ0NjNoMy4yOTA0djguNDY0OTJoMi43NTQ4VjQuNTM3OThoMy4yODUyVjEuOTU3NjloLTkuMzMwNHYyLjU4MDI5Wm0tMS43ODMyLTIuNTgwMjloLTIuNzU0OFYxMy4wMDQ2aDIuNzU0OFYxLjk1NzY5Wk01OS44MTkxIDQuNTM3OThoMy4yODk5djguNDY0OTJoMi43NTQ3VjQuNTM3OThoMy4yODU4VjEuOTU3NjloLTkuMzI5OFY0LjUzNzRsLS4wMDA2LjAwMDU4Wk00NS4zNTg4IDEuOTU3NjlINDIuNjA0VjEzLjAwNDZoMi43NTQ4VjEuOTU3NjlabTEzLjAwODEgNC42MjIwMmMwLTIuNzk3NjgtMi4yNDM1LTQuODQyODktNS4wODkzLTQuODQyODktMi44NDYzIDAtNS4wODkyIDIuMDQxMTYtNS4wODkyIDQuODQzNDh2Ni40MjQ5aDIuNzU0OFY2LjkwODk5YzAtMS41MTAxNSAxLjAxMDQtMi41MjA1OCAyLjMzODUtMi41MjA1OCAxLjMyNzUgMCAyLjMzODYgMS4wMTA0MyAyLjMzODYgMi41MjA1OHY2LjA5NjIxaDIuNzU0N2wtLjAwODEtNi40MjQ5di0uMDAwNTlaIi8+PC9zdmc+';

// Chart colors
const COLORS = {
  green: '#2CA01C',
  blue: '#007aff',
  purple: '#af52de',
  orange: '#ff9500',
  teal: '#5ac8fa',
  red: '#ff3b30'
};

// Navigation sections
const SECTIONS = [
  { id: 0, label: 'A Note From David', icon: 'message' },
  { id: 1, label: 'Profit Share', icon: 'dollar' },
  { id: 2, label: 'Customer Revenue', icon: 'chart' },
  { id: 3, label: 'Subscribers', icon: 'users' },
  { id: 4, label: 'Website Traffic', icon: 'eye' },
  { id: 5, label: 'Refunds and Chargebacks', icon: 'receipt' },
  { id: 6, label: 'Intuit Sales', icon: 'shield' },
  { id: 7, label: 'Expense Highlights', icon: 'dollar' },
];

// Helper functions
const formatCurrency = (value: number, decimals = 0) => {
  return '$' + value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatComment = (text: string | undefined) => {
  if (!text) return <p>No comments for this period.</p>;
  return text.split('\n').filter(p => p.trim()).map((p, i) => <p key={i}>{p.trim()}</p>);
};

// SVG Icons
const Icons = {
  message: (
    <svg className="recap-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  ),
  dollar: (
    <svg className="recap-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: (
    <svg className="recap-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  users: (
    <svg className="recap-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  eye: (
    <svg className="recap-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  receipt: (
    <svg className="recap-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
    </svg>
  ),
  shield: (
    <svg className="recap-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  check: (
    <svg className="recap-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  ),
  chevronLeft: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronRight: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// Main Component
export default function RecapPage() {
  const [data, setData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    fetch('/api/recap')
      .then(res => {
        if (!res.ok) throw new Error('No data available');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="recap-page">
        <div className="recap-loading">
          <div className="recap-loading-spinner" />
          <div className="recap-loading-text">Loading recap data...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="recap-page">
        <div className="recap-error">
          <div className="recap-error-icon">📊</div>
          <h1 className="recap-error-title">No Recap Data Available</h1>
          <p className="recap-error-message">
            The monthly recap data hasn&apos;t been uploaded yet. Please trigger the n8n workflow to populate the data.
          </p>
        </div>
      </div>
    );
  }

  // Computed values
  const currentPS = data.profitShare[data.profitShare.length - 1] || 0;
  const lastYearPS = data.profitShare.length >= 13 ? data.profitShare[data.profitShare.length - 13] : 0;
  const yoyChangePS = currentPS - lastYearPS;
  const yoyChangePSPct = lastYearPS > 0 ? ((currentPS - lastYearPS) / lastYearPS * 100) : 0;

  const currentTrainingPlans = data.trainingPlans[data.trainingPlans.length - 1] || 0;
  const lastYearTrainingPlans = data.trainingPlans.length >= 13 ? data.trainingPlans[data.trainingPlans.length - 13] : 0;
  const yoyChangeTpPct = lastYearTrainingPlans > 0 ? ((currentTrainingPlans - lastYearTrainingPlans) / lastYearTrainingPlans * 100) : 0;

  const currentRenewals = data.renewals[data.renewals.length - 1] || 0;
  const lastYearRenewals = data.renewals.length >= 13 ? data.renewals[data.renewals.length - 13] : 0;
  const yoyChangeRnPct = lastYearRenewals > 0 ? ((currentRenewals - lastYearRenewals) / lastYearRenewals * 100) : 0;

  const currentNewVisitors = data.newVisitors[data.newVisitors.length - 1] || 0;
  const lastYearNewVisitors = data.newVisitors.length >= 13 ? data.newVisitors[data.newVisitors.length - 13] : 0;
  const yoyChangeNvPct = lastYearNewVisitors > 0 ? ((currentNewVisitors - lastYearNewVisitors) / lastYearNewVisitors * 100) : 0;

  const currentPaidVisitors = data.paidVisitors[data.paidVisitors.length - 1] || 0;
  const lastYearPaidVisitors = data.paidVisitors.length >= 13 ? data.paidVisitors[data.paidVisitors.length - 13] : 0;
  const yoyChangePvPct = lastYearPaidVisitors > 0 ? ((currentPaidVisitors - lastYearPaidVisitors) / lastYearPaidVisitors * 100) : 0;

  const currentCpc = data.cpc[data.cpc.length - 1] || 0;
  const lastYearCpc = data.cpc.length >= 13 ? data.cpc[data.cpc.length - 13] : 0;
  const yoyChangeCpcPct = lastYearCpc > 0 ? ((currentCpc - lastYearCpc) / lastYearCpc * 100) : 0;

  // Subscribers YoY
  const currentSubscribers = data.subscribers[data.subscribers.length - 1] || 0;
  const lastYearSubscribers = data.subscribers.length >= 13 ? data.subscribers[data.subscribers.length - 13] : 0;
  const yoyChangeSubsPct = lastYearSubscribers > 0 ? ((currentSubscribers - lastYearSubscribers) / lastYearSubscribers * 100) : 0;

  // Current month churn
  const currentCancels = data.cancels[data.cancels.length - 1] || 0;
  const currentChurnPct = currentSubscribers > 0 ? (currentCancels / currentSubscribers * 100) : 0;

  // Refunds YoY
  const currentRefundDollars = data.refundDollars[data.refundDollars.length - 1] || 0;
  const currentChargebackDollars = data.chargebackDollars[data.chargebackDollars.length - 1] || 0;
  const currentTotalRefunds = currentRefundDollars + currentChargebackDollars;
  const lastYearRefundDollars = data.refundDollars.length >= 13 ? data.refundDollars[data.refundDollars.length - 13] : 0;
  const lastYearChargebackDollars = data.chargebackDollars.length >= 13 ? data.chargebackDollars[data.chargebackDollars.length - 13] : 0;
  const lastYearTotalRefunds = lastYearRefundDollars + lastYearChargebackDollars;
  const yoyChangeRefundsPct = lastYearTotalRefunds > 0 ? ((currentTotalRefunds - lastYearTotalRefunds) / lastYearTotalRefunds * 100) : 0;

  // Refund rate YoY
  const currentRefundPct = (data.refundPct[data.refundPct.length - 1] || 0) * 100;
  const lastYearRefundPct = data.refundPct.length >= 13 ? (data.refundPct[data.refundPct.length - 13] || 0) * 100 : 0;
  const yoyChangeRefundRatePct = lastYearRefundPct > 0 ? ((currentRefundPct - lastYearRefundPct) / lastYearRefundPct * 100) : 0;

  // Intuit Sales YoY
  const currentIntuitSales = data.intuitSales[data.intuitSales.length - 1] || 0;
  const lastYearIntuitSales = data.intuitSales.length >= 13 ? data.intuitSales[data.intuitSales.length - 13] : 0;
  const yoyChangeIntuitPct = lastYearIntuitSales > 0 ? ((currentIntuitSales - lastYearIntuitSales) / lastYearIntuitSales * 100) : 0;

  const totalRefundsChargebacks = data.refundDollars.map((r, i) => r + (data.chargebackDollars[i] || 0));

  // 6 Month Average Churn
  const sixMonthAvgChurn = (() => {
    const last6Cancels = data.cancels.slice(-6);
    const last6Subs = data.subscribers.slice(-6);
    let totalChurnPct = 0;
    let validMonths = 0;
    for (let i = 0; i < last6Cancels.length; i++) {
      if (last6Subs[i] > 0) {
        totalChurnPct += (last6Cancels[i] / last6Subs[i]) * 100;
        validMonths++;
      }
    }
    return validMonths > 0 ? (totalChurnPct / validMonths).toFixed(2) : '0.00';
  })();

  // 6 Month Average Refund Rate
  const sixMonthAvgRefundRate = (() => {
    const last6RefundPct = data.refundPct.slice(-6);
    const sum = last6RefundPct.reduce((a, b) => a + b, 0);
    return last6RefundPct.length > 0 ? ((sum / last6RefundPct.length) * 100).toFixed(2) : '0.00';
  })();

  const last6Learner = data.learnerUnits.slice(-6).reduce((a, b) => a + b, 0);
  const last6Cert = data.certUnits.slice(-6).reduce((a, b) => a + b, 0);
  const last6Team = data.teamUnits.slice(-6).reduce((a, b) => a + b, 0);
  const totalUnits = last6Learner + last6Cert + last6Team;
  const learnerPct = totalUnits > 0 ? Math.round(last6Learner / totalUnits * 100) : 0;
  const certPct = totalUnits > 0 ? Math.round(last6Cert / totalUnits * 100) : 0;
  const teamPct = totalUnits > 0 ? Math.round(last6Team / totalUnits * 100) : 0;

  const t6 = data.trainingPlans.slice(-6).reduce((a, b) => a + b, 0);
  const r6 = data.renewals.slice(-6).reduce((a, b) => a + b, 0);
  const revTotal = t6 + r6;
  const revTpPct = revTotal > 0 ? Math.round(t6 / revTotal * 100) : 0;
  const revRnPct = revTotal > 0 ? Math.round(r6 / revTotal * 100) : 0;

  // Transform data for Recharts
  const chartData = data.months.map((month, i) => ({
    month,
    profitShare: data.profitShare[i],
    trainingPlans: data.trainingPlans[i],
    renewals: data.renewals[i],
    subscribers: data.subscribers[i],
    newVisitors: data.newVisitors[i],
    paidVisitors: data.paidVisitors[i],
    cpc: data.cpc[i],
    refundPct: data.refundPct[i] * 100,
    intuitSales: data.intuitSales[i],
    totalRefundsChargebacks: totalRefundsChargebacks[i],
  }));

  const goToSection = (index: number) => {
    setActiveSection(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '14px', fontWeight: 700 }}>
        {`${((percent || 0) * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderNavButton = (direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? activeSection - 1 : activeSection + 1;
    const isDisabled = direction === 'prev' ? activeSection === 0 : activeSection === SECTIONS.length - 1;
    const label = direction === 'prev'
      ? (activeSection > 0 ? `Previous: ${SECTIONS[activeSection - 1].label}` : 'Previous')
      : (activeSection < SECTIONS.length - 1 ? `Next: ${SECTIONS[activeSection + 1].label}` : 'Next');

    return (
      <button
        className="recap-nav-btn"
        disabled={isDisabled}
        onClick={() => !isDisabled && goToSection(targetIndex)}
      >
        {direction === 'prev' && Icons.chevronLeft}
        {label}
        {direction === 'next' && Icons.chevronRight}
      </button>
    );
  };

  return (
    <div className="recap-page">
      {/* Header */}
      <header className="recap-header">
        <div className="recap-header-top">
          <div className="recap-header-title">
            <h1>How We&apos;re Doing</h1>
            <div className="recap-header-subtitle">{data.displayMonth} Monthly Recap</div>
          </div>
          <div className="recap-header-brand">
            <img className="recap-header-logo" src={logoDataUri} alt="QuickBooks Training" />
            <div className="recap-header-brand-name">QuickBooksTraining.com</div>
          </div>
        </div>
      </header>

      <div className="recap-main-layout">
        {/* Sidebar */}
        <nav className="recap-sidebar">
          <div className="recap-sidebar-title">Sections</div>
          {SECTIONS.map((section) => (
            <div
              key={section.id}
              className={`recap-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => goToSection(section.id)}
            >
              {Icons[section.icon as keyof typeof Icons]}
              {section.label}
            </div>
          ))}
        </nav>

        {/* Content */}
        <main className="recap-content">
          {/* Section 0: A Note From David */}
          <section className={`recap-section ${activeSection === 0 ? 'active' : ''}`}>
            <div className="recap-section-header">
              <h2 className="recap-section-title">A Note From David</h2>
              <p className="recap-section-subtitle">{data.displayMonth} Monthly Recap</p>
            </div>
            <div className="recap-commentary">
              {formatComment(data.comments.a_note_from_david)}
            </div>
            <div className="recap-bottom-nav">
              {renderNavButton('prev')}
              {renderNavButton('next')}
            </div>
          </section>

          {/* Section 1: Profit Share */}
          <section className={`recap-section ${activeSection === 1 ? 'active' : ''}`}>
            <div className="recap-section-header">
              <h2 className="recap-section-title">Profit Share</h2>
              <p className="recap-section-subtitle">Monthly profit share performance and year-over-year comparison</p>
            </div>
            <div className="recap-chart-container">
              <div className="recap-chart-title">24-Month Trend</div>
              <div className="recap-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="profitShare" stroke={COLORS.green} strokeWidth={2.5} dot={{ fill: COLORS.green, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="recap-comparison-row">
                <div className="recap-comparison-item">
                  <div className="recap-comparison-value">{formatCurrency(currentPS)}</div>
                  <div className="recap-comparison-label">Current Month</div>
                </div>
                <div className="recap-comparison-item">
                  <div className="recap-comparison-value">{formatCurrency(lastYearPS)}</div>
                  <div className="recap-comparison-label">Same Month Last Year</div>
                </div>
                <div className="recap-comparison-item">
                  <div className={`recap-comparison-value ${yoyChangePS >= 0 ? 'green' : ''}`}>
                    {yoyChangePS >= 0 ? '+' : ''}{formatCurrency(Math.abs(yoyChangePS))} ({yoyChangePSPct >= 0 ? '+' : ''}{yoyChangePSPct.toFixed(0)}%)
                  </div>
                  <div className="recap-comparison-label">YoY Change</div>
                </div>
              </div>
            </div>
            <div className="recap-commentary">
              <h3>Commentary</h3>
              {formatComment(data.comments.profit_share)}
            </div>
            <div className="recap-bottom-nav">
              {renderNavButton('prev')}
              {renderNavButton('next')}
            </div>
          </section>

          {/* Section 2: Customer Revenue */}
          <section className={`recap-section ${activeSection === 2 ? 'active' : ''}`}>
            <div className="recap-section-header">
              <h2 className="recap-section-title">Customer Revenue</h2>
              <p className="recap-section-subtitle">Training plan sales and renewal revenue</p>
            </div>
            <div className="recap-chart-container">
              <div className="recap-chart-title">Revenue Trend</div>
              <div className="recap-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="trainingPlans" name="Training Plans" stroke={COLORS.blue} strokeWidth={2.5} dot={{ fill: COLORS.blue, r: 4 }} />
                    <Line type="monotone" dataKey="renewals" name="Renewals" stroke={COLORS.green} strokeWidth={2.5} dot={{ fill: COLORS.green, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="recap-yoy-panels" style={{ marginBottom: 24 }}>
              <div className="recap-yoy-panel">
                <div className="recap-yoy-panel-title">Training Plans YoY</div>
                <div className="recap-yoy-panel-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{formatCurrency(currentTrainingPlans)}</div>
                    <div className="recap-yoy-panel-label">{data.displayMonth}</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{formatCurrency(lastYearTrainingPlans)}</div>
                    <div className="recap-yoy-panel-label">Prior Year</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className={`recap-yoy-panel-value ${yoyChangeTpPct >= 0 ? 'green' : ''}`}>
                      {yoyChangeTpPct >= 0 ? '+' : ''}{yoyChangeTpPct.toFixed(1)}%
                    </div>
                    <div className="recap-yoy-panel-label">YoY Change</div>
                  </div>
                </div>
              </div>
              <div className="recap-yoy-panel">
                <div className="recap-yoy-panel-title">Renewals YoY</div>
                <div className="recap-yoy-panel-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{formatCurrency(currentRenewals)}</div>
                    <div className="recap-yoy-panel-label">{data.displayMonth}</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{formatCurrency(lastYearRenewals)}</div>
                    <div className="recap-yoy-panel-label">Prior Year</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className={`recap-yoy-panel-value ${yoyChangeRnPct >= 0 ? 'green' : ''}`}>
                      {yoyChangeRnPct >= 0 ? '+' : ''}{yoyChangeRnPct.toFixed(1)}%
                    </div>
                    <div className="recap-yoy-panel-label">YoY Change</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="recap-two-col">
              <div className="recap-chart-container">
                <div className="recap-chart-title">Revenue Mix (6 Mo)</div>
                <div className="recap-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'Training Plans', value: t6 }, { name: 'Renewals', value: r6 }]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={0}
                        dataKey="value"
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        <Cell fill={COLORS.blue} />
                        <Cell fill={COLORS.green} />
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.blue }} />
                    <span>Training Plans</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.green }} />
                    <span>Renewals</span>
                  </div>
                </div>
              </div>
              <div className="recap-chart-container">
                <div className="recap-chart-title">Units Sold (6 Mo)</div>
                <div className="recap-chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'Learner', value: last6Learner }, { name: 'Cert', value: last6Cert }, { name: 'Team', value: last6Team }]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={0}
                        dataKey="value"
                        labelLine={false}
                        label={renderPieLabel}
                      >
                        <Cell fill={COLORS.purple} />
                        <Cell fill={COLORS.green} />
                        <Cell fill={COLORS.orange} />
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()} units`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.purple }} />
                    <span>Learner</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.green }} />
                    <span>Cert</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: COLORS.orange }} />
                    <span>Team</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="recap-commentary">
              <h3>Commentary</h3>
              {formatComment(data.comments.customer_revenue)}
            </div>
            <div className="recap-bottom-nav">
              {renderNavButton('prev')}
              {renderNavButton('next')}
            </div>
          </section>

          {/* Section 3: Subscribers */}
          <section className={`recap-section ${activeSection === 3 ? 'active' : ''}`}>
            <div className="recap-section-header">
              <h2 className="recap-section-title">Subscriber Growth</h2>
              <p className="recap-section-subtitle">Active subscriber base and retention metrics</p>
            </div>
            <div className="recap-chart-container">
              <div className="recap-chart-title"># of Subscribers</div>
              <div className="recap-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis domain={[6000, 'auto']} tickFormatter={(v) => v.toLocaleString()} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} subscribers`} />
                    <Line type="monotone" dataKey="subscribers" stroke={COLORS.purple} strokeWidth={2.5} dot={{ fill: COLORS.purple, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="recap-refunds-summary">
              <div className="recap-refunds-metrics">
                <div className="recap-metric-card">
                  <div className="recap-metric-label">{data.displayMonth.split(' ')[0]} Subscribers</div>
                  <div className="recap-metric-value green">{currentSubscribers.toLocaleString()}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Prior Year: {lastYearSubscribers.toLocaleString()} | <span className={yoyChangeSubsPct >= 0 ? 'green' : ''} style={{ color: yoyChangeSubsPct >= 0 ? 'var(--qb-green)' : 'inherit' }}>{yoyChangeSubsPct >= 0 ? '+' : ''}{yoyChangeSubsPct.toFixed(1)}% YoY</span>
                  </div>
                </div>
                <div className="recap-metric-card">
                  <div className="recap-metric-label">
                    {data.displayMonth.split(' ')[0]} Churn
                    <span className="recap-tooltip-icon">
                      ?
                      <span className="recap-tooltip-text">Percentage of customers who stopped using or paying for a service during a month.</span>
                    </span>
                  </div>
                  <div className="recap-metric-value">{currentChurnPct.toFixed(2)}%</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    6 Month Avg: {sixMonthAvgChurn}%
                  </div>
                </div>
              </div>
              <div className="recap-benchmark-container">
                <div className="recap-benchmark-title" style={{ fontSize: '18px', fontWeight: 700 }}>EdTech Benchmark: Churn Rates</div>
                <table className="recap-benchmark-table">
                  <thead>
                    <tr>
                      <th>Performance Tier</th>
                      <th>Monthly Churn</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="tier">Excellent</td><td>&lt; 7%</td><td>Strong learner retention</td></tr>
                    <tr><td className="tier">Good</td><td>7 - 9%</td><td>Typical for education subscriptions</td></tr>
                    <tr><td className="tier">Acceptable</td><td>9 - 11%</td><td>Some expectation or onboarding friction</td></tr>
                    <tr><td className="tier">Concerning</td><td>11%+</td><td>At or above EdTech industry average</td></tr>
                    <tr className="highlight"><td className="tier" style={{ whiteSpace: 'nowrap' }}>QBT (6-mo avg)</td><td>{sixMonthAvgChurn}%</td><td></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="recap-commentary">
              <h3>Commentary</h3>
              {formatComment(data.comments.subscribers)}
            </div>
            <div className="recap-bottom-nav">
              {renderNavButton('prev')}
              {renderNavButton('next')}
            </div>
          </section>

          {/* Section 4: Website Traffic */}
          <section className={`recap-section ${activeSection === 4 ? 'active' : ''}`}>
            <div className="recap-section-header">
              <h2 className="recap-section-title">Website Traffic</h2>
              <p className="recap-section-subtitle">Website traffic and paid acquisition metrics</p>
            </div>
            <div className="recap-chart-container">
              <div className="recap-chart-title">Traffic Trend</div>
              <div className="recap-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => Number(value).toLocaleString()} />
                    <Legend />
                    <Line type="monotone" dataKey="newVisitors" name="New Visitors" stroke={COLORS.teal} strokeWidth={2.5} dot={{ fill: COLORS.teal, r: 4 }} />
                    <Line type="monotone" dataKey="paidVisitors" name="Paid Visitors" stroke={COLORS.orange} strokeWidth={2.5} dot={{ fill: COLORS.orange, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="recap-chart-container">
              <div className="recap-chart-title">Cost Per Click Trend</div>
              <div className="recap-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${v.toFixed(2)}`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), 2)} />
                    <Line type="monotone" dataKey="cpc" stroke={COLORS.orange} strokeWidth={2.5} dot={{ fill: COLORS.orange, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="recap-yoy-panels-triple">
              <div className="recap-yoy-panel">
                <div className="recap-yoy-panel-title">New Visitors YoY</div>
                <div className="recap-yoy-panel-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{currentNewVisitors.toLocaleString()}</div>
                    <div className="recap-yoy-panel-label">{data.displayMonth}</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{lastYearNewVisitors.toLocaleString()}</div>
                    <div className="recap-yoy-panel-label">Prior Year</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className={`recap-yoy-panel-value ${yoyChangeNvPct >= 0 ? 'green' : ''}`}>
                      {yoyChangeNvPct >= 0 ? '+' : ''}{yoyChangeNvPct.toFixed(0)}%
                    </div>
                    <div className="recap-yoy-panel-label">YoY Change</div>
                  </div>
                </div>
              </div>
              <div className="recap-yoy-panel">
                <div className="recap-yoy-panel-title">Paid Visitors YoY</div>
                <div className="recap-yoy-panel-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{currentPaidVisitors.toLocaleString()}</div>
                    <div className="recap-yoy-panel-label">{data.displayMonth}</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{lastYearPaidVisitors.toLocaleString()}</div>
                    <div className="recap-yoy-panel-label">Prior Year</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className={`recap-yoy-panel-value ${yoyChangePvPct >= 0 ? 'green' : ''}`}>
                      {yoyChangePvPct >= 0 ? '+' : ''}{yoyChangePvPct.toFixed(0)}%
                    </div>
                    <div className="recap-yoy-panel-label">YoY Change</div>
                  </div>
                </div>
              </div>
              <div className="recap-yoy-panel">
                <div className="recap-yoy-panel-title">Cost Per Click YoY</div>
                <div className="recap-yoy-panel-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{formatCurrency(currentCpc, 2)}</div>
                    <div className="recap-yoy-panel-label">{data.displayMonth}</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className="recap-yoy-panel-value">{formatCurrency(lastYearCpc, 2)}</div>
                    <div className="recap-yoy-panel-label">Prior Year</div>
                  </div>
                  <div className="recap-yoy-panel-item">
                    <div className={`recap-yoy-panel-value ${yoyChangeCpcPct <= 0 ? 'green' : ''}`}>
                      {yoyChangeCpcPct >= 0 ? '+' : ''}{yoyChangeCpcPct.toFixed(0)}%
                    </div>
                    <div className="recap-yoy-panel-label">YoY Change</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="recap-commentary" style={{ marginTop: '32px' }}>
              <h3>Commentary</h3>
              {formatComment(data.comments.traffic)}
            </div>
            <div className="recap-bottom-nav">
              {renderNavButton('prev')}
              {renderNavButton('next')}
            </div>
          </section>

          {/* Section 5: Refunds and Chargebacks */}
          <section className={`recap-section ${activeSection === 5 ? 'active' : ''}`}>
            <div className="recap-section-header">
              <h2 className="recap-section-title">Refunds and Chargebacks</h2>
              <p className="recap-section-subtitle">Refunds are initiated by customers through us, while chargebacks are disputes initiated through their credit card issuer.</p>
            </div>
            <div className="recap-chart-container">
              <div className="recap-chart-title">Refunds + Chargebacks ($)</div>
              <div className="recap-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), null]} />
                    <Line type="monotone" dataKey="totalRefundsChargebacks" stroke={COLORS.red} strokeWidth={2.5} dot={{ fill: COLORS.red, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="recap-chart-container">
              <div className="recap-chart-title">Refund Rate (%)</div>
              <div className="recap-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${v.toFixed(2)}%`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, null]} />
                    <Line type="monotone" dataKey="refundPct" stroke={COLORS.red} strokeWidth={2.5} dot={{ fill: COLORS.red, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="recap-refunds-summary">
              <div className="recap-refunds-metrics">
                <div className="recap-metric-card">
                  <div className="recap-metric-label">Total Refunds + CB</div>
                  <div className="recap-metric-value">{formatCurrency(currentTotalRefunds)}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Prior Year: {formatCurrency(lastYearTotalRefunds)} | <span style={{ color: yoyChangeRefundsPct <= 0 ? 'var(--qb-green)' : 'inherit' }}>{yoyChangeRefundsPct >= 0 ? '+' : ''}{yoyChangeRefundsPct.toFixed(1)}% YoY</span>
                  </div>
                </div>
                <div className="recap-metric-card">
                  <div className="recap-metric-label">Refund Rate</div>
                  <div className="recap-metric-value">{currentRefundPct.toFixed(2)}%</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Prior Year: {lastYearRefundPct.toFixed(2)}% | <span style={{ color: yoyChangeRefundRatePct <= 0 ? 'var(--qb-green)' : 'inherit' }}>{yoyChangeRefundRatePct >= 0 ? '+' : ''}{yoyChangeRefundRatePct.toFixed(1)}% YoY</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    6 Month Avg: {sixMonthAvgRefundRate}%
                  </div>
                </div>
              </div>
              <div className="recap-benchmark-container">
                <div className="recap-benchmark-title">Refund Rate Benchmarks</div>
                <table className="recap-benchmark-table">
                  <thead>
                    <tr>
                      <th>Performance Tier</th>
                      <th>Refund Rate</th>
                      <th>Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="tier">Excellent</td><td>&lt; 3%</td><td>High-ticket products with qualified buyers and strong product-market fit</td></tr>
                    <tr><td className="tier">Good</td><td>3 - 5%</td><td>Solid performance; typical for premium training with live support</td></tr>
                    <tr><td className="tier">Acceptable</td><td>5 - 7%</td><td>General e-commerce benchmark; acceptable for most digital products</td></tr>
                    <tr><td className="tier">Concerning</td><td>8%+</td><td>May indicate price-value misalignment or acquisition channel issues</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="recap-commentary">
              <h3>Commentary</h3>
              {formatComment(data.comments.refunds)}
            </div>
            <div className="recap-bottom-nav">
              {renderNavButton('prev')}
              {renderNavButton('next')}
            </div>
          </section>

          {/* Section 6: Intuit Sales */}
          <section className={`recap-section ${activeSection === 6 ? 'active' : ''}`}>
            <div className="recap-section-header">
              <h2 className="recap-section-title">Intuit Sales</h2>
              <p className="recap-section-subtitle">Revenue from Intuit partnership</p>
            </div>
            <div className="recap-chart-container">
              <div className="recap-chart-title">Intuit Sales Trend</div>
              <div className="recap-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="intuitSales" stroke={COLORS.blue} strokeWidth={2.5} dot={{ fill: COLORS.blue, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="recap-metrics-grid">
              <div className="recap-metric-card">
                <div className="recap-metric-label">Intuit Sales</div>
                <div className="recap-metric-value green">{formatCurrency(currentIntuitSales)}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Prior Year: {formatCurrency(lastYearIntuitSales)} | <span style={{ color: yoyChangeIntuitPct >= 0 ? 'var(--qb-green)' : 'inherit' }}>{yoyChangeIntuitPct >= 0 ? '+' : ''}{yoyChangeIntuitPct.toFixed(1)}% YoY</span>
                </div>
              </div>
            </div>
            <div className="recap-commentary">
              <h3>Commentary</h3>
              {formatComment(data.comments.intuit_sales)}
            </div>
            <div className="recap-bottom-nav">
              {renderNavButton('prev')}
              {renderNavButton('next')}
            </div>
          </section>

          {/* Section 7: Expense Highlights */}
          <section className={`recap-section ${activeSection === 7 ? 'active' : ''}`}>
            <div className="recap-section-header">
              <h2 className="recap-section-title">Expense Highlights</h2>
              <p className="recap-section-subtitle">Notable expenses and cost insights for {data.displayMonth}</p>
            </div>
            <div className="recap-commentary">
              {data.expenseItems && data.expenseItems.length > 0 ? (
                data.expenseItems.map((item, i) => {
                  const lines = item.split('\n').filter((l: string) => l.trim());
                  if (lines.length === 0) return null;
                  const firstLine = lines[0];
                  const amountMatch = firstLine.match(/(\+?\$?\d+K?)$/i);
                  let title = firstLine;
                  let amount = '';
                  if (amountMatch) {
                    amount = amountMatch[1];
                    title = firstLine.replace(amountMatch[0], '').trim();
                  }
                  const description = lines.slice(1).join(' ');
                  return (
                    <div key={i} className="recap-expense-item">
                      <div className="recap-expense-header" style={{ justifyContent: 'flex-start', gap: '12px' }}>
                        <span className="recap-expense-title">{title}</span>
                        {amount && <span className="recap-expense-amount">{amount}</span>}
                      </div>
                      <p className="recap-expense-description">{description}</p>
                    </div>
                  );
                })
              ) : (
                <p>No expense highlights for this period.</p>
              )}
            </div>
            <div className="recap-bottom-nav">
              {renderNavButton('prev')}
              {renderNavButton('next')}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
