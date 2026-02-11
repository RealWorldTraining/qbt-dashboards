'use client';

import { useState, useEffect } from 'react';
import { DashboardNav } from '@/components/DashboardNav';
import { IntuitRevenueChart } from '@/components/IntuitRevenueChart';
import { IntuitPercentageChart } from '@/components/IntuitPercentageChart';
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
        <DashboardNav theme="light" />
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
        <DashboardNav theme="light" />
        <div className="max-w-full mx-auto px-4 py-6">
          <div className="text-center py-16 intuit-sales-card max-w-2xl mx-auto p-12">
            <div className="text-red-600 text-xl font-bold mb-3">Error Loading Data</div>
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

  return (
    <div className="intuit-sales-page">
      <DashboardNav theme="light" />
      <div className="max-w-full mx-auto px-4 py-6">
        <div className="intuit-sales-header">
          <h1>Intuit Revenue</h1>
          <p>Monthly revenue breakdown by category • {data?.months[0]} – {data?.months[data.months.length - 1]}</p>
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
                      return (
                        <td key={`${category.key}-${month}`}>
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

        <IntuitRevenueChart
          months={data.months}
          categories={data.categories}
          data={data.data}
        />

        <IntuitPercentageChart
          months={data.months}
          categories={data.categories}
          data={data.data}
        />

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
