'use client';

import { useState } from 'react';
import { ChevronRight, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Users, MousePointer, Smartphone, Monitor } from 'lucide-react';

export default function HotjarAnalysisPage() {
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    { id: 'exec-summary', title: 'Executive Summary', icon: '📊' },
    { id: 'business-context', title: 'Business Context', icon: '💰' },
    { id: 'buyer-journey', title: 'Buyer Journey', icon: '🛤️' },
    { id: 'problems', title: 'Five Problems', icon: '⚠️' },
    { id: 'performance', title: 'Performance', icon: '📈' },
    { id: 'page-analysis', title: 'Page Analysis', icon: '🔍' },
    { id: 'recommendations', title: 'Recommendations', icon: '💡' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header - Toned Down */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 shadow-2xl border-b border-slate-600">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-extrabold mb-2 text-white">QBTraining.com Analysis</h1>
          <p className="text-slate-300 text-lg">Behavioral & Revenue Deep Dive • February 2026</p>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {sections.map((section, idx) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                  activeSection === idx
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{section.icon}</span>
                <span className="hidden sm:inline">{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        
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
                <div className="text-4xl font-extrabold text-red-400 mb-2">20–39%</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Desktop Dead Clicks</div>
              </div>

              <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-xl p-6 border border-green-700/50 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-4xl font-extrabold text-green-400 mb-2">4.15%</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wide">Best Conv. Rate</div>
              </div>
            </div>

            {/* Big Number Callout */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-12 text-center shadow-2xl">
              <div className="text-6xl font-extrabold mb-4">+$450K – $720K</div>
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
                      <td className="p-4 text-sm">Training only, 1 user. 30 days free 1-on-1 help, then $50/mo</td>
                    </tr>
                    <tr className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Certification</td>
                      <td className="p-4 text-green-400 font-bold">$699.95</td>
                      <td className="p-4 line-through text-gray-500">$999.95</td>
                      <td className="p-4 text-sm">Training + Certification, 1 user. 30 days free 1-on-1 help, then $50/mo</td>
                    </tr>
                    <tr className="hover:bg-gray-800/50">
                      <td className="p-4 font-semibold">Team</td>
                      <td className="p-4 text-green-400 font-bold">$999.95</td>
                      <td className="p-4 line-through text-gray-500">$1,799.95</td>
                      <td className="p-4 text-sm">Training + Certification, 2-5 users. 30 days free 1-on-1 help, then $90/mo</td>
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
                  <h3 className="text-xl font-bold text-red-300 mb-3">1. The Homepage Is Hemorrhaging Visitors</h3>
                  <p className="text-gray-300 mb-3">Only 8% of desktop users reach the halfway point. The page is 9.34kb tall. There is a catastrophic 40.2% drop-off between 5–10% of the page. At 80%+ AOV, each percentage point of improvement represents hundreds of potential purchases per quarter.</p>
                  <div className="text-sm text-gray-400 mt-2">Impact: <span className="text-red-400 font-semibold">CRITICAL</span> • Affects all traffic sources</div>
                </div>

                <div className="bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-xl">
                  <h3 className="text-xl font-bold text-amber-300 mb-3">2. The Homepage Function Confuses Visitors</h3>
                  <p className="text-gray-300 mb-3">20–39% of ALL desktop clicks hit non-interactive elements. People click on body text, comparison table cells, section backgrounds, and data areas expecting interactivity. This is the purchase channel — the device generating 88% of revenue — and up to 4 in 10 clicks are wasted.</p>
                  <div className="text-sm text-gray-400 mt-2">Impact: <span className="text-amber-400 font-semibold">HIGH</span> • Desktop-specific issue</div>
                </div>

                <div className="bg-amber-900/20 border-l-4 border-amber-500 p-6 rounded-r-xl">
                  <h3 className="text-xl font-bold text-amber-300 mb-3">3. Pages Are Too Long High</h3>
                  <p className="text-gray-300 mb-3">The correlation is unambiguous: shorter pages retain better and convert better for a $700 product. Plans & Pricing (9.34px): 0.86% conv. Certification (13.21%px): 0.85% conv. Self-Paced (6.44px): 0.96% conv.</p>
                  <div className="text-sm text-gray-400 mt-2">Impact: <span className="text-amber-400 font-semibold">HIGH</span> • Affects conversion rates</div>
                </div>

                <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                  <h3 className="text-xl font-bold text-blue-300 mb-3">4. Sign In Dominates the Homepage High</h3>
                  <p className="text-gray-300 mb-3">The homepage functions more as a login portal than a landing page. After removing Sign In and clicks, only ~400 desktop clicks per quarter remain for CTAs. For first-time visitors, Sign In is a landing page. After removing account engagement, the page does not convert.</p>
                  <div className="text-sm text-gray-400 mt-2">Impact: <span className="text-blue-400 font-semibold">MEDIUM</span> • Crowds out CTA engagement</div>
                </div>

                <div className="bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-xl">
                  <h3 className="text-xl font-bold text-blue-300 mb-3">5. Self-Paced Courses: Conversion Black Hole High</h3>
                  <p className="text-gray-300 mb-3">28.5% of clicks go to course cards, but only 4.6% ever reach a CTA. People browse thinking they're buying individual courses, not understanding the plan model. "Load More" button gets 3.87% of clicks but no one sees a CTA. Conversion Black Hole: 98% of visitors who click any course card never reach a purchase path.</p>
                  <div className="text-sm text-gray-400 mt-2">Impact: <span className="text-blue-400 font-semibold">MEDIUM</span> • Specific to Self-Paced page</div>
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
                    <div className="text-sm text-gray-300">• Purchase device</div>
                    <div className="text-sm text-gray-300">• High dead click rates (20-39%)</div>
                    <div className="text-sm text-gray-300">• Returning users dominant</div>
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
                    <div className="text-sm text-gray-300">• Research channel</div>
                    <div className="text-sm text-gray-300">• High engagement (43% CTR)</div>
                    <div className="text-sm text-gray-300">• Low direct conversion (0.43%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Sections Placeholders */}
        {activeSection > 4 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 shadow-2xl text-center">
            <div className="text-6xl mb-6">{sections[activeSection].icon}</div>
            <h2 className="text-3xl font-bold mb-4 text-blue-400">{sections[activeSection].title}</h2>
            <p className="text-gray-400 text-lg mb-8">Full content for this section coming soon...</p>
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <ChevronRight className="w-4 h-4" />
              <span>Navigate using the pills above to explore completed sections</span>
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
