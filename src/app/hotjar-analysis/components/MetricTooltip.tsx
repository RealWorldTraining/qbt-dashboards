'use client';

import { HelpCircle } from 'lucide-react';

interface MetricTooltipProps {
  metric: string;
  value?: string | number;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const metricDefinitions: Record<string, {
  title: string;
  definition: string;
  benchmark?: string;
  context?: string;
}> = {
  'dead-clicks': {
    title: 'Dead Clicks',
    definition: 'Clicks on non-interactive elements (body text, backgrounds, images, table cells) where users expected something clickable.',
    benchmark: 'Industry best practice: <10%. QBTraining ranges 18–39% on desktop.',
    context: 'High dead click rates signal poor UI affordances — users can\'t tell what\'s interactive. On a purchase channel generating 88% of revenue, every frustrated click risks losing a $682 sale.',
  },
  'cta-click-rate': {
    title: 'CTA Click Rate',
    definition: 'Percentage of all clicks/taps that land on a call-to-action button (Enroll Now, Start Learning, View Plans, etc.).',
    benchmark: 'Good: 15–25%. Excellent: >30%. Critical: <10%.',
    context: 'Mobile CTA rates are 2–3x higher than desktop across all pages, suggesting mobile\'s linear layout drives better conversion behavior.',
  },
  'scroll-depth': {
    title: 'Scroll Depth (50%)',
    definition: 'Percentage of visitors who scrolled to at least the halfway point of the page.',
    benchmark: 'Good: >50%. Adequate: 35–50%. Poor: <35%. Critical: <25%.',
    context: 'Strongly correlated with page height — Plans & Pricing (3,869px) gets 52.7%, Homepage (9,346px) gets 9.9%. Shorter pages retain dramatically better.',
  },
  'conversion-rate': {
    title: 'Conversion Rate',
    definition: 'Percentage of sessions that resulted in a completed purchase.',
    benchmark: 'E-commerce avg: 2–3%. High-ticket ($600+): 1–4% is strong. Plans & Pricing leads at 4.15%.',
    context: 'Desktop converts 3–7x higher than mobile on every page. This is expected for a $682 AOV — mobile is the research channel, desktop is the purchase channel.',
  },
  'avg-engagement': {
    title: 'Average Engagement Time',
    definition: 'Average time visitors actively interact with the page — scrolling, clicking, reading. Excludes idle time.',
    benchmark: 'For high-ticket items: >1m is healthy research behavior. >2m suggests deep evaluation.',
    context: 'Live Classes has the highest engagement (2m 26s) — people thoroughly evaluate a $700 training investment.',
  },
  'bounce-rate': {
    title: 'Bounce Rate',
    definition: 'Percentage of visitors who leave after viewing only one page without meaningful interaction.',
    benchmark: 'Excellent: <40%. Average: 40–60%. Poor: >60%.',
    context: 'High bounce on landing pages suggests traffic quality issues or a disconnect between ad/search intent and page content.',
  },
  'exit-rate': {
    title: 'Exit Rate',
    definition: 'Percentage of pageviews that were the last in a session. Unlike bounce rate, these visitors may have browsed other pages first.',
    benchmark: 'High exit rates on pricing pages may indicate checkout friction or sticker shock.',
    context: 'Expected to be high on Plans & Pricing (decision page) and low on content pages.',
  },
  'sessions': {
    title: 'Sessions',
    definition: 'Total number of visits to this page during the analysis period (Nov 2025 – Feb 2026).',
    context: 'A single user can generate multiple sessions across different days and devices.',
  },
  'revenue': {
    title: 'Revenue',
    definition: 'Total purchase revenue attributed to sessions that included this page, during the analysis period.',
    context: 'Revenue is attributed to the landing page of the session where the purchase occurred. Cross-device purchases (mobile research → desktop buy) are attributed to the desktop session.',
  },
  'new-users': {
    title: 'New Users',
    definition: 'Visitors seeing this page for the first time (no previous cookie/session history).',
    context: 'High new user % suggests the page attracts organic/paid traffic. Low new user % means returning visitors dominate.',
  },
  'sign-in-share': {
    title: 'Sign In Click Share',
    definition: 'Percentage of total page clicks that go to the Sign In button.',
    benchmark: 'Homepage desktop: 30.6% — nearly 1 in 3 clicks. Mobile: only 3.6%.',
    context: 'High Sign In share means returning students dominate the page, crowding out prospect engagement. The new site separates Sign In as a header utility.',
  },
  'faq-engagement': {
    title: 'FAQ / Accordion Engagement',
    definition: 'Percentage of clicks/taps that go to expandable FAQ or accordion elements.',
    benchmark: 'Mobile: 24–65% (dominant pattern). Desktop: 2–25%.',
    context: 'Accordions are the #1 mobile engagement pattern. For a $700 purchase, people have lots of questions — this is healthy research behavior.',
  },
  'page-height': {
    title: 'Page Height',
    definition: 'Total pixel height of the page content on this device.',
    benchmark: 'Optimal: ~4,000px. Plans & Pricing (3,869px) converts best. Homepage (9,346px) performs worst.',
    context: 'The data is unambiguous: shorter pages retain better and convert better for a $700 product.',
  },
};

export default function MetricTooltip({ metric, value, children, position = 'top' }: MetricTooltipProps) {
  const metricData = metricDefinitions[metric];

  if (!metricData) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-[1px] border-t-blue-500 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-b-blue-500 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-[1px] border-l-blue-500 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-[1px] border-r-blue-500 border-t-transparent border-b-transparent border-l-transparent',
  };

  const innerArrowMap: Record<string, string> = {
    top: 'absolute top-full left-1/2 -translate-x-1/2 -mt-[9px] border-[9px] border-transparent border-t-gray-950',
    bottom: 'absolute bottom-full left-1/2 -translate-x-1/2 -mb-[9px] border-[9px] border-transparent border-b-gray-950',
    left: 'absolute left-full top-1/2 -translate-y-1/2 -ml-[9px] border-[9px] border-transparent border-l-gray-950',
    right: 'absolute right-full top-1/2 -translate-y-1/2 -mr-[9px] border-[9px] border-transparent border-r-gray-950',
  };

  return (
    <div className="group/tip relative inline-flex items-center cursor-help">
      {children || (
        <div className="flex items-center gap-1.5">
          <span>{metricData.title}</span>
          <HelpCircle className="w-3.5 h-3.5 text-gray-500 group-hover/tip:text-blue-400 transition-colors" />
        </div>
      )}

      <div className={`absolute ${positionClasses[position]} hidden group-hover/tip:block z-[99999] pointer-events-none`}>
        <div className="bg-gray-950 text-gray-100 rounded-xl p-5 shadow-2xl border-2 border-blue-500 min-w-[340px] max-w-md backdrop-blur-sm">
          <div className="font-bold text-blue-400 text-lg mb-2">{metricData.title}</div>
          <div className="text-sm text-gray-200 mb-3 leading-relaxed">{metricData.definition}</div>
          {metricData.benchmark && (
            <div className="text-xs bg-blue-950/50 text-blue-200 border border-blue-800/50 rounded-lg px-3 py-2 mb-2">
              <span className="font-semibold">Benchmark:</span> {metricData.benchmark}
            </div>
          )}
          {metricData.context && (
            <div className="text-sm text-gray-300 border-t border-gray-700 pt-3 mt-3 bg-gray-900/50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl">
              <span className="text-blue-400 font-semibold">Context:</span> {metricData.context}
            </div>
          )}
          {value && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="text-lg font-bold text-green-400">{value}</div>
            </div>
          )}
        </div>
        <div className={`absolute ${arrowClasses[position]} border-[10px]`}></div>
        <div className={innerArrowMap[position]}></div>
      </div>
    </div>
  );
}

interface MetricValueProps {
  value?: string | number;
  context: string;
  details?: string[];
  children?: React.ReactNode;
}

export function MetricValue({ value, context, details, children }: MetricValueProps) {
  const displayValue = children || value;

  return (
    <div className="group/mv relative inline-block cursor-help">
      <span className="group-hover/mv:text-blue-300 transition-colors duration-200 border-b border-dashed border-transparent group-hover/mv:border-blue-500/50">{displayValue}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/mv:block z-[99999] pointer-events-none">
        <div className="bg-gray-950 text-gray-100 rounded-xl p-4 shadow-2xl border-2 border-blue-500 min-w-[280px] max-w-sm backdrop-blur-sm">
          {value && (
            <div className="text-xl font-bold text-blue-300 mb-2">{value}</div>
          )}
          <div className="text-sm text-gray-300 leading-relaxed">{context}</div>
          {details && details.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800 space-y-1.5">
              {details.map((detail, i) => (
                <div key={i} className="text-xs text-gray-400 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
          <div className="border-[10px] border-transparent border-t-blue-500"></div>
          <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 border-[9px] border-transparent border-t-gray-950"></div>
        </div>
      </div>
    </div>
  );
}
