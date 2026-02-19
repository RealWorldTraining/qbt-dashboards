'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronRight, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Users, MousePointer, Smartphone, Monitor, HelpCircle } from 'lucide-react';
import PageScreenshotWithOverlays from '@/components/PageScreenshotWithOverlays';
import MetricTooltip, { MetricValue } from './components/MetricTooltip';

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [arrowSide, setArrowSide] = useState<'left' | 'right' | 'bottom'>('left');
  const iconRef = useRef<HTMLDivElement>(null);
  const tooltipWidth = 380;

  const handleEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const spaceRight = vw - rect.right;
      const spaceLeft = rect.left;

      if (spaceRight > tooltipWidth + 20) {
        // Position to the right
        setStyle({ left: rect.right + 12, top: rect.top + rect.height / 2, transform: 'translateY(-50%)' });
        setArrowSide('left');
      } else if (spaceLeft > tooltipWidth + 20) {
        // Position to the left
        setStyle({ left: rect.left - tooltipWidth - 12, top: rect.top + rect.height / 2, transform: 'translateY(-50%)' });
        setArrowSide('right');
      } else {
        // Position above, centered on icon
        const leftPos = Math.max(12, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, vw - tooltipWidth - 12));
        setStyle({ left: leftPos, bottom: vh - rect.top + 8, transform: 'none' });
        setArrowSide('bottom');
      }
    }
    setShow(true);
  };

  return (
    <div className="relative inline-flex items-center">
      {children}
      <div ref={iconRef} onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
        <HelpCircle className="w-4 h-4 ml-2 text-gray-400 hover:text-blue-400 cursor-help transition-colors" />
      </div>
      {show && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={style}
        >
          <div className="bg-gray-900 text-gray-100 text-sm rounded-lg p-4 shadow-2xl border-2 border-blue-500/50 whitespace-normal leading-relaxed" style={{ width: tooltipWidth }}>
            {text}
            {arrowSide === 'left' && (
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-[-2px]">
                <div className="border-8 border-transparent border-r-gray-900"></div>
              </div>
            )}
            {arrowSide === 'right' && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-[-2px]">
                <div className="border-8 border-transparent border-l-gray-900"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HotjarAnalysisPage() {
  const [activeSection, setActiveSection] = useState(0);
  const [activePageAnalysis, setActivePageAnalysis] = useState(0);
  const [activeDesignFix, setActiveDesignFix] = useState(0);

  const sections = [
    { id: 'exec-summary', title: 'Executive Summary', icon: '📊' },
    { id: 'business-context', title: 'Business Context', icon: '💰' },
    { id: 'buyer-journey', title: 'Buyer Journey', icon: '🛤️' },
    { id: 'problems', title: 'Five Problems', icon: '⚠️' },
    { id: 'performance', title: 'Performance', icon: '📈' },
    { id: 'page-analysis', title: 'Page Analysis', icon: '🔍' },
    { id: 'design-fixes', title: 'Design Fixes', icon: '🔧' },
    { id: 'recommendations', title: 'Recommendations', icon: '💡' },
  ];

  const designFixPages = [
    { id: 'site-wide', title: 'Site-Wide', icon: '🌐' },
    { id: 'homepage', title: 'Homepage', icon: '🏠' },
    { id: 'plans-pricing', title: 'Plans & Pricing', icon: '💳' },
    { id: 'qb-cert', title: 'QB Certification', icon: '🎓' },
    { id: 'live-classes', title: 'Live Classes', icon: '📺' },
    { id: 'self-paced', title: 'Self-Paced', icon: '📚' },
  ];

  const pageAnalysisPages = [
    { id: 'overview', title: 'Overview', icon: '📋' },
    { id: 'homepage', title: 'Homepage', icon: '🏠' },
    { id: 'qb-cert', title: 'QB Certification', icon: '🎓' },
    { id: 'plans-pricing', title: 'Plans & Pricing', icon: '💳' },
    { id: 'live-classes', title: 'Live Classes', icon: '📺' },
    { id: 'self-paced', title: 'Self-Paced', icon: '📚' },
    { id: 'other', title: 'Other Pages', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header - Toned Down */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-2xl border-b border-slate-600">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <h1 className="text-4xl font-extrabold mb-2 text-white">QBTraining.com Analysis</h1>
          <p className="text-slate-300 text-lg">Behavioral & Revenue Deep Dive • February 2026</p>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700 shadow-xl">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 pr-6 scrollbar-hide">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all flex-shrink-0 ${
                  activeSection === idx
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        
        {/* Executive Summary */}
        {activeSection === 0 && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-blue-400">Executive Summary</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed text-lg">
                <p>
                  QBTraining.com generated <span className="text-green-400 font-bold">$1.7 million in revenue</span> from 2,544 purchases across 319,718 sessions between November 2025 and February 2026. The average order value is <span className="text-blue-400 font-bold">$682</span>, confirming the Certification Plan ($699.95) as the likely best-seller.
                </p>
                <p>
                  Analysis of 250,000+ Hotjar interactions and GA4 data reveals a site with enormous untapped potential. <span className="text-green-400 font-bold">Desktop generates 88% of revenue ($1.3M)</span> but suffers from <span className="text-red-400 font-bold">20–39% dead click rates</span>. Meanwhile, mobile serves as the research channel with excellent engagement but low direct conversion — expected behavior for a $700 product.
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-xl p-6 border border-green-700/50 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-4xl font-extrabold text-green-400 mb-2">$1.7M</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Revenue</div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/40 to-gray-900 rounded-xl p-6 border border-blue-700/50 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-4xl font-extrabold text-blue-400 mb-2">$682</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Avg Order Value</div>
              </div>

              <div className="bg-gradient-to-br from-red-900/40 to-gray-900 rounded-xl p-6 border border-red-700/50 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <MetricValue 
                  value="20–39%" 
                  context="Range: Homepage 18.3%, Plans & Pricing 36.5%, Bookkeeping Cert 38.8%. Industry best practice: <10%"
                >
                  <div className="text-4xl font-extrabold text-red-400 mb-2">20–39%</div>
                </MetricValue>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  <MetricTooltip metric="dead-clicks">
                    <span>Desktop Dead Clicks</span>
                  </MetricTooltip>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-xl p-6 border border-green-700/50 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <MetricValue 
                  value="4.15%" 
                  context="Plans & Pricing: 4,530 desktop sessions → 188 purchases. Shortest page (3,869px), best scroll (52.7%), focused decision"
                >
                  <div className="text-4xl font-extrabold text-green-400 mb-2">4.15%</div>
                </MetricValue>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  <MetricTooltip metric="conversion-rate">
                    <span>Best Conv. Rate</span>
                  </MetricTooltip>
                </div>
              </div>
            </div>

            {/* Big Number Callout */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-12 text-center shadow-2xl">
              <Tooltip text={`Sum of 7 initiatives: Fix desktop dead clicks ($150K-$200K) + Fix Homepage scroll ($80K-$120K) + Add CTAs to Self-Paced ($50K-$80K) + Improve mobile research ($80K-$150K) + Interactive pricing table ($20K-$40K) + Optimize /certification-mobile ($30K-$50K) + Improve mobile checkout ($40K-$80K). Conservative estimates account for cross-device dynamics.`}>
                <div className="text-6xl font-extrabold mb-4">+$450K – $720K</div>
              </Tooltip>
              <div className="text-xl font-semibold uppercase tracking-widest opacity-90">
                Estimated Annual Revenue Uplift from Recommendations
              </div>
            </div>
          </div>
        )}

        {/* Business Context */}
        {activeSection === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-blue-400">Business Context & Pricing</h2>
              
              <h3 className="text-2xl font-bold text-white mb-4">Pricing Structure</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-900 border-b border-gray-700">
                      <th className="p-4 font-bold text-blue-400">Plan</th>
                      <th className="p-4 font-bold text-blue-400">Price</th>
                      <th className="p-4 font-bold text-blue-400">Was</th>
                      <th className="p-4 font-bold text-blue-400">Includes</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Learner</td>
                      <td className="p-4 text-green-400 font-bold">$599.95</td>
                      <td className="p-4 line-through text-gray-500">$899.95</td>
                      <td className="p-4 text-base">Training only, 1 user. 30 days free 1-on-1 help, then $50/mo</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Certification</td>
                      <td className="p-4 text-green-400 font-bold">$699.95</td>
                      <td className="p-4 line-through text-gray-500">$999.95</td>
                      <td className="p-4 text-base">Training + Certification, 1 user. 30 days free 1-on-1 help, then $50/mo</td>
                    </tr>
                    <tr className="hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Team</td>
                      <td className="p-4 text-green-400 font-bold">$999.95</td>
                      <td className="p-4 line-through text-gray-500">$1,799.95</td>
                      <td className="p-4 text-base">Training + Certification, 2-5 users. 30 days free 1-on-1 help, then $90/mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 bg-amber-900/30 border-l-4 border-amber-500 p-6 rounded-r-xl">
                <h4 className="font-bold text-amber-300 mb-2 text-lg">Why This Price Point Shapes Everything</h4>
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white">At $600–$1,000 per plan:</strong> Nobody impulse-buys on their phone. Visitors make multiple visits before purchasing. Trust is non-negotiable. The comparison table is the most important element on the site. FAQ engagement is massive because people have lots of questions before committing $700.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Buyer Journey */}
        {activeSection === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-blue-400">The Cross-Device Buyer Journey</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                The data reveals a clear, predictable purchasing pattern for this high-ticket product:
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-gradient-to-br from-blue-900/40 to-gray-900 rounded-xl p-6 border border-blue-700/50">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-4 shadow-lg">1</div>
                  <h3 className="text-xl font-bold text-center mb-3 text-blue-300">Discover on Mobile</h3>
                  <p className="text-center text-gray-400 text-sm leading-relaxed">
                    Google search → landing page → browse, read, evaluate
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-900/40 to-gray-900 rounded-xl p-6 border border-purple-700/50">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-4 shadow-lg">2</div>
                  <h3 className="text-xl font-bold text-center mb-3 text-purple-300">Return on Desktop</h3>
                  <p className="text-center text-gray-400 text-sm leading-relaxed">
                    Types URL directly → compares plans → final decision
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-xl p-6 border border-green-700/50">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-4 shadow-lg">3</div>
                  <h3 className="text-xl font-bold text-center mb-3 text-green-300">Purchase on Desktop</h3>
                  <p className="text-center text-gray-400 text-sm leading-relaxed">
                    Signs in or enrolls → completes $600–$1,000 purchase
                  </p>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">Evidence from the Data</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="font-semibold text-blue-300 mb-2">Returning users dominate desktop</div>
                  <div className="text-gray-400 text-sm">/login • 20,364 sessions • /dashboard • 28,551 sessions</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="font-semibold text-blue-300 mb-2">Desktop homepage = login portal</div>
                  <div className="text-gray-400 text-sm">30.6% of desktop homepage clicks are Sign In</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="font-semibold text-blue-300 mb-2">Mobile engages, desktop converts</div>
                  <div className="text-gray-400 text-sm">Mobile CTR rate 43.3% vs. 0.43% conversion</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="font-semibold text-blue-300 mb-2">Direct traffic converts highest</div>
                  <div className="text-gray-400 text-sm">People remember the URL from mobile research</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Five Problems */}
        {activeSection === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-blue-400">Five Systemic Problems the Data Revealed</h2>
              
              <div className="space-y-6">
                <div className="bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl">
                  <h3 className="text-2xl font-bold text-red-300 mb-3">1. The Homepage Is Hemorrhaging Visitors</h3>
                  <p className="text-gray-300 mb-3 text-lg leading-relaxed">Only 8% of desktop users reach the halfway point. The page is 9.34kb tall. There is a catastrophic 40.2% drop-off between 5–10% of the page. At 80%+ AOV, each percentage point of improvement represents hundreds of potential purchases per quarter.</p>
                  <div className="text-lg text-gray-400 mt-2">Impact: <span className="text-red-400 font-semibold">CRITICAL</span> • Affects all traffic sources</div>
                </div>

                <div className="bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-xl">
                  <h3 className="text-2xl font-bold text-amber-300 mb-3">2. The Homepage Function Confuses Visitors</h3>
                  <p className="text-gray-300 mb-3 text-lg leading-relaxed">20–39% of ALL desktop clicks hit non-interactive elements. People click on body text, comparison table cells, section backgrounds, and data areas expecting interactivity. This is the purchase channel — the device generating 88% of revenue — and up to 4 in 10 clicks are wasted.</p>
                  <div className="text-lg text-gray-400 mt-2">Impact: <span className="text-amber-400 font-semibold">HIGH</span> • Desktop-specific issue</div>
                </div>

                <div className="bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-xl">
                  <h3 className="text-2xl font-bold text-amber-300 mb-3">3. Pages Are Too Long High</h3>
                  <p className="text-gray-300 mb-3 text-lg leading-relaxed">The correlation is unambiguous: shorter pages retain better and convert better for a $700 product. Plans & Pricing (9.34px): 0.86% conv. Certification (13.21%px): 0.85% conv. Self-Paced (6.44px): 0.96% conv.</p>
                  <div className="text-lg text-gray-400 mt-2">Impact: <span className="text-amber-400 font-semibold">HIGH</span> • Affects conversion rates</div>
                </div>

                <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                  <h3 className="text-2xl font-bold text-blue-300 mb-3">4. Sign In Dominates the Homepage High</h3>
                  <p className="text-gray-300 mb-3 text-lg leading-relaxed">The homepage functions more as a login portal than a landing page. After removing Sign In and clicks, only ~400 desktop clicks per quarter remain for CTAs. For first-time visitors, Sign In is a landing page. After removing account engagement, the page does not convert.</p>
                  <div className="text-lg text-gray-400 mt-2">Impact: <span className="text-blue-400 font-semibold">MEDIUM</span> • Crowds out CTA engagement</div>
                </div>

                <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                  <h3 className="text-2xl font-bold text-blue-300 mb-3">5. Self-Paced Courses: Conversion Black Hole High</h3>
                  <p className="text-gray-300 mb-3 text-lg leading-relaxed">28.5% of clicks go to course cards, but only 4.6% ever reach a CTA. People browse thinking they're buying individual courses, not understanding the plan model. "Load More" button gets 3.87% of clicks but no one sees a CTA. Conversion Black Hole: 98% of visitors who click any course card never reach a purchase path.</p>
                  <div className="text-lg text-gray-400 mt-2">Impact: <span className="text-blue-400 font-semibold">MEDIUM</span> • Specific to Self-Paced page</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Dashboard */}
        {activeSection === 4 && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-blue-400">Site Performance Dashboard</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-900/40 to-gray-900 rounded-xl p-6 border border-purple-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-8 h-8 text-purple-400" />
                    <h3 className="text-xl font-bold text-white">Revenue by Page</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Homepage</span>
                      <span className="text-green-400 font-bold">$399.8M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">QB Certification</span>
                      <span className="text-green-400 font-bold">$267.8M</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Plans & Pricing</span>
                      <span className="text-green-400 font-bold">$321.8M</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/40 to-gray-900 rounded-xl p-6 border border-blue-700/50">
                  <div className="flex items-center gap-3 mb-4">
                    <MousePointer className="w-8 h-8 text-blue-400" />
                    <h3 className="text-xl font-bold text-white">Desktop Dead Clicks</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Bookkeeping Cert.</span>
                      <span className="text-red-400 font-bold">38.9%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">QBO Certification</span>
                      <span className="text-red-400 font-bold">38.9%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Plans & Pricing</span>
                      <span className="text-red-400 font-bold">36.5%</span>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">Device Split</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Monitor className="w-8 h-8 text-blue-400" />
                    <h4 className="text-xl font-bold text-white">Desktop</h4>
                  </div>
                  <div className="text-3xl font-extrabold text-green-400 mb-2">88%</div>
                  <div className="text-gray-400">of revenue ($1.3M)</div>
                  <div className="mt-4 space-y-2">
                    <div className="text-base text-gray-300">• Purchase device</div>
                    <div className="text-base text-gray-300">• High dead click rates (20-39%)</div>
                    <div className="text-base text-gray-300">• Returning users dominant</div>
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="w-8 h-8 text-purple-400" />
                    <h4 className="text-xl font-bold text-white">Mobile</h4>
                  </div>
                  <div className="text-3xl font-extrabold text-blue-400 mb-2">12%</div>
                  <div className="text-gray-400">of revenue</div>
                  <div className="mt-4 space-y-2">
                    <div className="text-base text-gray-300">• Research channel</div>
                    <div className="text-base text-gray-300">• High engagement (43% CTR)</div>
                    <div className="text-base text-gray-300">• Low direct conversion (0.43%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Analysis */}
        {activeSection === 5 && (
          <div className="space-y-8 animate-fade-in">
            {/* Sub-navigation for Page Analysis */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {pageAnalysisPages.map((page, idx) => (
                  <button
                    key={page.id}
                    onClick={() => setActivePageAnalysis(idx)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all flex-shrink-0 ${
                      activePageAnalysis === idx
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span>{page.icon}</span>
                    <span>{page.title}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-blue-400">
                {pageAnalysisPages[activePageAnalysis].title}
              </h2>
              
              {/* Overview - All Tables & Summary */}
              {activePageAnalysis === 0 && (
                <>
              {/* Revenue by Page */}
              <h3 className="text-2xl font-bold text-white mb-4">Revenue by Page</h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <th className="p-4 font-bold text-blue-300">Page</th>
                      <th className="p-4 font-bold text-blue-300">Desktop Revenue</th>
                      <th className="p-4 font-bold text-blue-300">Mobile Revenue</th>
                      <th className="p-4 font-bold text-blue-300">Total</th>
                      <th className="p-4 font-bold text-blue-300">Desktop Conv %</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Homepage</td>
                      <td className="p-4">$398,530</td>
                      <td className="p-4">$55,956</td>
                      <td className="p-4 text-green-400 font-bold">$454,486</td>
                      <td className="p-4">0.86%</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">QB Certification</td>
                      <td className="p-4">$287,410</td>
                      <td className="p-4">$10,999</td>
                      <td className="p-4 text-green-400 font-bold">$298,409</td>
                      <td className="p-4">1.66%</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Plans & Pricing</td>
                      <td className="p-4">$137,591</td>
                      <td className="p-4">$33,798</td>
                      <td className="p-4 text-green-400 font-bold">$171,389</td>
                      <td className="p-4 text-green-400 font-bold">4.15%</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Live Classes</td>
                      <td className="p-4">$155,589</td>
                      <td className="p-4">$10,799</td>
                      <td className="p-4 text-green-400 font-bold">$166,388</td>
                      <td className="p-4">2.21%</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Self-Paced Courses</td>
                      <td className="p-4">$113,121</td>
                      <td className="p-4">$9,199</td>
                      <td className="p-4 text-green-400 font-bold">$122,320</td>
                      <td className="p-4">2.00%</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Certification Mobile</td>
                      <td className="p-4">$5,500</td>
                      <td className="p-4">$39,397</td>
                      <td className="p-4 text-green-400 font-bold">$44,897</td>
                      <td className="p-4">2.77%</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">QBO Certification</td>
                      <td className="p-4">$21,849</td>
                      <td className="p-4">$0</td>
                      <td className="p-4 text-green-400 font-bold">$21,849</td>
                      <td className="p-4">1.67%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Scroll Depth Leaderboard */}
              <h3 className="text-2xl font-bold text-white mb-4 mt-12">Scroll Depth Leaderboard</h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <th className="p-4 font-bold text-blue-300">#</th>
                      <th className="p-4 font-bold text-blue-300">Page</th>
                      <th className="p-4 font-bold text-blue-300">Device</th>
                      <th className="p-4 font-bold text-blue-300">Reach 50%</th>
                      <th className="p-4 font-bold text-blue-300">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">1</td>
                      <td className="p-4">1-on-1 Help</td>
                      <td className="p-4">Mobile</td>
                      <td className="p-4 text-green-400 font-bold">69.4%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm font-semibold">Excellent</span></td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">2</td>
                      <td className="p-4">Bookkeeping Cert</td>
                      <td className="p-4">Mobile</td>
                      <td className="p-4 text-green-400 font-bold">66.3%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm font-semibold">Excellent</span></td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">3</td>
                      <td className="p-4">QB Certification</td>
                      <td className="p-4">Mobile</td>
                      <td className="p-4 text-green-400 font-bold">65.4%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm font-semibold">Excellent</span></td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">5</td>
                      <td className="p-4">Plans & Pricing</td>
                      <td className="p-4">Desktop</td>
                      <td className="p-4 text-blue-400 font-bold">52.7%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm font-semibold">Good</span></td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">16</td>
                      <td className="p-4">Homepage</td>
                      <td className="p-4">Mobile</td>
                      <td className="p-4 text-red-400 font-bold">23.8%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-sm font-semibold">Critical</span></td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">17</td>
                      <td className="p-4 font-bold">Homepage</td>
                      <td className="p-4 font-bold">Desktop</td>
                      <td className="p-4 text-red-500 font-bold">9.9%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-red-900/70 text-red-200 rounded-full text-sm font-semibold">Catastrophic</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* CTA Effectiveness */}
              <h3 className="text-2xl font-bold text-white mb-4 mt-12">CTA Effectiveness Ranking</h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <th className="p-4 font-bold text-blue-300">#</th>
                      <th className="p-4 font-bold text-blue-300">Page</th>
                      <th className="p-4 font-bold text-blue-300">Device</th>
                      <th className="p-4 font-bold text-blue-300">CTA Click Rate</th>
                      <th className="p-4 font-bold text-blue-300">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">1</td>
                      <td className="p-4">Live Classes</td>
                      <td className="p-4">Mobile</td>
                      <td className="p-4 text-green-400 font-bold">45.6%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm font-semibold">Excellent</span></td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">2</td>
                      <td className="p-4">Desktop Cert</td>
                      <td className="p-4">Mobile</td>
                      <td className="p-4 text-green-400 font-bold">45.0%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm font-semibold">Excellent</span></td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">3</td>
                      <td className="p-4">Homepage</td>
                      <td className="p-4">Mobile</td>
                      <td className="p-4 text-green-400 font-bold">43.3%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm font-semibold">Excellent</span></td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">7</td>
                      <td className="p-4">Homepage</td>
                      <td className="p-4">Desktop</td>
                      <td className="p-4 text-blue-400 font-bold">21.8%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm font-semibold">Good</span></td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">9</td>
                      <td className="p-4 font-bold">Self-Paced</td>
                      <td className="p-4 font-bold">Desktop</td>
                      <td className="p-4 text-red-400 font-bold">4.6%</td>
                      <td className="p-4"><span className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-sm font-semibold">Critical</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Desktop vs Mobile Behavior */}
              <h3 className="text-2xl font-bold text-white mb-4 mt-12">Desktop vs. Mobile Behavior</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <th className="p-4 font-bold text-blue-300">Behavior</th>
                      <th className="p-4 font-bold text-blue-300">Desktop</th>
                      <th className="p-4 font-bold text-blue-300">Mobile</th>
                      <th className="p-4 font-bold text-blue-300">Implication</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Dead clicks</td>
                      <td className="p-4 text-red-400 font-bold">18–39%</td>
                      <td className="p-4 text-green-400">1–2%</td>
                      <td className="p-4 text-base">Desktop design has unclear affordances</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Sign In share</td>
                      <td className="p-4">30.6%</td>
                      <td className="p-4">3.6%</td>
                      <td className="p-4 text-base">Desktop gets more returning users</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">CTA engagement</td>
                      <td className="p-4">5–25%</td>
                      <td className="p-4 text-green-400">13–46%</td>
                      <td className="p-4 text-base">Mobile layout drives better engagement</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">FAQ engagement</td>
                      <td className="p-4">2–25%</td>
                      <td className="p-4 text-green-400">24–65%</td>
                      <td className="p-4 text-base">Accordions are mobile's primary pattern</td>
                    </tr>
                    <tr className="hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Scroll to 50%</td>
                      <td className="p-4">10–53%</td>
                      <td className="p-4 text-green-400">21–69%</td>
                      <td className="p-4 text-base">Mobile retains better on long pages</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Individual Page Deep-Dives */}
              <div className="grid md:grid-cols-2 gap-6">
              {/* Homepage */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-blue-400 mb-4">Homepage <span className="text-gray-500 text-base font-normal">/</span></h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="sessions" position="bottom"><span className="text-gray-400">Desktop Sessions</span></MetricTooltip>
                    <MetricValue value="71,419" context="#1 most-visited page. 37,430 new users (52%)." details={['30.6% of clicks are Sign In', 'Avg engagement: 1m 50s']}><span className="text-white font-semibold">71,419</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="revenue" position="bottom"><span className="text-gray-400">Revenue</span></MetricTooltip>
                    <MetricValue value="$454K" context="Desktop: $399K (616 purchases) + Mobile: $56K (83 purchases). 27% of all site purchases." details={['#1 revenue page on the site', '88% of revenue from desktop']}><span className="text-green-400 font-bold">$454K</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="conversion-rate" position="bottom"><span className="text-gray-400">Desktop Conv Rate</span></MetricTooltip>
                    <MetricValue value="0.86%" context="616 purchases from 71K sessions. Diluted by 30.6% Sign In traffic (returning users)." details={['Mobile: 0.43%', 'Effective prospect conv rate is higher']}><span className="text-white font-semibold">0.86%</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="scroll-depth" position="bottom"><span className="text-gray-400">Scroll to 50% (Desktop)</span></MetricTooltip>
                    <MetricValue value="9.9%" context="CATASTROPHIC. Dead last of 19 pages. 40.2% drop-off between 5–10% scroll." details={['Page is 9,346px tall', 'Mobile: 23.8% (also poor)']}><span className="text-red-400 font-bold">9.9%</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="dead-clicks" position="bottom"><span className="text-gray-400">Dead Clicks (Desktop)</span></MetricTooltip>
                    <MetricValue value="18.3%" context="4,714 wasted clicks. Body text, hero section. Lowest dead click rate on desktop but still significant." details={['Mobile: only 1.2%', 'Best desktop page for dead clicks']}><span className="text-red-400 font-bold">18.3%</span></MetricValue>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-red-900/20 border-l-4 border-red-500 rounded-r text-base text-gray-300">
                  #1 money page ($454K revenue, 27% of purchases). 90% of desktop users never see bottom half.
                </div>
              </div>

              {/* QB Certification */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-blue-400 mb-4">QuickBooks Certification</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="sessions" position="bottom"><span className="text-gray-400">Desktop Sessions</span></MetricTooltip>
                    <MetricValue value="23,747" context="#2 most-trafficked page. 18,743 new users (79%)." details={['Strong organic certification search traffic']}><span className="text-white font-semibold">23,747</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="revenue" position="bottom"><span className="text-gray-400">Revenue</span></MetricTooltip>
                    <MetricValue value="$298K" context="Desktop: $287K (393 purchases) + Mobile: $11K (15 purchases)." details={['#2 revenue page behind Homepage']}><span className="text-green-400 font-bold">$298K</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="conversion-rate" position="bottom"><span className="text-gray-400">Desktop Conv Rate</span></MetricTooltip>
                    <MetricValue value="1.66%" context="393 purchases from 23,747 sessions. Strong for $700 product despite dead clicks." details={['Mobile: 0.26%']}><span className="text-white font-semibold">1.66%</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="dead-clicks" position="bottom"><span className="text-gray-400">Dead Clicks (Desktop)</span></MetricTooltip>
                    <MetricValue value="25.9%" context="1 in 4 clicks wasted. Body text, checklist items, section backgrounds." details={['4,226 wasted clicks', 'Mobile: only 1.6%']}><span className="text-amber-400 font-bold">25.9%</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="faq-engagement" position="bottom"><span className="text-gray-400">FAQ Engagement (Mobile)</span></MetricTooltip>
                    <MetricValue value="62.4%" context="Highest FAQ engagement of any page. People have lots of questions about a $700 certification." details={['Desktop FAQ: 16.2%', '#1 mobile engagement pattern']}><span className="text-green-400 font-bold">62.4%</span></MetricValue>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-900/20 border-l-4 border-green-500 rounded-r text-base text-gray-300">
                  #2 revenue page. Tab navigation proven winner (4,239 clicks). High-intent buyers researching $699.95 credential.
                </div>
              </div>

              {/* Plans & Pricing */}
              <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-xl p-6 border border-green-700/50">
                <h3 className="text-xl font-bold text-green-400 mb-4">Plans & Pricing ⭐</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="sessions" position="bottom"><span className="text-gray-400">Desktop Sessions</span></MetricTooltip>
                    <MetricValue value="4,530" context="Low traffic but highest conversion (4.15%). People arrive here ready to decide." details={['Mobile gets MORE: 7,727 sessions', 'Avg engagement: only 58s — fast decisions']}><span className="text-white font-semibold">4,530</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="revenue" position="bottom"><span className="text-gray-400">Revenue</span></MetricTooltip>
                    <MetricValue value="$171K" context="Desktop: $138K (188 purchases) + Mobile: $34K (48 purchases)." details={['Highest mobile conv rate too (0.62%)']}><span className="text-green-400 font-bold">$171K</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="conversion-rate" position="bottom"><span className="text-gray-400">Desktop Conv Rate</span></MetricTooltip>
                    <MetricValue value="4.15%" context="BEST ON SITE. 188 purchases from 4,530 sessions. Short page + focused content = highest conversion." details={['2x the site average', 'Proves short pages convert better']}><span className="text-green-400 font-bold">4.15%</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="scroll-depth" position="bottom"><span className="text-gray-400">Scroll to 50% (Desktop)</span></MetricTooltip>
                    <MetricValue value="52.7%" context="Best desktop scroll. Only page where >50% reach midpoint on desktop." details={['Page is only 3,869px', '#1 desktop scroll depth']}><span className="text-green-400 font-bold">52.7%</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="page-height" position="bottom"><span className="text-gray-400">Page Height</span></MetricTooltip>
                    <MetricValue value="3,869px" context="Shortest page = highest conversion. The model for all other pages." details={['vs Homepage: 9,346px', 'Target: all pages ≤4,000px']}><span className="text-green-400 font-bold">3,869px</span></MetricValue>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-900/20 border-l-4 border-green-500 rounded-r text-base text-gray-300">
                  <strong>THE MODEL PAGE.</strong> Highest conversion, shortest page, best scroll retention. Mobile gets MORE sessions (7,727 vs 4,530).
                </div>
              </div>

              {/* Self-Paced Courses */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-blue-400 mb-4">Self-Paced Courses</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="sessions" position="bottom"><span className="text-gray-400">Desktop Sessions</span></MetricTooltip>
                    <MetricValue value="8,187" context="5,261 new users (64%). 2nd highest engagement (2m 23s)." details={['People browse courses extensively']}><span className="text-white font-semibold">8,187</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="revenue" position="bottom"><span className="text-gray-400">Revenue</span></MetricTooltip>
                    <MetricValue value="$122K" context="Desktop: $113K (164 purchases) + Mobile: $9K (13 purchases)." details={['If CTA rate doubled → ~$113K additional']}><span className="text-green-400 font-bold">$122K</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="cta-click-rate" position="bottom"><span className="text-gray-400">CTA Click Rate (Desktop)</span></MetricTooltip>
                    <MetricValue value="4.6%" context="WORST of any page. Course cards get 26.5% of clicks but have no enrollment button." details={['Dead last: #11 of 11 pages', 'Mobile CTA rate: 14.3% (3x better)']}><span className="text-red-400 font-bold">4.6%</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="dead-clicks" position="bottom"><span className="text-gray-400">Dead Clicks (Desktop)</span></MetricTooltip>
                    <MetricValue value="25.6%" context="7,213 wasted clicks. Course card areas, body text, section backgrounds." details={['Mobile: only 1.0%']}><span className="text-amber-400 font-bold">25.6%</span></MetricValue>
                  </div>
                  <div className="flex justify-between text-base">
                    <MetricTooltip metric="page-height" position="bottom"><span className="text-gray-400">Page Height (Mobile)</span></MetricTooltip>
                    <MetricValue value="13,213px" context="LONGEST page in entire dataset. Only 21.4% reach midpoint." details={['3.4x Plans & Pricing', 'Needs filtering, not infinite scroll']}><span className="text-red-400 font-bold">13,213px</span></MetricValue>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-red-900/20 border-l-4 border-red-500 rounded-r text-base text-gray-300">
                  Conversion black hole. Course cards get 26.5% clicks but only 4.6% reach CTA. Longest page in dataset.
                </div>
              </div>
            </div>
                </>
              )}

              {/* Homepage Deep Dive */}
              {activePageAnalysis === 1 && (
                <>
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <h3 className="text-2xl font-bold text-white mb-4">Key Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="sessions" position="right"><span className="text-gray-400">Desktop Sessions</span></MetricTooltip>
                          <MetricValue value="71,419" context="The most-visited page. 37,430 new users (52%) + 33,989 returning." details={['52% new users, 48% returning', '30.6% of clicks are Sign In (returning users)', '#1 landing page for direct traffic']}><span className="text-white font-semibold">71,419</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="sessions" position="right"><span className="text-gray-400">Mobile Sessions</span></MetricTooltip>
                          <MetricValue value="19,405" context="14,891 new users (77%). Mobile homepage visitors are discovering the brand for the first time." details={['77% new users vs 52% on desktop', 'CTA engagement is excellent at 43.3%', 'Only 3.6% Sign In clicks (vs 30.6% desktop)']}><span className="text-white font-semibold">19,405</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="revenue" position="right"><span className="text-gray-400">Desktop Revenue</span></MetricTooltip>
                          <MetricValue value="$398,530" context="#1 revenue page. 616 desktop purchases. 27% of all site purchases happen through this page." details={['616 purchases at ~$647 avg', '27% of all site purchases', 'Despite only 9.9% scrolling to midpoint']}><span className="text-green-400 font-bold">$398,530</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="revenue" position="right"><span className="text-gray-400">Mobile Revenue</span></MetricTooltip>
                          <MetricValue value="$55,956" context="83 mobile purchases. Most mobile visitors research here then return on desktop to buy." details={['83 purchases at ~$674 avg', 'Mobile drives MORE desktop conversions indirectly', '43.3% CTA engagement = high research quality']}><span className="text-green-400 font-bold">$55,956</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="conversion-rate" position="right"><span className="text-gray-400">Desktop Conv Rate</span></MetricTooltip>
                          <MetricValue value="0.86%" context="616 purchases from 71,419 sessions. Looks low but this is the entry page — many visitors are just signing in or browsing." details={['Dragged down by 30.6% Sign In traffic', 'Among actual prospects, effective rate is higher', 'Avg engagement: 1m 50s']}><span className="text-white font-semibold">0.86%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="conversion-rate" position="right"><span className="text-gray-400">Mobile Conv Rate</span></MetricTooltip>
                          <MetricValue value="0.43%" context="83 purchases from 19,405 sessions. Expected for a $682 AOV — mobile is the research channel." details={['Cross-device journey: research mobile, buy desktop', 'Mobile CTA engagement (43.3%) proves intent exists', 'Avg engagement: 1m 08s']}><span className="text-white font-semibold">0.43%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="scroll-depth" position="right"><span className="text-gray-400">Scroll to 50% (Desktop)</span></MetricTooltip>
                          <MetricValue value="9.9%" context="CATASTROPHIC. Only 1 in 10 desktop visitors sees the bottom half of the page. Page is 9,346px tall." details={['40.2% drop-off between 5% and 10% scroll', '#19 out of 19 pages (dead last)', 'Mobile: 23.8% (also poor)', 'Plans & Pricing (3,869px): 52.7% reach 50%']}><span className="text-red-400 font-bold">9.9%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <MetricTooltip metric="dead-clicks" position="right"><span className="text-gray-400">Dead Clicks (Desktop)</span></MetricTooltip>
                          <MetricValue value="18.3%" context="4,714 clicks on non-interactive elements. Body text, hero section backgrounds." details={['4,714 wasted clicks out of 30,199 total', 'Lowest dead click rate of any desktop page', 'Mobile dead clicks: only 1.2%', 'Still represents ~$80K+ in lost opportunity']}><span className="text-red-400 font-bold">18.3%</span></MetricValue>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-red-300 mb-3">Critical Issues</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span><strong>#1 money page</strong> - $454K revenue, 27% of all purchases</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span><strong>90% of desktop users never see bottom half</strong> (9.9% scroll to 50%)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span><strong>40.2% drop-off between 5–10% scroll depth</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>Mobile engagement is excellent (43.3% CTA clicks)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-blue-300 mb-4">Action Steps</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="font-semibold text-white mb-2">HP-1: Consolidate from 9 Sections to 6</div>
                          <p className="text-gray-300 mb-2">Hero → Trust Bar → Offerings Grid → Interactive Comparison Table → FAQ → Final CTA</p>
                          <p className="text-gray-400 text-base">Cut separate pricing cards, testimonials, instructor section. Saves ~2,000–3,000px.</p>
                        </div>
                        <div>
                          <div className="font-semibold text-white mb-2">HP-2: Fix the First-Fold Experience</div>
                          <p className="text-gray-400 text-base">40.2% desktop drop-off at 5–10% scroll must be investigated. First viewport should show: headline, value prop, CTA, and trust bar.</p>
                        </div>
                        <div>
                          <div className="font-semibold text-white mb-2">HP-3: Reduce Sign In Visual Weight</div>
                          <p className="text-gray-400 text-base">"Start Learning": green, filled, prominent. "Sign In": text-only or outline, smaller. Must NOT look like equal-weight options.</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Screenshot with Overlays */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4">Visual Analysis</h3>
                      <PageScreenshotWithOverlays
                        imagePath="/screenshots/homepage-full.png"
                        pageHeight={8000}
                        scrollZones={[
                          { top: 0, height: 5, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                          { top: 5, height: 5, color: 'rgba(34, 197, 94, 0.15)', label: 'reach here', percentage: '90%' },
                          { top: 10, height: 10, color: 'rgba(234, 179, 8, 0.2)', label: 'scroll to here', percentage: '50%' },
                          { top: 20, height: 30, color: 'rgba(239, 68, 68, 0.2)', label: 'see this', percentage: '9.9%' },
                          { top: 50, height: 50, color: 'rgba(220, 38, 38, 0.3)', label: 'ever reach bottom', percentage: '<5%' }
                        ]}
                        deadClickHotspots={[
                          { x: 30, y: 15, label: 'Sign In button area', percentage: '30.6%' },
                          { x: 50, y: 35, label: 'Pricing table text', percentage: '18.3%' },
                          { x: 65, y: 55, label: 'Section background', percentage: '12%' }
                        ]}
                        ctaMarkers={[
                          { x: 50, y: 12, label: 'View Pricing CTA', percentage: '21.8%' },
                          { x: 30, y: 40, label: 'Explore Classes', percentage: '15.2%' },
                          { x: 70, y: 45, label: 'Get Certified', percentage: '12.6%' }
                        ]}
                        mobileConfig={{
                          pageHeight: 11466,
                          scrollZones: [
                            { top: 0, height: 5, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                            { top: 5, height: 10, color: 'rgba(34, 197, 94, 0.15)', label: 'reach here', percentage: '75%' },
                            { top: 15, height: 15, color: 'rgba(234, 179, 8, 0.2)', label: 'scroll here', percentage: '28.4%' },
                            { top: 30, height: 70, color: 'rgba(239, 68, 68, 0.3)', label: 'ever reach', percentage: '<5%' }
                          ],
                          deadClickHotspots: [
                            { x: 50, y: 25, label: 'FAQ accordions', percentage: '24.5%' },
                            { x: 50, y: 15, label: 'Banner text', percentage: '1.6%' }
                          ],
                          ctaMarkers: [
                            { x: 50, y: 8, label: 'Start Learning CTA', percentage: '27.1%' },
                            { x: 50, y: 20, label: 'View Plans', percentage: '18.3%' },
                            { x: 50, y: 35, label: 'FAQ engagement', percentage: '24.5%' }
                          ],
                          summary: 'Mobile homepage is 11,466px tall — 23% longer than desktop. Only 28.4% reach the midpoint. Sign In drops to just 3.6% of taps (vs 30.6% desktop). FAQ accordions dominate mobile engagement at 24.5% of all taps.'
                        }}
                        overlayDescriptions={{
                          scrollDepth: {
                            desktop: 'Homepage desktop is 9,346px tall — the longest page on the site. Only 9.9% of visitors reach the halfway point. The bottom 50% of content is virtually invisible. Every section below the fold needs to earn its place.',
                            mobile: 'Mobile homepage is even longer at 11,466px. Only 28.4% scroll to the midpoint — better than desktop\'s 9.9% because mobile users are accustomed to vertical scrolling. But 70%+ of content is still unseen.'
                          },
                          deadClicks: {
                            desktop: 'Desktop dead click rate: 18.3%. The #1 dead click target is the Sign In button area (30.6% of all clicks) — returning students dominate the page. Pricing table text and section backgrounds also attract frustrated clicks.',
                            mobile: 'Mobile dead clicks drop to just 1.6% — a 91% reduction from desktop. The linear, tap-friendly mobile layout eliminates most clickability confusion. Banner text is the only notable dead click area.'
                          },
                          ctaPerformance: {
                            desktop: 'Desktop CTA click rate: ~21.8% for the primary "View Pricing" button. Secondary CTAs (Explore Classes, Get Certified) pull 12–15% each. Sign In absorbs 30.6% of clicks, starving prospect-facing CTAs of attention.',
                            mobile: 'Mobile CTA tap rate: 27.1% for "Start Learning" — significantly higher than desktop. The linear scroll layout naturally guides users through CTAs. FAQ accordions capture 24.5% of taps, showing active research behavior.'
                          }
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* QB Certification Deep Dive */}
              {activePageAnalysis === 2 && (
                <>
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <h3 className="text-2xl font-bold text-white mb-4">Key Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="sessions" position="right"><span className="text-gray-400">Desktop Sessions</span></MetricTooltip>
                          <MetricValue value="23,747" context="18,743 new users (79%). High organic traffic — people actively searching for QuickBooks certification." details={['#2 most-trafficked page after Homepage', '79% new users indicates strong SEO/paid acquisition']}><span className="text-white font-semibold">23,747</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="sessions" position="right"><span className="text-gray-400">Mobile Sessions</span></MetricTooltip>
                          <MetricValue value="5,820" context="4,065 new users (70%). Mobile visitors researching the $699.95 Certification Plan." details={['Mobile scroll depth is excellent (65.4%)', 'Only 15 mobile purchases — expected for $700 product']}><span className="text-white font-semibold">5,820</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="revenue" position="right"><span className="text-gray-400">Total Revenue</span></MetricTooltip>
                          <MetricValue value="$298,409" context="#2 revenue page. Desktop: $287,410 (393 purchases) + Mobile: $10,999 (15 purchases)." details={['$287K desktop / $11K mobile', '393 desktop purchases at ~$731 avg', '#2 behind Homepage ($454K)']}><span className="text-green-400 font-bold">$298,409</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="conversion-rate" position="right"><span className="text-gray-400">Desktop Conv Rate</span></MetricTooltip>
                          <MetricValue value="1.66%" context="393 purchases from 23,747 desktop sessions. Strong for a $700 product despite 25.9% dead clicks." details={['Above avg for high-ticket items', 'Dead click fix could push this past 2%', 'Mobile: only 0.26% (expected cross-device behavior)']}><span className="text-white font-semibold">1.66%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="scroll-depth" position="right"><span className="text-gray-400">Scroll to 50% (Mobile)</span></MetricTooltip>
                          <MetricValue value="65.4%" context="Excellent mobile scroll — #3 in entire dataset. People thoroughly research certification on their phones." details={['Desktop scroll: only 35.8%', 'Mobile outperforms desktop by 30 percentage points', 'FAQ engagement drives deep scrolling (62.4% of mobile clicks)']}><span className="text-green-400 font-bold">65.4%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <MetricTooltip metric="dead-clicks" position="right"><span className="text-gray-400">Dead Clicks (Desktop)</span></MetricTooltip>
                          <MetricValue value="25.9%" context="1 in 4 desktop clicks hit non-interactive elements. Body text, checklist items, section backgrounds." details={['4,226 wasted clicks out of 16,301 total', 'People clicking on cert requirement text expecting links', 'Mobile dead clicks: only 1.6%', 'Fixing this could uplift conversion by ~10% (+$28K)']}><span className="text-amber-400 font-bold">25.9%</span></MetricValue>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-900/20 border-l-4 border-green-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-green-300 mb-3">Strengths</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span><strong>#2 revenue page</strong> - $298K total revenue</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span><strong>Tab navigation proven winner</strong> - 4,239 tab clicks</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span><strong>Massive FAQ engagement</strong> - 16.2% desktop, 62.4% mobile</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>High-intent buyers researching $699.95 credential</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-blue-300 mb-4">Action Steps</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="font-semibold text-white mb-2">QC-1: Optimize for the $699.95 Decision</div>
                          <p className="text-gray-400 text-base">Lead with outcomes: "Get 3 Intuit Certifications. Average 20–30% salary increase." Keep "Learn → Practice → Pass" three-step breakdown prominent. Expand FAQ to 10–12 questions.</p>
                        </div>
                        <div>
                          <div className="font-semibold text-white mb-2">QC-2: Handle /certification-mobile Traffic</div>
                          <p className="text-gray-400 text-base">301 redirect from /certification-mobile to /quickbooks-certification — 13,238 sessions at stake.</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Screenshot with Overlays */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4">Visual Analysis</h3>
                      <PageScreenshotWithOverlays
                        imagePath="/screenshots/qb-certification-full.png"
                        pageHeight={7000}
                        scrollZones={[
                          { top: 0, height: 5, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                          { top: 5, height: 30, color: 'rgba(234, 179, 8, 0.2)', label: 'scroll here', percentage: '65.4%' },
                          { top: 35, height: 15, color: 'rgba(239, 68, 68, 0.2)', label: 'reach this', percentage: '35.8%' }
                        ]}
                        deadClickHotspots={[
                          { x: 50, y: 20, label: 'Tab navigation', percentage: '25.9%' },
                          { x: 35, y: 50, label: 'FAQ accordion text', percentage: '16.2%' },
                          { x: 65, y: 35, label: 'Certification details', percentage: '12%' }
                        ]}
                        ctaMarkers={[
                          { x: 50, y: 15, label: 'Get Certified CTA', percentage: '25.3%' },
                          { x: 40, y: 60, label: 'FAQ engagement', percentage: '62.4%' },
                          { x: 60, y: 25, label: 'Tab clicks', percentage: '17.9%' }
                        ]}
                        mobileConfig={{
                          pageHeight: 8500,
                          scrollZones: [
                            { top: 0, height: 8, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                            { top: 8, height: 30, color: 'rgba(34, 197, 94, 0.15)', label: 'scroll here', percentage: '70%' },
                            { top: 38, height: 20, color: 'rgba(234, 179, 8, 0.2)', label: 'reach here', percentage: '40%' },
                            { top: 58, height: 42, color: 'rgba(239, 68, 68, 0.2)', label: 'see this', percentage: '<15%' }
                          ],
                          deadClickHotspots: [
                            { x: 50, y: 30, label: 'Body text taps', percentage: '1.6%' }
                          ],
                          ctaMarkers: [
                            { x: 50, y: 10, label: 'Enroll Now CTA', percentage: '27.6%' },
                            { x: 50, y: 40, label: 'FAQ accordions', percentage: '62.4%' },
                            { x: 50, y: 25, label: 'Tab navigation', percentage: '8.1%' }
                          ],
                          summary: 'Mobile QB Cert has 13K sessions (research channel for $699.95 purchase). Dead clicks drop to just 1.6%. FAQ accordions capture 62.4% of taps — healthy research behavior for a $700 certification decision. Zero mobile conversions; all purchases happen on desktop.'
                        }}
                        overlayDescriptions={{
                          scrollDepth: {
                            desktop: 'QB Certification desktop page: 65.4% scroll past the hero section, 35.8% reach the FAQ zone. The tab navigation near the top captures attention early, but the certification requirements section below the fold loses people.',
                            mobile: 'Mobile QB Cert retains slightly better: 70% scroll past the hero, 40% reach the FAQ section. The linear mobile layout makes the content flow more naturally. Below 58% mark, visibility drops to <15%.'
                          },
                          deadClicks: {
                            desktop: 'Desktop dead click rate: 25.9%. Tab navigation elements and certification detail text attract frustrated clicks — users expect these to be interactive links. FAQ accordion text also gets clicked where only the header is active.',
                            mobile: 'Mobile dead clicks collapse to 1.6%. The tap-friendly accordion pattern works beautifully on mobile. Users instinctively tap FAQ headers rather than body text, nearly eliminating dead click frustration.'
                          },
                          ctaPerformance: {
                            desktop: 'Desktop CTA rate: 25.3% for "Get Certified" — strong for a $699.95 product. FAQ engagement captures 62.4% of interactions. Tab clicks get 17.9%. The high FAQ rate shows people have questions before committing to a $700 certification.',
                            mobile: 'Mobile CTA rate: 27.6% for "Enroll Now". FAQ accordions dominate at 62.4% of all taps — the highest intentional engagement pattern. This is research behavior for a $700 purchase that converts on desktop later.'
                          }
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Plans & Pricing Deep Dive */}
              {activePageAnalysis === 3 && (
                <>
                  <div className="space-y-6">
                    <div className="bg-green-900/40 rounded-lg p-6 border border-green-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">⭐</span>
                        <h3 className="text-2xl font-bold text-green-300">THE MODEL PAGE</h3>
                      </div>
                      <p className="text-gray-300 text-lg">Highest conversion, shortest page, best scroll retention. This page WORKS.</p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <h3 className="text-2xl font-bold text-white mb-4">Key Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Desktop Sessions</span>
                          <span className="text-white font-semibold">4,530</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="sessions" position="right"><span className="text-gray-400">Mobile Sessions</span></MetricTooltip>
                          <MetricValue value="7,727" context="MORE mobile sessions than desktop (7,727 vs 4,530). These are plan researchers studying pricing on their phones." details={['3,914 new users (51%)', 'Mobile conv: 0.62% (48 purchases)', 'Most will return on desktop to buy']}><span className="text-white font-semibold">7,727</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="revenue" position="right"><span className="text-gray-400">Total Revenue</span></MetricTooltip>
                          <MetricValue value="$171,389" context="Desktop: $137,591 (188 purchases) + Mobile: $33,798 (48 purchases). Highest-converting page on the site." details={['Desktop: $137K from 188 purchases', 'Mobile: $34K from 48 purchases', 'Mobile has highest mobile conv rate (0.62%)']}><span className="text-green-400 font-bold">$171,389</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="conversion-rate" position="right"><span className="text-gray-400">Desktop Conv Rate</span></MetricTooltip>
                          <MetricValue value="4.15%" context="BEST ON SITE. 188 purchases from 4,530 sessions. Proves short pages convert better for $700 products." details={['#1 conversion rate of any page', 'Shortest page (3,869px) = best conversion', 'Despite 36.5% dead clicks — imagine fixing those', 'Avg engagement: only 58s — people decide fast']}><span className="text-green-400 font-bold">4.15%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="scroll-depth" position="right"><span className="text-gray-400">Scroll to 50% (Desktop)</span></MetricTooltip>
                          <MetricValue value="52.7%" context="Best desktop scroll depth of any page. The shortest page retains the most visitors — proof that short = better." details={['#1 desktop scroll depth', 'Only page where >50% see the midpoint on desktop', 'Page is only 3,869px tall (vs 9,346px homepage)']}><span className="text-green-400 font-bold">52.7%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <MetricTooltip metric="page-height" position="right"><span className="text-gray-400">Page Height</span></MetricTooltip>
                          <MetricValue value="3,869px" context="Shortest page on the entire site — and the highest converting. This is the model for all other pages." details={['vs Homepage: 9,346px (0.86% conv)', 'vs Self-Paced Mobile: 13,213px (0.30% conv)', 'Target for new site: all pages ≤4,000px']}><span className="text-green-400 font-bold">3,869px</span></MetricValue>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-amber-300 mb-3">Opportunity</h3>
                      <p className="text-gray-300 mb-3">36.5% dead clicks — mostly on the comparison table (1,513 clicks on table text). Mobile gets MORE sessions than desktop (7,727 vs 4,530) — these are plan researchers.</p>
                    </div>

                    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-blue-300 mb-4">Action Steps</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="font-semibold text-white mb-2">PP-1: Protect This Page</div>
                          <p className="text-gray-400 text-base">4.15% desktop conversion — highest of any page. 3,869px — shortest page. This page WORKS. Do NOT add more content. Only make comparison table interactive.</p>
                        </div>
                        <div>
                          <div className="font-semibold text-white mb-2">PP-2: Enhance Mobile Plan Comparison</div>
                          <p className="text-gray-400 text-base">7,727 mobile sessions but 0.62% conversion. Consider swipeable card comparison on mobile. Highlight differences between plans.</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Screenshot with Overlays */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4">Visual Analysis</h3>
                      <PageScreenshotWithOverlays
                        imagePath="/screenshots/plans-pricing-full.png"
                        pageHeight={3869}
                        scrollZones={[
                          { top: 0, height: 10, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                          { top: 10, height: 40, color: 'rgba(34, 197, 94, 0.15)', label: 'scroll here', percentage: '52.7%' },
                          { top: 50, height: 50, color: 'rgba(234, 179, 8, 0.2)', label: 'reach bottom', percentage: '30%' }
                        ]}
                        deadClickHotspots={[
                          { x: 50, y: 35, label: 'Comparison table text', percentage: '36.5%' },
                          { x: 30, y: 25, label: 'Plan card details', percentage: '15%' },
                          { x: 70, y: 40, label: 'Feature list', percentage: '10%' }
                        ]}
                        ctaMarkers={[
                          { x: 35, y: 55, label: 'Learner Plan CTA', percentage: '16.7%' },
                          { x: 50, y: 55, label: 'Certification CTA', percentage: '16.7%' },
                          { x: 65, y: 55, label: 'Team Plan CTA', percentage: '16.7%' }
                        ]}
                        mobileConfig={{
                          pageHeight: 6800,
                          scrollZones: [
                            { top: 0, height: 8, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                            { top: 8, height: 25, color: 'rgba(34, 197, 94, 0.15)', label: 'scroll here', percentage: '65%' },
                            { top: 33, height: 30, color: 'rgba(234, 179, 8, 0.2)', label: 'reach here', percentage: '35%' },
                            { top: 63, height: 37, color: 'rgba(239, 68, 68, 0.2)', label: 'see bottom', percentage: '<15%' }
                          ],
                          deadClickHotspots: [
                            { x: 50, y: 40, label: 'Plan feature text', percentage: '1.2%' }
                          ],
                          ctaMarkers: [
                            { x: 50, y: 15, label: 'Top plan CTA', percentage: '28.7%' },
                            { x: 50, y: 35, label: 'Compare plans', percentage: '22.1%' },
                            { x: 50, y: 55, label: 'FAQ accordions', percentage: '18.4%' }
                          ],
                          summary: 'Mobile Plans & Pricing is 6,800px (76% taller than desktop\'s 3,869px). CTA tap rate hits 28.7% — nearly 2x desktop. Dead clicks nearly vanish at 1.2%. Stacked plan cards work well on mobile, but the comparison table becomes a horizontal scroll nightmare.'
                        }}
                        overlayDescriptions={{
                          scrollDepth: {
                            desktop: 'Plans & Pricing is the shortest page at 3,869px — and the best-converting. 52.7% reach the midpoint (best of any page). ~30% see the bottom. Shorter pages retain dramatically better for a $682 AOV product.',
                            mobile: 'Mobile Plans & Pricing expands to 6,800px (76% taller) due to stacked plan cards. 65% scroll past the first plan, 35% reach the comparison section, but <15% see the FAQ at the bottom.'
                          },
                          deadClicks: {
                            desktop: 'Desktop dead click rate: 36.5% — the worst of any page. The comparison table text is the #1 offender — users click feature rows expecting toggle or detail expansion. Plan card detail text and feature lists also attract frustrated clicks.',
                            mobile: 'Mobile dead clicks plummet to 1.2% — a 97% reduction. Stacked plan cards with clear tap targets work well. The comparison table (which causes 36.5% desktop dead clicks) is either hidden or scrollable on mobile.'
                          },
                          ctaPerformance: {
                            desktop: 'Desktop CTA rate: 16.7% evenly split across Learner Plan, Certification Plan, and Team Plan CTAs. This even distribution suggests users are comparing — good for a pricing page. The 4.15% conversion rate is the best of any page.',
                            mobile: 'Mobile CTA tap rate: 28.7% — nearly 2x desktop. The linear card stack naturally puts CTAs in the thumb zone. "Compare plans" gets 22.1%, FAQ accordions 18.4%. Mobile is the research channel that feeds desktop conversion.'
                          }
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Live Classes Deep Dive */}
              {activePageAnalysis === 4 && (
                <>
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <h3 className="text-2xl font-bold text-white mb-4">Key Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="sessions" position="right"><span className="text-gray-400">Desktop Sessions</span></MetricTooltip>
                          <MetricValue value="10,025" context="7,552 new users (75%). People actively searching for live QuickBooks classes." details={['75% new users from organic/paid search', '222 desktop purchases', '#3 desktop converter at 2.21%']}><span className="text-white font-semibold">10,025</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="sessions" position="right"><span className="text-gray-400">Mobile Sessions</span></MetricTooltip>
                          <MetricValue value="5,146" context="3,898 new users (76%). Mobile visitors with incredible 45.6% CTA click rate but only 0.31% conversion." details={['45.6% CTA engagement (highest gap to conversion)', 'Only 16 mobile purchases', 'Widest engagement-to-conversion gap in data']}><span className="text-white font-semibold">5,146</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="revenue" position="right"><span className="text-gray-400">Total Revenue</span></MetricTooltip>
                          <MetricValue value="$166,388" context="#3 revenue page. Desktop: $155,589 (222 purchases). Highest engagement time of any page." details={['Desktop: $155K / Mobile: $11K', '222 desktop purchases at ~$700 avg', 'People spend 2m 26s evaluating classes']}><span className="text-green-400 font-bold">$166,388</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="conversion-rate" position="right"><span className="text-gray-400">Desktop Conv Rate</span></MetricTooltip>
                          <MetricValue value="2.21%" context="222 purchases from 10,025 sessions. #3 converter. Instructor modal clicks (791) show trust matters." details={['#3 desktop conversion rate', '791 instructor modal clicks on desktop', 'Tab navigation (One-Hour vs Two-Day) works well']}><span className="text-white font-semibold">2.21%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="avg-engagement" position="right"><span className="text-gray-400">Avg Engagement</span></MetricTooltip>
                          <MetricValue value="2m 26s" context="HIGHEST engagement time of any page. People thoroughly evaluate class schedules and instructors before committing $700." details={['#1 engagement time in entire dataset', 'Instructor bios drive deep engagement', 'One-Hour vs Two-Day tabs both get strong clicks']}><span className="text-green-400 font-bold">2m 26s</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <MetricTooltip metric="cta-click-rate" position="right"><span className="text-gray-400">Mobile CTA Click Rate</span></MetricTooltip>
                          <MetricValue value="45.6%" context="Highest CTA engagement of any page on any device. Nearly half of all mobile clicks go to CTAs — but only 0.31% convert." details={['#1 CTA click rate in entire dataset', 'Yet only 0.31% mobile conversion', 'Classic cross-device: research mobile, buy desktop', 'Improving mobile research here → more desktop conversions']}><span className="text-green-400 font-bold">45.6%</span></MetricValue>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-900/20 border-l-4 border-green-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-green-300 mb-3">Strengths</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span><strong>Highest engagement time</strong> - 2m 26s average</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span><strong>#3 converter</strong> - 2.21% desktop conversion</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span><strong>Instructor modals popular</strong> - 1,083 total clicks</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span><strong>Clearest cross-device journey signal</strong> - 45.6% mobile CTA rate</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-blue-300 mb-4">Action Steps</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="font-semibold text-white mb-2">LC-1: Surface the Schedule Prominently</div>
                          <p className="text-gray-400 text-base">Class schedule above the fold. Instructor names linked to profiles. Keep One-Hour vs Two-Day format toggle.</p>
                        </div>
                        <div>
                          <div className="font-semibold text-white mb-2">LC-2: Instructor Trust Signals</div>
                          <p className="text-gray-400 text-base">Photo + name + "X,000+ students trained" shown inline (not behind modal). Add short bio + student review per instructor.</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Screenshot with Overlays */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4">Visual Analysis</h3>
                      <PageScreenshotWithOverlays
                        imagePath="/screenshots/live-classes-full.png"
                        pageHeight={6500}
                        scrollZones={[
                          { top: 0, height: 5, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                          { top: 5, height: 33, color: 'rgba(234, 179, 8, 0.2)', label: 'scroll here', percentage: '50.8%' },
                          { top: 38, height: 12, color: 'rgba(239, 68, 68, 0.2)', label: 'reach this', percentage: '37.7%' }
                        ]}
                        deadClickHotspots={[
                          { x: 50, y: 25, label: 'Instructor modals', percentage: '18%' },
                          { x: 35, y: 40, label: 'Class schedule', percentage: '12%' },
                          { x: 65, y: 35, label: 'Format toggle', percentage: '8%' }
                        ]}
                        ctaMarkers={[
                          { x: 50, y: 15, label: 'Enroll Now', percentage: '23.4%' },
                          { x: 40, y: 30, label: 'Instructor profiles', percentage: '18.5%' },
                          { x: 60, y: 45, label: 'Schedule CTA', percentage: '15.2%' }
                        ]}
                        mobileConfig={{
                          pageHeight: 9200,
                          scrollZones: [
                            { top: 0, height: 6, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                            { top: 6, height: 25, color: 'rgba(34, 197, 94, 0.15)', label: 'scroll here', percentage: '60%' },
                            { top: 31, height: 25, color: 'rgba(234, 179, 8, 0.2)', label: 'reach here', percentage: '35%' },
                            { top: 56, height: 44, color: 'rgba(239, 68, 68, 0.2)', label: 'see this', percentage: '<10%' }
                          ],
                          deadClickHotspots: [
                            { x: 50, y: 20, label: 'Instructor photo taps', percentage: '2.1%' }
                          ],
                          ctaMarkers: [
                            { x: 50, y: 8, label: 'Enroll Now CTA', percentage: '26.1%' },
                            { x: 50, y: 30, label: 'FAQ accordions', percentage: '65.2%' },
                            { x: 50, y: 50, label: 'Schedule view', percentage: '8.7%' }
                          ],
                          summary: 'Mobile Live Classes has the highest engagement time (2m 26s) — people thoroughly evaluate a $700 instructor-led training. FAQ accordions dominate at 65.2% of taps, the highest of any page. Dead clicks are minimal at 2.1%. This is deep research behavior that converts on desktop.'
                        }}
                        overlayDescriptions={{
                          scrollDepth: {
                            desktop: 'Live Classes desktop: 50.8% scroll past the instructor section, 37.7% reach the schedule area. The highest engagement time of any page (2m 26s) means people are reading deeply, even if they don\'t scroll far. Instructor profiles anchor attention.',
                            mobile: 'Mobile Live Classes: 60% scroll past the hero, 35% reach the schedule. The linear layout helps retention. With 2m 26s avg engagement, mobile users are thoroughly researching before switching to desktop to enroll.'
                          },
                          deadClicks: {
                            desktop: 'Desktop dead click rate: 18%. Instructor modal/photo areas generate the most dead clicks — users click expecting bios to expand. Class schedule text and format toggle also attract frustrated clicks.',
                            mobile: 'Mobile dead clicks: just 2.1%, almost entirely on instructor photos. The tap-to-expand expectation is natural on mobile. Otherwise, the linear layout with clear tap targets nearly eliminates dead click frustration.'
                          },
                          ctaPerformance: {
                            desktop: 'Desktop CTA rate: 23.4% for "Enroll Now" — strong for a $700 live training. Instructor profiles pull 18.5% engagement, schedule CTAs 15.2%. The instructor trust signal is a major conversion driver.',
                            mobile: 'Mobile CTA rate: 26.1% for "Enroll Now". FAQ accordions dominate at 65.2% — the highest of any page. Mobile users have the most questions about live classes (schedule, format, instructor). This deep research feeds desktop conversion.'
                          }
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Self-Paced Courses Deep Dive */}
              {activePageAnalysis === 5 && (
                <>
                  <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <h3 className="text-2xl font-bold text-white mb-4">Key Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="sessions" position="right"><span className="text-gray-400">Desktop Sessions</span></MetricTooltip>
                          <MetricValue value="8,187" context="5,261 new users (64%). 2nd highest engagement time (2m 23s) — people browse courses extensively." details={['64% new users from search', '164 desktop purchases', 'Avg engagement: 2m 23s (people browse lots of courses)']}><span className="text-white font-semibold">8,187</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="sessions" position="right"><span className="text-gray-400">Mobile Sessions</span></MetricTooltip>
                          <MetricValue value="4,315" context="3,081 new users (71%). The longest page in the dataset at 13,213px — only 21.4% reach midpoint." details={['71% new users', 'Only 13 mobile purchases (0.30% conv)', 'Page is 13,213px tall — absurdly long for mobile']}><span className="text-white font-semibold">4,315</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="revenue" position="right"><span className="text-gray-400">Total Revenue</span></MetricTooltip>
                          <MetricValue value="$122,320" context="Desktop: $113,121 (164 purchases) + Mobile: $9,199 (13 purchases)." details={['Desktop: $113K / Mobile: $9K', 'If CTA rate doubled → ~$113K additional', '"Load More" gets 1,154 clicks — people want to see more']}><span className="text-green-400 font-bold">$122,320</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="conversion-rate" position="right"><span className="text-gray-400">Desktop Conv Rate</span></MetricTooltip>
                          <MetricValue value="2.00%" context="164 purchases from 8,187 sessions. Those who find a CTA convert well — the problem is getting them there." details={['Decent rate despite 4.6% CTA click rate', 'People who DO click CTAs convert at ~43%', 'The problem is conversion path, not intent']}><span className="text-white font-semibold">2.00%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <MetricTooltip metric="cta-click-rate" position="right"><span className="text-gray-400">Desktop CTA Click Rate</span></MetricTooltip>
                          <MetricValue value="4.6%" context="WORST CTA RATE OF ANY PAGE. Only 1,387 of 30,168 clicks reach a CTA. Course cards get 26.5% of clicks but have no enrollment button." details={['Dead last: #11 out of 11 pages', 'Course cards: 7,996 clicks (26.5%) — no CTA on them', '"Load More": 1,154 clicks (3.8%)', 'Mobile CTA rate: 14.3% (3x better)']}><span className="text-red-400 font-bold">4.6%</span></MetricValue>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <MetricTooltip metric="page-height" position="right"><span className="text-gray-400">Page Height (Mobile)</span></MetricTooltip>
                          <MetricValue value="13,213px" context="LONGEST PAGE IN DATASET. Only 21.4% reach midpoint. Needs pagination or filtering instead of infinite scroll." details={['3.4x the height of Plans & Pricing (3,869px)', 'Desktop: 20.6% reach 50% (also terrible)', 'New site has filters (46 courses) — much improved', 'Target: ≤5,000px with category filtering']}><span className="text-red-400 font-bold">13,213px</span></MetricValue>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-red-300 mb-3">Critical Issues</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span><strong>The conversion black hole</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>Course cards get 26.5% of clicks (7,996) but only <strong>4.6% reach any CTA</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>People browse thinking they're buying individual courses</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span>Longest page in dataset (13,213px mobile)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                      <h3 className="text-xl font-bold text-blue-300 mb-4">Action Steps</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="font-semibold text-white mb-2">SC-1: "One Plan, All Courses" Messaging</div>
                          <p className="text-gray-400 text-base">Headline: "46+ Self-Paced Courses — Included in Every Plan." Banner above grid: "One plan gives you access to all courses."</p>
                        </div>
                        <div>
                          <div className="font-semibold text-white mb-2">SC-2: Keep It Manageable</div>
                          <p className="text-gray-400 text-base">Show 9–12 cards by default. Group by: Most Popular, Beginners, Industry-Specific, Certification Prep. Keep total height under 5,000px.</p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Screenshot with Overlays */}
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4">Visual Analysis</h3>
                      <PageScreenshotWithOverlays
                        imagePath="/screenshots/self-paced-full.png"
                        pageHeight={13213}
                        scrollZones={[
                          { top: 0, height: 3, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                          { top: 3, height: 18, color: 'rgba(234, 179, 8, 0.2)', label: 'scroll here', percentage: '21.4%' },
                          { top: 21, height: 79, color: 'rgba(239, 68, 68, 0.3)', label: 'ever reach', percentage: '<5%' }
                        ]}
                        deadClickHotspots={[
                          { x: 50, y: 30, label: 'Course cards (no CTA)', percentage: '26.5%' },
                          { x: 30, y: 50, label: '"Load More" button', percentage: '25.6%' },
                          { x: 70, y: 40, label: 'Course details', percentage: '15%' }
                        ]}
                        ctaMarkers={[
                          { x: 50, y: 5, label: 'Top CTA (rarely seen)', percentage: '4.6%' },
                          { x: 35, y: 85, label: 'Bottom CTA (never reached)', percentage: '<1%' }
                        ]}
                        mobileConfig={{
                          pageHeight: 18500,
                          scrollZones: [
                            { top: 0, height: 3, color: 'rgba(34, 197, 94, 0.2)', label: 'see this', percentage: '100%' },
                            { top: 3, height: 10, color: 'rgba(234, 179, 8, 0.2)', label: 'scroll here', percentage: '15%' },
                            { top: 13, height: 87, color: 'rgba(220, 38, 38, 0.3)', label: 'ever reach', percentage: '<3%' }
                          ],
                          deadClickHotspots: [
                            { x: 50, y: 15, label: 'Course card taps', percentage: '31.2%' },
                            { x: 50, y: 30, label: 'Load More button', percentage: '18.7%' }
                          ],
                          ctaMarkers: [
                            { x: 50, y: 5, label: 'Top CTA', percentage: '6.1%' },
                            { x: 50, y: 95, label: 'Bottom CTA', percentage: '<1%' }
                          ],
                          summary: 'Mobile Self-Paced is the worst-performing page: 18,500px tall with <3% ever reaching the midpoint. Course cards capture 31.2% of taps but lead nowhere. The "One Plan, All Courses" reframing in the new site eliminates this 60-course scroll maze entirely.'
                        }}
                        overlayDescriptions={{
                          scrollDepth: {
                            desktop: 'Self-Paced desktop is 13,213px tall — a scroll maze of 60+ individual course cards. Only 21.4% reach the midpoint, <5% see the bottom. 79% of the page content is essentially invisible. This is the strongest case for the "One Plan, All Courses" redesign.',
                            mobile: 'Mobile Self-Paced is the worst page at 18,500px. Less than 3% ever reach the midpoint. The endless course card scroll creates a "scroll fatigue" effect where users give up. The new site\'s plan-based approach eliminates this entirely.'
                          },
                          deadClicks: {
                            desktop: 'Desktop dead click rate: 26.5% on course cards and 25.6% on the "Load More" button. Users click course cards expecting a detail page or enrollment — but they go nowhere. The cards are visual dead ends.',
                            mobile: 'Mobile dead clicks: 31.2% on course cards — actually worse than desktop. Users instinctively tap cards expecting them to expand or navigate. The "Load More" button gets 18.7% of taps. Almost half of all mobile interaction is wasted on non-functional elements.'
                          },
                          ctaPerformance: {
                            desktop: 'Desktop CTA rate: just 4.6% for the top CTA, <1% for the bottom CTA (which nobody reaches). The 60 course cards drown out the actual conversion elements. This page has the worst CTA engagement of any page on the site.',
                            mobile: 'Mobile CTA rate: 6.1% for the top CTA, <1% for the bottom. Marginally better than desktop but still critically low. With 31.2% of taps wasted on non-clickable course cards, the page actively fights against conversion.'
                          }
                        }}
                      />
                      <div className="mt-4 bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r text-gray-300">
                        <strong className="text-red-300">The Conversion Black Hole:</strong> 79% of the page gets less than 5% visibility. Course cards capture 26.5% of clicks but lead nowhere. Only 4.6% ever reach a CTA.
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Other Pages */}
              {activePageAnalysis === 6 && (
                <>
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                            <th className="p-4 font-bold text-blue-300">Page</th>
                            <th className="p-4 font-bold text-blue-300">Sessions</th>
                            <th className="p-4 font-bold text-blue-300">Revenue</th>
                            <th className="p-4 font-bold text-blue-300">Key Finding</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-300">
                          <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="p-4 font-semibold">Certification Mobile</td>
                            <td className="p-4">13,238</td>
                            <td className="p-4 text-green-400 font-bold">$44,897</td>
                            <td className="p-4 text-base">0.42% mobile conv, no Hotjar data → 301 redirect + add tracking</td>
                          </tr>
                          <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="p-4 font-semibold">QBO Certification</td>
                            <td className="p-4">905 mobile</td>
                            <td className="p-4 text-red-400">$0 mobile</td>
                            <td className="p-4 text-base">Zero mobile conversions from 905 sessions → Investigate technical issue</td>
                          </tr>
                          <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="p-4 font-semibold">Bookkeeping Cert</td>
                            <td className="p-4">~1,500</td>
                            <td className="p-4 text-green-400">~$14,499</td>
                            <td className="p-4 text-base">38.8% desktop dead clicks (worst), 66.3% mobile scroll → Fix desktop affordances</td>
                          </tr>
                          <tr className="hover:bg-gray-800/50">
                            <td className="p-4 font-semibold">Learn QuickBooks</td>
                            <td className="p-4">1,942</td>
                            <td className="p-4 text-green-400">~$10,399</td>
                            <td className="p-4 text-base">Low traffic, top click goes to Self-Paced → Redesign as routing page</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* Design Fixes - New Site vs Old */}
        {activeSection === 6 && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-3xl font-bold mb-2 text-blue-400">Design Fixes: New Site vs. Hotjar Findings</h2>
              <p className="text-gray-400 text-lg mb-6">How QBTraining.com addresses the behavioral problems found in the data</p>

              {/* Overall Scorecard */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-green-900/30 rounded-xl p-6 border border-green-700/50 text-center">
                  <div className="text-5xl font-black text-green-400 mb-2">11</div>
                  <div className="text-green-300 font-semibold text-lg">Issues Addressed</div>
                  <div className="text-gray-400 text-sm mt-1">By the new site design</div>
                </div>
                <div className="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50 text-center">
                  <div className="text-5xl font-black text-amber-400 mb-2">6</div>
                  <div className="text-amber-300 font-semibold text-lg">Site-Wide Changes</div>
                  <div className="text-gray-400 text-sm mt-1">Still needed before launch</div>
                </div>
                <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-700/50 text-center">
                  <div className="text-5xl font-black text-blue-400 mb-2">13</div>
                  <div className="text-blue-300 font-semibold text-lg">Page-Level Fixes</div>
                  <div className="text-gray-400 text-sm mt-1">Across 5 key pages</div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-2 flex-wrap mb-6">
                {designFixPages.map((page, idx) => (
                  <button
                    key={page.id}
                    onClick={() => setActiveDesignFix(idx)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      activeDesignFix === idx
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {page.icon} {page.title}
                  </button>
                ))}
              </div>

              {/* Site-Wide Changes */}
              {activeDesignFix === 0 && (
                <div className="space-y-6">
                  <div className="bg-green-900/20 rounded-xl p-6 border border-green-700/30">
                    <h3 className="text-2xl font-bold text-green-400 mb-4">What the New Site Already Gets Right</h3>
                    <p className="text-gray-400 mb-4">These design decisions directly address problems found in the Hotjar + GA4 data. Do NOT undo them.</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { decision: 'Sign In as header utility', data: 'Old site: 30.6% of homepage clicks were Sign In, crowding out prospect CTAs', icon: '✅' },
                        { decision: 'Pricing cards on every page', data: 'Old site: users had to navigate to Plans & Pricing to see costs for a $700 decision', icon: '✅' },
                        { decision: 'FAQ accordion on every page', data: 'Mobile FAQ engagement: 24–65% of all taps. #1 content engagement pattern', icon: '✅' },
                        { decision: 'Trust bar on every page', data: '"Intuit 25 years / 1M+ people / 30-day guarantee" — non-negotiable at $700 AOV', icon: '✅' },
                        { decision: 'Single funnel → /plans-and-pricing', data: 'Clean conversion path. Every CTA points to one place. No confusion.', icon: '✅' },
                        { decision: '"Us vs. Competitors" comparison tables', data: 'Differentiates at the decision point for a $700 purchase against DIY/YouTube', icon: '✅' },
                        { decision: 'Self-Paced Courses with filters', data: 'Old page was 13,213px infinite scroll with 4.6% CTA rate. Filters fix the core problem.', icon: '✅' },
                        { decision: 'Instructor spotlights visible', data: '1,083 clicks on instructor modals in old data. People want to know who teaches $700 courses.', icon: '✅' },
                        { decision: 'Countdown timer + strikethrough pricing', data: 'Urgency mechanics on high-ticket item. Promo banner got 2–7% clicks on old site.', icon: '✅' },
                        { decision: '"Start Learning" green CTA in header', data: 'Persistent, always-visible conversion button. Always one click away from pricing.', icon: '✅' },
                        { decision: 'Schema.org markup (FAQ, Course, Product)', data: 'SEO foundation for high-intent search traffic that drives $1.7M in revenue.', icon: '✅' },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-green-950/50 rounded-lg p-4 border border-green-800/30">
                          <div className="flex items-start gap-3">
                            <span className="text-xl mt-0.5">{item.icon}</span>
                            <div>
                              <div className="font-semibold text-green-300">{item.decision}</div>
                              <div className="text-sm text-gray-400 mt-1">{item.data}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-900/20 rounded-xl p-6 border border-amber-700/30">
                    <h3 className="text-2xl font-bold text-amber-400 mb-4">Site-Wide Changes Still Needed</h3>
                    <p className="text-gray-400 mb-4">These changes apply across the entire new site, not to specific pages.</p>
                    <div className="space-y-4">
                      {[
                        {
                          id: 'SW-1', title: 'Make the Comparison Table Interactive', priority: '#1', effort: 'Medium', impact: 'Highest',
                          problem: '1,513 clicks (7.3%) hit comparison table text on old site — people trying to interact with static content.',
                          fix: 'Make each feature row expandable on click/tap. Add hover states on desktop. Add "What\'s this?" icon for discoverability.',
                          before: 'Static checkmark matrix — users click text expecting expansion, nothing happens',
                          after: 'Click any feature row to see a 2–3 sentence description. Hover highlight on desktop. Smooth expand/collapse on mobile.'
                        },
                        {
                          id: 'SW-2', title: 'Fix Desktop Hover States & Click Affordances', priority: '#2', effort: 'Low-Med', impact: 'High',
                          problem: '20–39% of ALL desktop clicks hit non-interactive elements. This CSS/design language problem will carry over.',
                          fix: 'Audit every page: cursor:pointer + transitions on interactive elements. cursor:default on non-interactive text. Card hover lift effects.',
                          before: 'Cards, table rows, and text all look the same on hover — users can\'t tell what\'s clickable',
                          after: 'Interactive elements have clear hover states (lift, color change, pointer cursor). Non-interactive text stays static.'
                        },
                        {
                          id: 'SW-3', title: 'Add Aggregate Star Rating + Review Count', priority: '#3', effort: 'Low', impact: 'Med-High',
                          problem: 'New site has 4 individual testimonials but no aggregate rating. "4.7 from 1,581+ reviews" is a stronger trust signal.',
                          fix: 'Add to trust bar: "★★★★★ 4.7 from 1,581+ reviews". Include Schema.org AggregateRating for rich search snippets.',
                          before: '4 individual quote testimonials — no aggregate social proof number',
                          after: '"★★★★★ 4.7 from 1,581+ reviews" in the trust bar on every page + rich snippets in search results'
                        },
                        {
                          id: 'SW-4', title: 'Add Cross-Device Journey Bridges', priority: '#4', effort: 'Medium', impact: 'Med-High',
                          problem: 'Mobile = research ($180K, 12%). Desktop = purchase ($1.3M, 88%). No features to facilitate the handoff.',
                          fix: '"Email me this comparison" button on Plans & Pricing. Captures email AND sends desktop link. Creates a lead.',
                          before: 'Mobile researcher has to remember URL and manually return on desktop',
                          after: '"Email me this comparison" captures the lead, sends a desktop link, and bridges the cross-device journey'
                        },
                        {
                          id: 'SW-5', title: 'Shorten All Pages to ~4,000–5,000px', priority: '#5', effort: 'Medium', impact: 'High',
                          problem: 'Plans & Pricing at 3,869px converts at 4.15% (best). Homepage at 9,346px loses 90% by halfway. Shorter = better.',
                          fix: 'Homepage target: ~4,500px. Each cert page: ~4,000px. Self-Paced: ~5,000px. Cut sections that repeat or fill space.',
                          before: 'Homepage: 9,346px (9.9% reach midpoint). Self-Paced: 13,213px (21.4% reach midpoint)',
                          after: 'Target: all pages under 5,000px. Plans & Pricing (3,869px, 4.15% conversion) is the model.'
                        },
                        {
                          id: 'SW-6', title: 'Course Card CTA + "One Plan" Messaging', priority: '#6', effort: 'Low', impact: 'Medium',
                          problem: '26.5% of old site clicks went to course cards but only 4.6% reached a CTA. Users thought they were buying individual courses.',
                          fix: 'Each course card: "Included in All Plans" text + "Enroll" button. Page banner: "One Plan. 46+ Courses. Starting at $599.95."',
                          before: 'Course cards are visual dead ends — 26.5% of clicks captured but lead nowhere',
                          after: 'Every card has "Included in All Plans" + CTA. Users understand the plan model immediately.'
                        },
                      ].map((item) => (
                        <div key={item.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">{item.id}</span>
                            <h4 className="text-xl font-bold text-white">{item.title}</h4>
                            <span className="ml-auto text-sm bg-gray-700 px-2 py-0.5 rounded text-gray-300">Priority {item.priority}</span>
                          </div>
                          <p className="text-gray-400 text-sm mb-4">{item.problem}</p>

                          {/* Before / After */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                              <div className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                Old Site (Problem)
                              </div>
                              <p className="text-gray-300 text-sm">{item.before}</p>
                            </div>
                            <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                              <div className="text-green-400 font-semibold text-sm mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                New Site (Fix)
                              </div>
                              <p className="text-gray-300 text-sm">{item.after}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Homepage Design Fixes */}
              {activeDesignFix === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="bg-green-600/20 text-green-400 px-4 py-2 rounded-full font-bold text-sm">5 of 8 Issues Addressed</div>
                    <div className="bg-amber-600/20 text-amber-400 px-4 py-2 rounded-full font-bold text-sm">3 Gaps Remaining</div>
                  </div>

                  {/* Side-by-Side Screenshot Comparison */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Visual Comparison: Old Site vs. New Site</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-red-400 font-semibold text-sm">Old Homepage</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-red-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/homepage-full.png" alt="Old homepage" width={1440} height={9346} className="w-full h-auto" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-green-400 font-semibold text-sm">New Homepage</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-green-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/new-homepage-full.png" alt="New homepage" width={1440} height={9000} className="w-full h-auto" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-900/20 rounded-xl p-6 border border-green-700/30">
                    <h3 className="text-xl font-bold text-green-400 mb-4">What the New Homepage Gets Right</h3>
                    <div className="space-y-3">
                      {[
                        { fix: 'Sign In moved to header utility', data: 'Frees up 30.6% of clicks that were going to Sign In. Prospect CTAs can now compete.', metric: '30.6% → ~3%' },
                        { fix: 'Trust bar immediately visible', data: '"Intuit 25 years / 1M+ / 30-day guarantee" visible without scrolling. Critical for $700 purchase.', metric: 'Below fold → Above fold' },
                        { fix: 'FAQ accordion section', data: 'Captures the 23.9% of mobile clicks that went to FAQ content on the old site.', metric: '0 FAQ → 7+ questions' },
                        { fix: '"Start Learning" persistent CTA', data: 'Green button always visible in header. No more hunting for the conversion path.', metric: 'Hidden → Always visible' },
                        { fix: 'Pricing cards on the homepage', data: 'Users no longer need to navigate away to see plan costs. Price transparency for a $700 decision.', metric: 'No pricing → 3 plan cards' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-green-950/30 rounded-lg p-4 border border-green-800/20">
                          <span className="text-green-500 text-xl mt-0.5">✓</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-green-300">{item.fix}</span>
                              <span className="ml-auto text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full whitespace-nowrap">{item.metric}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{item.data}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-900/20 rounded-xl p-6 border border-amber-700/30">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">What Still Needs Work</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">HP-1</span>
                          <h4 className="font-bold text-white">Consolidate from 9 Sections to 6</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">Current: 9 sections, ~9,000px+</div>
                            <p className="text-gray-400 text-sm">Hero → Trust Bar → Offerings Grid → Pricing Cards → Testimonials → Comparison Table → FAQ → Instructors → Final CTA. Only 9.9% of desktop users see the midpoint.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Target: 6 sections, ~4,500px</div>
                            <p className="text-gray-400 text-sm">Hero → Trust Bar → Offerings Grid → Interactive Comparison Table (merge pricing + testimonials) → FAQ → Final CTA. Cut ~3,000px. Get to &gt;30% midpoint scroll.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">HP-2</span>
                          <h4 className="font-bold text-white">Fix the First-Fold Experience</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">Problem: 40.2% desktop drop-off at 5–10% scroll</div>
                            <p className="text-gray-400 text-sm">Something at or just below the initial viewport caused a mass exodus. The first ~900px must be compelling and complete.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Fix: Headline + value prop + CTA + trust bar in first viewport</div>
                            <p className="text-gray-400 text-sm">On a 1920x1080 monitor, the first viewport should show: headline, 3 bullet value prop, "Start Learning" CTA, and the trust bar. Zero dead space.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">HP-3</span>
                          <h4 className="font-bold text-white">Reduce Sign In Visual Weight</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">Risk: Sign In and Start Learning look equal</div>
                            <p className="text-gray-400 text-sm">If both buttons have similar visual weight, returning students and prospects see two equal options. Sign In captured 30.6% of old site clicks.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Fix: Clear visual hierarchy</div>
                            <p className="text-gray-400 text-sm">"Start Learning": green, filled, prominent. "Sign In": text-only or outline, smaller, right-aligned. A returning student knows where Sign In is.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plans & Pricing Design Fixes */}
              {activeDesignFix === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="bg-green-600/20 text-green-400 px-4 py-2 rounded-full font-bold text-sm">Best Converting Page — Protect It</div>
                    <div className="bg-amber-600/20 text-amber-400 px-4 py-2 rounded-full font-bold text-sm">2 Enhancements Needed</div>
                  </div>

                  {/* Side-by-Side Screenshot Comparison */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Visual Comparison: Old Site vs. New Site</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-red-400 font-semibold text-sm">Old Plans &amp; Pricing</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-red-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/plans-pricing-full.png" alt="Old plans and pricing" width={1440} height={3869} className="w-full h-auto" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-green-400 font-semibold text-sm">New Plans &amp; Pricing</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-green-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/new-plans-pricing-full.png" alt="New plans and pricing" width={1440} height={4000} className="w-full h-auto" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-900/20 rounded-xl p-6 border border-green-700/30">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">⭐</span>
                      <div>
                        <h3 className="text-xl font-bold text-green-400">The Model Page: 4.15% Desktop Conversion</h3>
                        <p className="text-gray-400">3,869px — shortest page. Highest conversion. The data proves shorter = better.</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/20 text-center">
                        <div className="text-3xl font-black text-green-400">4.15%</div>
                        <div className="text-sm text-gray-400 mt-1">Desktop conversion rate</div>
                      </div>
                      <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/20 text-center">
                        <div className="text-3xl font-black text-green-400">3,869px</div>
                        <div className="text-sm text-gray-400 mt-1">Page height (shortest)</div>
                      </div>
                      <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/20 text-center">
                        <div className="text-3xl font-black text-green-400">52.7%</div>
                        <div className="text-sm text-gray-400 mt-1">Reach midpoint (best)</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-900/20 rounded-xl p-6 border border-amber-700/30">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">Two Key Enhancements</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">PP-1</span>
                          <h4 className="font-bold text-white">Make the Comparison Table Interactive</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">36.5% dead click rate on comparison table</div>
                            <p className="text-gray-400 text-sm">1,513 clicks hit the comparison table text — users clicking feature rows expecting detail expansion. The #1 dead click source on the entire site.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Expandable rows with feature descriptions</div>
                            <p className="text-gray-400 text-sm">Click any feature row → 2–3 sentence description. "QuickBooks FAST-Track" → "2-day intensive classes, 45+ US cities, unlimited retakes." Hover highlight on desktop, smooth animation on mobile.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">PP-2</span>
                          <h4 className="font-bold text-white">Enhance Mobile Plan Comparison</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">7,727 mobile sessions, 0.62% conversion</div>
                            <p className="text-gray-400 text-sm">More mobile sessions than desktop (7,727 vs 4,530) but conversion is 6.7x lower. Cramming 3 plan columns into a mobile viewport is the problem.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Swipeable card comparison for mobile</div>
                            <p className="text-gray-400 text-sm">Swipe between Learner / Certification / Team plans. Highlight what each plan adds. "Most Popular" badge on Certification. Easy to read without zooming.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r">
                    <strong className="text-blue-300">Key Principle:</strong> <span className="text-gray-300">Do NOT make this page longer. Do NOT add more content. The only changes should improve interactivity and mobile readability of what already exists.</span>
                  </div>
                </div>
              )}

              {/* QB Certification Design Fixes */}
              {activeDesignFix === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="bg-green-600/20 text-green-400 px-4 py-2 rounded-full font-bold text-sm">4 Issues Addressed</div>
                    <div className="bg-amber-600/20 text-amber-400 px-4 py-2 rounded-full font-bold text-sm">2 Enhancements Needed</div>
                  </div>

                  {/* Side-by-Side Screenshot Comparison */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Visual Comparison: Old Site vs. New Site</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-red-400 font-semibold text-sm">Old QB Certification</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-red-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/qb-certification-full.png" alt="Old QB certification page" width={1440} height={8000} className="w-full h-auto" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-green-400 font-semibold text-sm">New QB Certification</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-green-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/new-qb-certification-full.png" alt="New QB certification page" width={1440} height={8000} className="w-full h-auto" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-900/20 rounded-xl p-6 border border-green-700/30">
                    <h3 className="text-xl font-bold text-green-400 mb-4">What the New Certification Page Gets Right</h3>
                    <div className="space-y-3">
                      {[
                        { fix: '"Learn → Practice → Pass" three-step path', data: 'Clear progression for a $699.95 decision. Users understand the 13hr learn + 6hr practice + 1hr exam journey.', metric: 'Unclear path → 3-step visual' },
                        { fix: '"Us vs. Competitors" comparison table', data: 'Differentiates against DIY/YouTube/other providers at the exact decision point for a $700 certification.', metric: 'No comparison → Side-by-side' },
                        { fix: 'FAQ accordion section', data: '62.4% of mobile taps went to FAQ content on the old cert page — the highest of any page.', metric: '0 FAQ → 7+ questions' },
                        { fix: 'Pricing cards visible on page', data: 'No more navigating away to find out the Certification Plan is $699.95. Price is visible in context.', metric: 'Hidden pricing → Visible' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-green-950/30 rounded-lg p-4 border border-green-800/20">
                          <span className="text-green-500 text-xl mt-0.5">✓</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-green-300">{item.fix}</span>
                              <span className="ml-auto text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full whitespace-nowrap">{item.metric}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{item.data}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-900/20 rounded-xl p-6 border border-amber-700/30">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">What Still Needs Work</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">QC-1</span>
                          <h4 className="font-bold text-white">Lead with Outcomes, Not Features</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">Feature-led messaging</div>
                            <p className="text-gray-400 text-sm">Page leads with what the certification includes. But for a $700 purchase, buyers need to see the ROI first — what they GET from being certified.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Outcome-led: "3 Certifications. 20–30% salary increase."</div>
                            <p className="text-gray-400 text-sm">Lead with results. Expand FAQ to 10–12 questions (currently 7) — at $700, people have lots of questions. Cover exam format, retake policy, employer recognition.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">QC-2</span>
                          <h4 className="font-bold text-white">Handle /certification-mobile Redirect</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">13,238 sessions to a URL that won't exist</div>
                            <p className="text-gray-400 text-sm">The old site has /certification-mobile with 13K sessions. The new site doesn't have this URL. Without a redirect, this traffic hits a 404.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">301 redirect at migration</div>
                            <p className="text-gray-400 text-sm">/certification-mobile → /quickbooks-certification. Low effort, preserves 13K sessions. Add Hotjar tracking post-launch to monitor merged traffic behavior.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Classes Design Fixes */}
              {activeDesignFix === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="bg-green-600/20 text-green-400 px-4 py-2 rounded-full font-bold text-sm">3 Issues Addressed</div>
                    <div className="bg-amber-600/20 text-amber-400 px-4 py-2 rounded-full font-bold text-sm">2 Enhancements Needed</div>
                  </div>

                  {/* Side-by-Side Screenshot Comparison */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Visual Comparison: Old Site vs. New Site</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-red-400 font-semibold text-sm">Old Live Classes</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-red-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/live-classes-full.png" alt="Old live classes page" width={1440} height={8000} className="w-full h-auto" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-green-400 font-semibold text-sm">New Live Classes</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-green-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/new-live-classes-full.png" alt="New live classes page" width={1440} height={8000} className="w-full h-auto" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-900/20 rounded-xl p-6 border border-green-700/30">
                    <h3 className="text-xl font-bold text-green-400 mb-4">What the New Live Classes Page Gets Right</h3>
                    <div className="space-y-3">
                      {[
                        { fix: 'Instructor spotlights visible on page', data: '1,083 clicks on instructor modals in old data. People want to know who teaches their $700 course. New site shows them inline.', metric: 'Modal-only → Inline profiles' },
                        { fix: 'FAQ accordion section', data: '65.2% of mobile taps went to FAQ — highest of any page. People have the most questions about live class format/schedule.', metric: '0 FAQ → Dedicated section' },
                        { fix: 'Class schedule with dates', data: 'Users spent 2m 26s avg engagement — highest of any page. The schedule is the #1 content they came to see.', metric: 'Hard to find → Prominent' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-green-950/30 rounded-lg p-4 border border-green-800/20">
                          <span className="text-green-500 text-xl mt-0.5">✓</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-green-300">{item.fix}</span>
                              <span className="ml-auto text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full whitespace-nowrap">{item.metric}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{item.data}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-900/20 rounded-xl p-6 border border-amber-700/30">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">What Still Needs Work</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">LC-1</span>
                          <h4 className="font-bold text-white">Surface Schedule Above the Fold</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">Schedule may be below the fold</div>
                            <p className="text-gray-400 text-sm">With 2m 26s engagement (highest of any page), people are here FOR the schedule. If it requires scrolling to find, that's friction for a $600–$700 decision.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Schedule immediately below hero or in hero</div>
                            <p className="text-gray-400 text-sm">Next class dates + instructor names should be visible in the first viewport. Link instructor names to their spotlights. Keep One-Hour vs Two-Day format toggle.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">LC-2</span>
                          <h4 className="font-bold text-white">Enhance Instructor Trust Signals</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">Photos + names only</div>
                            <p className="text-gray-400 text-sm">Instructor profiles show photo and name, but for a $700 training, people need more credibility signals before committing.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Add bios, stats, and student reviews</div>
                            <p className="text-gray-400 text-sm">"X,000+ students trained, Y+ years teaching" + 1–2 sentence bio + a student review per instructor. Keep visible inline, not behind modals.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Self-Paced Design Fixes */}
              {activeDesignFix === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="bg-green-600/20 text-green-400 px-4 py-2 rounded-full font-bold text-sm">2 Major Issues Fixed</div>
                    <div className="bg-amber-600/20 text-amber-400 px-4 py-2 rounded-full font-bold text-sm">2 Enhancements Needed</div>
                  </div>

                  {/* Side-by-Side Screenshot Comparison */}
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Visual Comparison: Old Site vs. New Site</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="text-red-400 font-semibold text-sm">Old Self-Paced Courses</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-red-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/self-paced-full.png" alt="Old self-paced courses page" width={1440} height={13213} className="w-full h-auto" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-green-400 font-semibold text-sm">New Self-Paced Courses</span>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-green-800/30 bg-gray-900 max-h-[600px] overflow-y-auto">
                          <Image src="/screenshots/new-self-paced-full.png" alt="New self-paced courses page" width={1440} height={13000} className="w-full h-auto" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-900/20 rounded-xl p-6 border border-red-700/30 mb-4">
                    <h3 className="text-xl font-bold text-red-400 mb-2">The Old Site's Worst Page</h3>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-black text-red-400">13,213px</div>
                        <div className="text-xs text-gray-400">Page height</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-red-400">4.6%</div>
                        <div className="text-xs text-gray-400">CTA click rate</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-red-400">26.5%</div>
                        <div className="text-xs text-gray-400">Dead click rate</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black text-red-400">21.4%</div>
                        <div className="text-xs text-gray-400">Reach midpoint</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-900/20 rounded-xl p-6 border border-green-700/30">
                    <h3 className="text-xl font-bold text-green-400 mb-4">What the New Self-Paced Page Fixes</h3>
                    <div className="space-y-3">
                      {[
                        { fix: 'Course filter system replaces infinite scroll', data: 'Old page was 60+ cards in a single scroll. Filters let users find relevant courses without scrolling 13,213px of content.', metric: '13,213px → ~5,000px' },
                        { fix: '"View Course" links on cards', data: 'Old cards had zero CTAs — 26.5% of clicks were wasted. New cards have clickable links that go somewhere.', metric: '0% → CTA on every card' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-green-950/30 rounded-lg p-4 border border-green-800/20">
                          <span className="text-green-500 text-xl mt-0.5">✓</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-green-300">{item.fix}</span>
                              <span className="ml-auto text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full whitespace-nowrap">{item.metric}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{item.data}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-900/20 rounded-xl p-6 border border-amber-700/30">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">What Still Needs Work</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">SC-1</span>
                          <h4 className="font-bold text-white">"One Plan, All Courses" Messaging</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">Users still think they're buying individual courses</div>
                            <p className="text-gray-400 text-sm">The "View Course" links may create confusion. Users browse 46+ courses thinking they pick one, not understanding that one plan includes everything.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Banner: "One Plan. 46+ Courses. Starting at $599.95."</div>
                            <p className="text-gray-400 text-sm">Each card: "Included in All Plans" text + enroll CTA. Page headline: "46+ Self-Paced Courses — Included in Every Plan." Reframe browsing as a value preview.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-sm font-bold">SC-2</span>
                          <h4 className="font-bold text-white">Keep Page Height Under 5,000px</h4>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/30">
                            <div className="text-red-400 font-semibold text-sm mb-2">46 cards can still overwhelm</div>
                            <p className="text-gray-400 text-sm">Even with filters, if all 46 cards render at once, the page could approach 10,000px+ again. The filter system helps but needs guardrails.</p>
                          </div>
                          <div className="bg-green-950/30 rounded-lg p-4 border border-green-800/30">
                            <div className="text-green-400 font-semibold text-sm mb-2">Show 9–12 cards by default</div>
                            <p className="text-gray-400 text-sm">3 rows of 3–4 cards. Group by use case: "Most Popular," "For Beginners," "Industry-Specific." "Show More" for the rest. Keep total height under 5,000px.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Measurement Plan */}
              <div className="mt-8 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Measurement Plan: Before → After Targets</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 text-gray-400">Metric</th>
                        <th className="text-center py-3 text-red-400">Old Site (Baseline)</th>
                        <th className="text-center py-3 text-green-400">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { metric: 'Homepage desktop scroll to 50%', baseline: '9.9%', target: '>30%' },
                        { metric: 'Desktop dead click rate (site-wide)', baseline: '20–39%', target: '<10%' },
                        { metric: 'Plans & Pricing conversion', baseline: '4.15%', target: '>5%' },
                        { metric: 'Homepage conversion', baseline: '0.86%', target: '>1.5%' },
                        { metric: 'Self-Paced CTA click rate', baseline: '4.6%', target: '>15%' },
                        { metric: 'Comparison table engagement', baseline: '7.3% dead clicks', target: 'Interactive clicks measured' },
                        { metric: 'Average page height', baseline: '~7,000px', target: '<5,000px' },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-800">
                          <td className="py-3 text-gray-300">{row.metric}</td>
                          <td className="py-3 text-center text-red-300">{row.baseline}</td>
                          <td className="py-3 text-center text-green-300 font-semibold">{row.target}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {activeSection === 7 && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-blue-400">Recommendations</h2>
              
              {/* Revenue Opportunity */}
              <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 text-center shadow-2xl mb-8">
                <Tooltip text={`Sum of 7 initiatives: Fix desktop dead clicks ($150K-$200K) + Fix Homepage scroll ($80K-$120K) + Add CTAs to Self-Paced ($50K-$80K) + Improve mobile research ($80K-$150K) + Interactive pricing table ($20K-$40K) + Optimize /certification-mobile ($30K-$50K) + Improve mobile checkout ($40K-$80K). Conservative estimates account for cross-device dynamics.`}>
                  <div className="text-5xl font-extrabold mb-3">+$450K – $720K</div>
                </Tooltip>
                <div className="text-lg font-semibold uppercase tracking-wide opacity-90">
                  Estimated Annual Revenue Uplift
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">Revenue Opportunity by Initiative</h3>
              <div className="mb-12">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
                      <th className="p-4 font-bold text-blue-300">Opportunity</th>
                      <th className="p-4 font-bold text-blue-300">Current Revenue</th>
                      <th className="p-4 font-bold text-blue-300">Estimated Uplift</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Fix desktop dead clicks</td>
                      <td className="p-4">~$1.3M</td>
                      <td className="p-4">
                        <Tooltip text={`Desktop generates $1.3M with 20-39% dead click rates. Industry best practice: <10% dead clicks. Conservative 10-15% improvement in click-to-CTA rate at $682 AOV = $130K-$195K annual uplift. Estimate: $150K-$200K.`}>
                          <span className="text-green-400 font-bold">+$150K–$200K</span>
                        </Tooltip>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Fix Homepage scroll + shorten page</td>
                      <td className="p-4">$398K desktop</td>
                      <td className="p-4">
                        <Tooltip text={`Homepage: $398K desktop revenue, 9.9% scroll to 50%. Industry benchmark: 30-40%. Conservative 15-20% improvement in scroll retention (reaching 25-30%) combined with page consolidation (9 sections → 6) at $682 AOV = $80K-$120K annual uplift.`}>
                          <span className="text-green-400 font-bold">+$80K–$120K</span>
                        </Tooltip>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Add CTAs to Self-Paced course cards</td>
                      <td className="p-4">$113K desktop</td>
                      <td className="p-4">
                        <Tooltip text={`Self-Paced: $113K desktop revenue, 4.6% CTA click rate (worst on site). Course cards get 26.5% of clicks but 0% convert. Adding 'View Plans' CTAs to each card, targeting 15-20% CTA rate (industry standard) = $50K-$80K annual uplift.`}>
                          <span className="text-green-400 font-bold">+$50K–$80K</span>
                        </Tooltip>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Improve mobile research experience</td>
                      <td className="p-4">Indirect</td>
                      <td className="p-4">
                        <Tooltip text={`Mobile serves as research channel for $700 decision. 43.3% mobile CTA engagement shows strong intent. Improving mobile experience (swipeable plan cards, sticky bottom CTA, FAQ prominence) increases desktop return visits by 10-15%, resulting in $80K-$150K desktop conversions.`}>
                          <span className="text-green-400 font-bold">+$80K–$150K</span>
                        </Tooltip>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Make Plans & Pricing table interactive</td>
                      <td className="p-4">$137K desktop</td>
                      <td className="p-4">
                        <Tooltip text={`Plans & Pricing: $137K desktop revenue, 36.5% dead clicks (1,513 on table text). Making table interactive (expandable rows, inline testimonials) reduces friction. 2-3% conversion improvement on highest-converting page (4.15%) = $20K-$40K annual uplift.`}>
                          <span className="text-green-400 font-bold">+$20K–$40K</span>
                        </Tooltip>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Optimize /certification-mobile</td>
                      <td className="p-4">$39K</td>
                      <td className="p-4">
                        <Tooltip text={`/certification-mobile: 13,238 sessions, $39K revenue (0.42% conv), no Hotjar tracking. 301 redirect to main page + proper mobile optimization could increase conversion to 0.8-1.0% (matching mobile benchmarks) = $30K-$50K annual uplift.`}>
                          <span className="text-green-400 font-bold">+$30K–$50K</span>
                        </Tooltip>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Improve mobile checkout</td>
                      <td className="p-4">~$180K mobile</td>
                      <td className="p-4">
                        <Tooltip text={`Mobile: $180K revenue, 0.30-0.62% conversion. Improving mobile checkout flow (autofill, fewer steps, trust signals) could increase conversion by 20-40%, resulting in $40K-$80K additional mobile revenue.`}>
                          <span className="text-green-400 font-bold">+$40K–$80K</span>
                        </Tooltip>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Page-Specific Punch List */}
              <h3 className="text-2xl font-bold text-white mb-6 mt-12">Page-Specific Punch List</h3>
              
              <div className="space-y-6">
                {/* Homepage */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-blue-700/30">
                  <h4 className="text-xl font-bold text-blue-300 mb-4">Homepage</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">HP-1: Consolidate from 9 Sections to 6 <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">Desktop</span> <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">Hero → Trust Bar → Offerings Grid → Interactive Comparison Table → FAQ → Final CTA. Cut separate pricing cards, testimonials, instructor section. Saves ~2,000–3,000px.</div>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">HP-2: Fix the First-Fold Experience <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">Desktop</span></div>
                      <div className="text-base text-gray-400">40.2% desktop drop-off at 5–10% scroll must be investigated. First viewport should show: headline, value prop, CTA, and trust bar.</div>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">HP-3: Reduce Sign In Visual Weight <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">Desktop</span> <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">&quot;Start Learning&quot;: green, filled, prominent. &quot;Sign In&quot;: text-only or outline, smaller. Must NOT look like equal-weight options.</div>
                    </div>
                  </div>
                </div>

                {/* Plans & Pricing */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-green-700/30">
                  <h4 className="text-xl font-bold text-green-300 mb-4">Plans & Pricing</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">PP-1: Make Comparison Table Interactive <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">Desktop</span> <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">36.5% dead click rate on comparison table — 1,513 clicks. Expandable rows with feature descriptions. 4.15% desktop conversion — protect this page. Do NOT add more content.</div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">PP-2: Enhance Mobile Plan Comparison <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">7,727 mobile sessions but 0.62% conversion (6.7x lower than desktop). Swipeable card comparison on mobile. Highlight differences between plans.</div>
                    </div>
                  </div>
                </div>

                {/* QuickBooks Certification */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-purple-700/30">
                  <h4 className="text-xl font-bold text-purple-300 mb-4">QuickBooks Certification</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-purple-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">QC-1: Optimize for the $699.95 Decision <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">Desktop</span> <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">Lead with outcomes: &quot;Get 3 Intuit Certifications. Average 20–30% salary increase.&quot; Keep &quot;Learn → Practice → Pass&quot; three-step breakdown prominent. Expand FAQ to 10–12 questions.</div>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">QC-2: Handle /certification-mobile Traffic <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">301 redirect from /certification-mobile to /quickbooks-certification — 13,238 sessions at stake.</div>
                    </div>
                  </div>
                </div>

                {/* Live Classes */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-cyan-700/30">
                  <h4 className="text-xl font-bold text-cyan-300 mb-4">Live Classes</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-cyan-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">LC-1: Surface Schedule Above the Fold <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">Desktop</span> <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">2m 26s avg engagement — highest of any page. People are here FOR the schedule. Next class dates + instructor names should be visible in the first viewport.</div>
                    </div>
                    <div className="border-l-4 border-cyan-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">LC-2: Enhance Instructor Trust Signals <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">Desktop</span> <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">Add bios, stats, and student reviews per instructor. &quot;X,000+ students trained, Y+ years teaching&quot; + 1–2 sentence bio. Keep visible inline, not behind modals.</div>
                    </div>
                  </div>
                </div>

                {/* Self-Paced Courses */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-amber-700/30">
                  <h4 className="text-xl font-bold text-amber-300 mb-4">Self-Paced Courses</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-amber-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">SC-1: &quot;One Plan, All Courses&quot; Messaging <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">Desktop</span> <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">Headline: &quot;46+ Self-Paced Courses — Included in Every Plan.&quot; Banner above grid: &quot;One plan gives you access to all courses.&quot;</div>
                    </div>
                    <div className="border-l-4 border-amber-500 pl-4">
                      <div className="font-semibold text-white mb-1 flex items-center gap-2">SC-2: Keep It Manageable <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">Desktop</span> <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">Mobile</span></div>
                      <div className="text-base text-gray-400">Show 9–12 cards by default. Group by: Most Popular, Beginners, Industry-Specific, Certification Prep. Keep total height under 5,000px.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Strategy */}
              <div className="mt-12 bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                <h3 className="text-2xl font-bold text-blue-300 mb-4">Mobile Strategy</h3>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  <strong>Core principle:</strong> Mobile is where people discover and evaluate. Every mobile design decision should ask: "Does this help someone research a $700 purchase?"
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="font-semibold text-blue-300 mb-2">M-1: Optimize for Research</div>
                    <div className="text-base text-gray-400">Swipeable plan cards, prominent reviews, FAQ near top, "View Plans" over "Buy Now"</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="font-semibold text-blue-300 mb-2">M-2: Sticky Bottom CTA Bar</div>
                    <div className="text-base text-gray-400">"Plans from $599.95 — View Pricing" fixed at bottom</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="font-semibold text-blue-300 mb-2">M-3: Touch Target Sizing</div>
                    <div className="text-base text-gray-400">All tappable elements ≥ 44x44px (Apple HIG)</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="font-semibold text-blue-300 mb-2">M-4: Fast Load</div>
                    <div className="text-base text-gray-400">LCP &lt; 2.5s • FID &lt; 100ms • CLS &lt; 0.1 • Lazy-load images</div>
                  </div>
                </div>
              </div>

              {/* Design Principles */}
              <div className="mt-12">
                <h3 className="text-4xl font-extrabold text-white mb-8">Design Principles (From the Data)</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    "Desktop is the purchase channel — protect it. 88% of revenue.",
                    "Mobile is the research channel — optimize for it. Make comparison easy.",
                    "Short pages convert. 4,000px max. The data is unambiguous.",
                    "Every browseable item needs a CTA. At $682 AOV, every missed click = potential $700 loss.",
                    "Make it obvious what's clickable. Fix the 20–39% dead click epidemic.",
                    "Accordion/FAQ is the #1 engagement pattern. Use it everywhere.",
                    "The comparison table is the most important element. Make it interactive.",
                    "Trust signals everywhere. 4.7 stars, 1,581+ reviews, Intuit partnership.",
                    "Sign In is a utility, not navigation.",
                    "Instructor visibility matters. 1,083 clicks on instructor modals."
                  ].map((principle, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-blue-700/50 hover:border-blue-500 hover:shadow-xl transition-all">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center font-extrabold text-xl shadow-lg">{idx + 1}</div>
                        <div className="text-lg text-gray-100 leading-relaxed font-medium">{principle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
