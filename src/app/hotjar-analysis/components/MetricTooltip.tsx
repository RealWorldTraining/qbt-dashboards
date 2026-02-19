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
  context?: string;
}> = {
  'dead-clicks': {
    title: 'Dead Clicks',
    definition: 'Clicks on non-interactive elements (text, backgrounds, images) where users expected something to happen.',
    context: 'High dead click rates (>15%) indicate poor UI affordances and frustrate users trying to navigate or learn more.',
  },
  'cta-click-rate': {
    title: 'CTA Click Rate',
    definition: 'Percentage of visitors who clicked any call-to-action button (Enroll Now, Start Learning, View Plans, etc.).',
    context: 'Industry average is 15-20%. Higher rates indicate strong value proposition and clear conversion paths.',
  },
  'scroll-depth': {
    title: 'Scroll Depth',
    definition: 'Percentage of visitors who scrolled to at least 50% of the page height.',
    context: 'Good scroll depth (>60%) means content is engaging. Poor scroll (<40%) suggests content above the fold isn\'t compelling users to continue.',
  },
  'conversion-rate': {
    title: 'Conversion Rate',
    definition: 'Percentage of sessions that resulted in a purchase.',
    context: 'E-commerce average is 2-3%. For high-ticket items ($600+), 1-4% is expected. Desktop typically converts 3-5x higher than mobile.',
  },
  'avg-engagement': {
    title: 'Average Engagement Time',
    definition: 'Average time visitors actively engage with the page (scrolling, clicking, reading).',
    context: 'Longer engagement (>1m) suggests thorough research, common for high-ticket purchases.',
  },
  'bounce-rate': {
    title: 'Bounce Rate',
    definition: 'Percentage of visitors who leave after viewing only one page without any interaction.',
    context: 'Below 40% is excellent. 40-60% is average. Above 60% suggests landing page issues or traffic quality problems.',
  },
  'exit-rate': {
    title: 'Exit Rate',
    definition: 'Percentage of pageviews that were the last in a session.',
    context: 'Different from bounce rate - measures where users exit after browsing multiple pages. High exit rates on pricing pages may indicate checkout friction.',
  },
};

export default function MetricTooltip({ metric, value, children, position = 'top' }: MetricTooltipProps) {
  const metricData = metricDefinitions[metric];
  
  if (!metricData) {
    return <>{children}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className="group relative inline-flex items-center cursor-help">
      {children || (
        <div className="flex items-center gap-2">
          <span>{metricData.title}</span>
          <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
        </div>
      )}
      
      <div className={`absolute ${positionClasses[position]} hidden group-hover:block z-[9999] pointer-events-none animate-fade-in`}>
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 shadow-2xl border-2 border-blue-500/50 min-w-[320px] max-w-md">
          <div className="font-bold text-blue-300 mb-2">{metricData.title}</div>
          <div className="text-sm mb-3 leading-relaxed">{metricData.definition}</div>
          {metricData.context && (
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
              <span className="text-blue-400 font-semibold">Context:</span> {metricData.context}
            </div>
          )}
          {value && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-lg font-bold text-green-400">{value}</div>
            </div>
          )}
        </div>
        <div className={`absolute ${arrowClasses[position]} border-8`}></div>
      </div>
    </div>
  );
}

export function MetricValue({ value, context }: { value: string | number; context: string }) {
  return (
    <div className="group relative inline-block cursor-help">
      <span className="group-hover:text-blue-400 transition-colors">{value}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[9999] pointer-events-none animate-fade-in">
        <div className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 shadow-2xl border border-blue-500/50 whitespace-nowrap">
          {context}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}
