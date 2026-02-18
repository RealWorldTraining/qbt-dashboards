'use client';

import { useState } from 'react';
import { ChevronRight, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Users, MousePointer, Smartphone, Monitor, HelpCircle } from 'lucide-react';
import PageScreenshotWithOverlays from '@/components/PageScreenshotWithOverlays';

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="group relative inline-flex items-center">
      {children}
      <HelpCircle className="w-4 h-4 ml-2 text-gray-500 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-gray-200 text-sm rounded-lg p-4 shadow-2xl border border-gray-700 max-w-md whitespace-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HotjarAnalysisPage() {
  const [activeSection, setActiveSection] = useState(0);
  const [activePageAnalysis, setActivePageAnalysis] = useState(0);

  const sections = [
    { id: 'exec-summary', title: 'Executive Summary', icon: '📊' },
    { id: 'business-context', title: 'Business Context', icon: '💰' },
    { id: 'buyer-journey', title: 'Buyer Journey', icon: '🛤️' },
    { id: 'problems', title: 'Five Problems', icon: '⚠️' },
    { id: 'performance', title: 'Performance', icon: '📈' },
    { id: 'page-analysis', title: 'Page Analysis', icon: '🔍' },
    { id: 'recommendations', title: 'Recommendations', icon: '💡' },
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
                <Tooltip text={`Measured via Hotjar click maps. Desktop users click on non-interactive elements (body text, table cells, section backgrounds) expecting action. Range: Homepage 18.3%, Plans & Pricing 36.5%, Bookkeeping Cert 38.8%. Industry best practice: <10%.`}>
                  <div className="text-4xl font-extrabold text-red-400 mb-2">20–39%</div>
                </Tooltip>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Desktop Dead Clicks</div>
              </div>

              <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-xl p-6 border border-green-700/50 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <Tooltip text={`Plans & Pricing page: 4,530 desktop sessions, 188 purchases, 4.15% conversion rate. Highest of any page. Contributing factors: shortest page (3,869px), clearest value prop, 52.7% scroll to 50%, single focused decision point.`}>
                  <div className="text-4xl font-extrabold text-green-400 mb-2">4.15%</div>
                </Tooltip>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Best Conv. Rate</div>
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
                    <span className="text-gray-400">Desktop Sessions</span>
                    <span className="text-white font-semibold">71,419</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Revenue</span>
                    <span className="text-green-400 font-bold">$454K</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Desktop Conv Rate</span>
                    <span className="text-white font-semibold">0.86%</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Scroll to 50% (Desktop)</span>
                    <span className="text-red-400 font-bold">9.9%</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Dead Clicks (Desktop)</span>
                    <span className="text-red-400 font-bold">18.3%</span>
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
                    <span className="text-gray-400">Desktop Sessions</span>
                    <span className="text-white font-semibold">23,747</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Revenue</span>
                    <span className="text-green-400 font-bold">$298K</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Desktop Conv Rate</span>
                    <span className="text-white font-semibold">1.66%</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Dead Clicks (Desktop)</span>
                    <span className="text-amber-400 font-bold">25.9%</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">FAQ Engagement (Mobile)</span>
                    <span className="text-green-400 font-bold">62.4%</span>
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
                    <span className="text-gray-400">Desktop Sessions</span>
                    <span className="text-white font-semibold">4,530</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Revenue</span>
                    <span className="text-green-400 font-bold">$171K</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Desktop Conv Rate</span>
                    <span className="text-green-400 font-bold">4.15%</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Scroll to 50% (Desktop)</span>
                    <span className="text-green-400 font-bold">52.7%</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Page Height</span>
                    <span className="text-green-400 font-bold">3,869px</span>
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
                    <span className="text-gray-400">Desktop Sessions</span>
                    <span className="text-white font-semibold">8,187</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Revenue</span>
                    <span className="text-green-400 font-bold">$122K</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">CTA Click Rate (Desktop)</span>
                    <span className="text-red-400 font-bold">4.6%</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Dead Clicks (Desktop)</span>
                    <span className="text-amber-400 font-bold">25.6%</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400">Page Height (Mobile)</span>
                    <span className="text-red-400 font-bold">13,213px</span>
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
                          <span className="text-gray-400">Desktop Sessions</span>
                          <span className="text-white font-semibold">71,419</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Mobile Sessions</span>
                          <span className="text-white font-semibold">19,405</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Desktop Revenue</span>
                          <span className="text-green-400 font-bold">$398,530</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Mobile Revenue</span>
                          <span className="text-green-400 font-bold">$55,956</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Desktop Conv Rate</span>
                          <span className="text-white font-semibold">0.86%</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Mobile Conv Rate</span>
                          <span className="text-white font-semibold">0.43%</span>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <span className="text-gray-400">Scroll to 50% (Desktop)</span>
                          <span className="text-red-400 font-bold">9.9%</span>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <span className="text-gray-400">Dead Clicks (Desktop)</span>
                          <span className="text-red-400 font-bold">18.3%</span>
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
                          <span className="text-gray-400">Desktop Sessions</span>
                          <span className="text-white font-semibold">23,747</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Mobile Sessions</span>
                          <span className="text-white font-semibold">5,820</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Total Revenue</span>
                          <span className="text-green-400 font-bold">$298,409</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Desktop Conv Rate</span>
                          <span className="text-white font-semibold">1.66%</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Scroll to 50% (Mobile)</span>
                          <span className="text-green-400 font-bold">65.4%</span>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <span className="text-gray-400">Dead Clicks (Desktop)</span>
                          <span className="text-amber-400 font-bold">25.9%</span>
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
                          <span className="text-gray-400">Mobile Sessions</span>
                          <span className="text-white font-semibold">7,727</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Total Revenue</span>
                          <span className="text-green-400 font-bold">$171,389</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Desktop Conv Rate</span>
                          <span className="text-green-400 font-bold">4.15%</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Scroll to 50% (Desktop)</span>
                          <span className="text-green-400 font-bold">52.7%</span>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <span className="text-gray-400">Page Height</span>
                          <span className="text-green-400 font-bold">3,869px</span>
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
                          <span className="text-gray-400">Desktop Sessions</span>
                          <span className="text-white font-semibold">10,025</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Mobile Sessions</span>
                          <span className="text-white font-semibold">5,146</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Total Revenue</span>
                          <span className="text-green-400 font-bold">$166,388</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Desktop Conv Rate</span>
                          <span className="text-white font-semibold">2.21%</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Avg Engagement</span>
                          <span className="text-green-400 font-bold">2m 26s</span>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <span className="text-gray-400">Mobile CTA Click Rate</span>
                          <span className="text-green-400 font-bold">45.6%</span>
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
                          <span className="text-gray-400">Desktop Sessions</span>
                          <span className="text-white font-semibold">8,187</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Mobile Sessions</span>
                          <span className="text-white font-semibold">4,315</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Total Revenue</span>
                          <span className="text-green-400 font-bold">$122,320</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Desktop Conv Rate</span>
                          <span className="text-white font-semibold">2.00%</span>
                        </div>
                        <div className="flex justify-between text-base py-2 border-b border-gray-700">
                          <span className="text-gray-400">Desktop CTA Click Rate</span>
                          <span className="text-red-400 font-bold">4.6%</span>
                        </div>
                        <div className="flex justify-between text-base py-2">
                          <span className="text-gray-400">Page Height (Mobile)</span>
                          <span className="text-red-400 font-bold">13,213px</span>
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

        {/* Recommendations */}
        {activeSection === 6 && (
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
              <div className="overflow-x-auto mb-12">
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
                      <div className="font-semibold text-white mb-1">HP-1: Consolidate from 9 Sections to 6</div>
                      <div className="text-base text-gray-400">Hero → Trust Bar → Offerings Grid → Interactive Comparison Table → FAQ → Final CTA. Cut separate pricing cards, testimonials, instructor section. Saves ~2,000–3,000px.</div>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="font-semibold text-white mb-1">HP-2: Fix the First-Fold Experience</div>
                      <div className="text-base text-gray-400">40.2% desktop drop-off at 5–10% scroll must be investigated. First viewport should show: headline, value prop, CTA, and trust bar.</div>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="font-semibold text-white mb-1">HP-3: Reduce Sign In Visual Weight</div>
                      <div className="text-base text-gray-400">"Start Learning": green, filled, prominent. "Sign In": text-only or outline, smaller. Must NOT look like equal-weight options.</div>
                    </div>
                  </div>
                </div>

                {/* Plans & Pricing */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-green-700/30">
                  <h4 className="text-xl font-bold text-green-300 mb-4">Plans & Pricing</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="font-semibold text-white mb-1">PP-1: Protect This Page</div>
                      <div className="text-base text-gray-400">4.15% desktop conversion — highest of any page. 3,869px — shortest page. This page WORKS. Do NOT add more content. Only make comparison table interactive.</div>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <div className="font-semibold text-white mb-1">PP-2: Enhance Mobile Plan Comparison</div>
                      <div className="text-base text-gray-400">7,727 mobile sessions but 0.62% conversion. Consider swipeable card comparison on mobile. Highlight differences between plans.</div>
                    </div>
                  </div>
                </div>

                {/* QuickBooks Certification */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-purple-700/30">
                  <h4 className="text-xl font-bold text-purple-300 mb-4">QuickBooks Certification</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-purple-500 pl-4">
                      <div className="font-semibold text-white mb-1">QC-1: Optimize for the $699.95 Decision</div>
                      <div className="text-base text-gray-400">Lead with outcomes: "Get 3 Intuit Certifications. Average 20–30% salary increase." Keep "Learn → Practice → Pass" three-step breakdown prominent. Expand FAQ to 10–12 questions.</div>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <div className="font-semibold text-white mb-1">QC-2: Handle /certification-mobile Traffic</div>
                      <div className="text-base text-gray-400">301 redirect from /certification-mobile to /quickbooks-certification — 13,238 sessions at stake.</div>
                    </div>
                  </div>
                </div>

                {/* Self-Paced Courses */}
                <div className="bg-gray-800/50 rounded-xl p-6 border border-amber-700/30">
                  <h4 className="text-xl font-bold text-amber-300 mb-4">Self-Paced Courses</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-amber-500 pl-4">
                      <div className="font-semibold text-white mb-1">SC-1: "One Plan, All Courses" Messaging</div>
                      <div className="text-base text-gray-400">Headline: "46+ Self-Paced Courses — Included in Every Plan." Banner above grid: "One plan gives you access to all courses."</div>
                    </div>
                    <div className="border-l-4 border-amber-500 pl-4">
                      <div className="font-semibold text-white mb-1">SC-2: Keep It Manageable</div>
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
                <h3 className="text-2xl font-bold text-white mb-6">Design Principles (From the Data)</h3>
                <div className="grid md:grid-cols-2 gap-4">
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
                    <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">{idx + 1}</div>
                        <div className="text-base text-gray-300 leading-relaxed">{principle}</div>
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
