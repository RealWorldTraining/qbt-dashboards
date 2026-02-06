'use client';

import { useState, useEffect } from 'react';
import { DashboardNav } from '@/components/DashboardNav';

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
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading Intuit sales data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-600 text-lg font-semibold">Error loading data</div>
            <p className="mt-2 text-gray-600">{error || 'Unknown error'}</p>
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
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Intuit Sales Revenue</h1>
          <p className="mt-2 text-gray-600">Monthly revenue breakdown by category</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  >
                    Category
                  </th>
                  {data.months.map((month) => (
                    <th
                      key={month}
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.categories.map((category, idx) => (
                  <tr key={category.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-inherit border-r border-gray-200">
                      {category.label}
                    </td>
                    {data.months.map((month) => {
                      const cellData = data.data[month]?.[category.key] || { amount: 0, percentage: 0 };
                      return (
                        <td key={`${category.key}-${month}`} className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(cellData.amount)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {cellData.percentage > 0 ? `${cellData.percentage.toFixed(1)}%` : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="sticky left-0 z-10 px-6 py-4 whitespace-nowrap text-sm text-gray-900 bg-gray-100 border-r border-gray-200">
                    TOTAL
                  </td>
                  {data.months.map((month) => (
                    <td key={`total-${month}`} className="px-6 py-4 text-center text-sm text-gray-900">
                      {formatCurrency(data.monthTotals[month] || 0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Data source: Intuit Sales Revenue Google Sheet</p>
          <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
