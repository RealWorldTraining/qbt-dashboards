'use client';

import { useState, useEffect } from 'react';

interface DeviceMetrics {
  device: string;
  spend: number;
  conversions: number;
  cpa: number;
}

interface Campaign {
  name: string;
  device: string;
  spend: number;
  conversions: number;
  cpa: number;
}

interface AdsData {
  metrics: {
    totalSpend: number;
    totalConversions: number;
    avgCPA: number;
    byDevice: DeviceMetrics[];
    lastUpdated: string | null;
  };
  topCampaigns: Campaign[];
}

export default function GoogleAdsQuickView() {
  const [data, setData] = useState<AdsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/mission-control/google-ads');
      const result = await response.json();
      
      if (!result.mockData) {
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching Google Ads data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading Google Ads data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No Google Ads data available</p>
      </div>
    );
  }

  const { metrics, topCampaigns } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📊 Google Ads Quick View</h2>
        <p className="text-sm text-gray-600 mt-1">
          Latest week · Updates daily at 4 AM CST · Last: {formatDate(metrics.lastUpdated)}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Spend</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(metrics.totalSpend)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Conversions</div>
          <div className="text-3xl font-bold text-gray-900">
            {metrics.totalConversions}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Avg CPA</div>
          <div className={`text-3xl font-bold ${
            metrics.avgCPA > 180 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(metrics.avgCPA)}
          </div>
        </div>
      </div>

      {/* Device Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-lg mb-4">Performance by Device</h3>
        <div className="space-y-3">
          {metrics.byDevice.map((device, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{device.device}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {device.conversions} conversions
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatCurrency(device.spend)}
                </div>
                <div className={`text-sm font-medium ${
                  device.cpa > 180 ? 'text-red-600' : 'text-green-600'
                }`}>
                  CPA: {formatCurrency(device.cpa)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Campaigns */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-lg mb-4">Top Campaigns (by Conversions)</h3>
        <div className="space-y-2">
          {topCampaigns.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No campaign data available</p>
          ) : (
            topCampaigns.map((campaign, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{campaign.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {campaign.device} · {campaign.conversions} conv
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(campaign.spend)}
                  </div>
                  <div className={`text-xs font-medium ${
                    campaign.cpa > 180 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(campaign.cpa)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
