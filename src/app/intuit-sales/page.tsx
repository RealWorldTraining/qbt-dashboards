'use client';

import { useState, useEffect } from 'react';
import { DashboardNav } from '@/components/DashboardNav';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './intuit-sales.css';

interface CategoryData {
  amount: number;
  percentage: number;
}

interface IntuitSalesData {
  months: string[];
  categories: Array<{ key: string; label: string }>;
  data: Record<string, Record<string, CategoryData>>;
  monthTotals: Record<string, number>;
}

export default function IntuitSalesPage() {
  const [data, setData] = useState<IntuitSalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/intuit-sales')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="intuit-sales-page">
        <DashboardNav theme="dark" />
        <div className="max-w-full mx-auto px-4 py-6">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-green-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading Intuit sales data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="intuit-sales-page">
        <DashboardNav theme="dark" />
        <div className="max-w-full mx-auto px-4 py-6">
          <div className="text-center py-16 intuit-sales-card max-w-2xl mx-auto p-12">
            <div className="text-red-600 text-xl font-bold mb-3">⚠️ Error Loading Data</div>
            <p className="text-gray-600">{error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getHeatmapColor = (percentage: number) => {
    if (percentage === 0) return 'heat-0';
    if (percentage < 5) return 'heat-1';
    if (percentage < 10) return 'heat-2';
    if (percentage < 15) return 'heat-3';
    if (percentage < 20) return 'heat-4';
    if (percentage < 25) return 'heat-5';
    if (percentage < 35) return 'heat-6';
    if (percentage < 45) return 'heat-7';
    if (percentage < 60) return 'heat-8';
    return 'heat-9';
  };

  // Prepare chart data
  const chartData = data?.months.map((month) => {
    const monthData = data.data[month];
    return {
      month: month.split(' ')[0], // Just month name
      IES: monthData?.ies?.amount || 0,
      'Priority Circle': monthData?.priorityCircle?.amount || 0,
      Classes: monthData?.classes?.amount || 0,
      Videos: monthData?.videos?.amount || 0,
      Webinars: monthData?.webinars?.amount || 0,
      Other: monthData?.other?.amount || 0,
      Total: data.monthTotals[month] || 0,
    };
  }) || [];

  // Year-over-year data
  const yoyData = data?.months.reduce((acc: any[], month) => {
    const [monthName, year] = month.split(' ');
    const total = data.monthTotals[month] || 0;
    const existing = acc.find(d => d.month === monthName);
    if (existing) {
      existing[`Y${year}`] = total;
    } else {
      acc.push({ month: monthName, [`Y${year}`]: total });
    }
    return acc;
  }, []) || [];

  return (
    <div className="intuit-sales-page">
      <DashboardNav theme="dark" />
      <div className="max-w-full mx-auto px-4 py-6">
        <div className="intuit-sales-header">
          <h1>Intuit Revenue</h1>
          <p>Monthly revenue breakdown by category • {data.months[0]} – {data.months[data.months.length - 1]}</p>
        </div>

        <div className="intuit-sales-card">
          <div className="intuit-sales-table-wrapper">
            <table className="intuit-sales-table">
              <thead>
                <tr>
                  <th scope="col">
                    Category
                  </th>
                  {data.months.map((month) => {
                    const [monthName, year] = month.split(' ');
                    return (
                      <th key={month} scope="col">
                        <div className="intuit-sales-month-header">
                          <span>{monthName}</span>
                          <span>{year}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.categories.map((category) => (
                  <tr key={category.key}>
                    <td>
                      {category.label}
                    </td>
                    {data.months.map((month) => {
                      const cellData = data.data[month]?.[category.key] || { amount: 0, percentage: 0 };
                      const heatmapColor = getHeatmapColor(cellData.percentage);
                      return (
                        <td key={`${category.key}-${month}`} className={heatmapColor}>
                          <div className="intuit-sales-cell-amount">
                            {formatCurrency(cellData.amount)}
                          </div>
                          <div className="intuit-sales-cell-percentage">
                            {cellData.percentage > 0 ? `${cellData.percentage.toFixed(1)}%` : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="intuit-sales-total-row">
                  <td>TOTAL</td>
                  {data.months.map((month) => (
                    <td key={`total-${month}`}>
                      <div className="intuit-sales-cell-amount">
                        {formatCurrency(data.monthTotals[month] || 0)}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Section */}
        <div className="intuit-sales-charts">
          {/* Revenue Trends - Stacked Area Chart */}
          <div className="intuit-sales-chart-card">
            <h2>Revenue Trends by Category</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#a0a0a0" />
                <YAxis stroke="#a0a0a0" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                  labelStyle={{ color: '#f5f5f5' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ color: '#a0a0a0' }} />
                <Area type="monotone" dataKey="IES" stackId="1" stroke="#41c651" fill="#41c651" />
                <Area type="monotone" dataKey="Priority Circle" stackId="1" stroke="#3cb34b" fill="#3cb34b" />
                <Area type="monotone" dataKey="Classes" stackId="1" stroke="#37a045" fill="#37a045" />
                <Area type="monotone" dataKey="Videos" stackId="1" stroke="#338c3e" fill="#338c3e" />
                <Area type="monotone" dataKey="Webinars" stackId="1" stroke="#2e7938" fill="#2e7938" />
                <Area type="monotone" dataKey="Other" stackId="1" stroke="#2a6631" fill="#2a6631" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Year-over-Year Comparison */}
          <div className="intuit-sales-chart-card">
            <h2>Year-over-Year Total Revenue</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={yoyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#a0a0a0" />
                <YAxis stroke="#a0a0a0" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                  labelStyle={{ color: '#f5f5f5' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ color: '#a0a0a0' }} />
                <Line type="monotone" dataKey="Y2024" stroke="#3cb34b" strokeWidth={3} dot={{ fill: '#3cb34b', r: 4 }} />
                <Line type="monotone" dataKey="Y2025" stroke="#41c651" strokeWidth={3} dot={{ fill: '#41c651', r: 4 }} />
                <Line type="monotone" dataKey="Y2026" stroke="#2CA01C" strokeWidth={3} dot={{ fill: '#2CA01C', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="intuit-sales-footer">
          <p><strong>Data source:</strong> Intuit Sales Revenue Google Sheet</p>
          <p><strong>Last updated:</strong> {new Date().toLocaleString('en-US', { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
          })}</p>
        </div>
      </div>
    </div>
  );
}
