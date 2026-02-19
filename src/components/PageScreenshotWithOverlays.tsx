'use client';

import { useState } from 'react';
import Image from 'next/image';

interface OverlayZone {
  top: number;
  height: number;
  color: string;
  label: string;
  percentage: string;
}

interface Hotspot {
  x: number;
  y: number;
  label: string;
  percentage: string;
}

interface DeviceConfig {
  imagePath?: string;
  pageHeight: number;
  scrollZones: OverlayZone[];
  deadClickHotspots: Hotspot[];
  ctaMarkers: Hotspot[];
  summary?: string;
}

interface PageScreenshotProps {
  imagePath: string;
  pageHeight: number;
  scrollZones: OverlayZone[];
  deadClickHotspots: Hotspot[];
  ctaMarkers: Hotspot[];
  mobileConfig?: DeviceConfig;
}

export default function PageScreenshotWithOverlays({
  imagePath,
  pageHeight,
  scrollZones,
  deadClickHotspots,
  ctaMarkers,
  mobileConfig,
}: PageScreenshotProps) {
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showScrollDepth, setShowScrollDepth] = useState(true);
  const [showDeadClicks, setShowDeadClicks] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);

  const isMobile = activeDevice === 'mobile';
  const currentImage = isMobile ? (mobileConfig?.imagePath || imagePath) : imagePath;
  const currentHeight = isMobile ? (mobileConfig?.pageHeight || pageHeight) : pageHeight;
  const currentScrollZones = isMobile ? (mobileConfig?.scrollZones || []) : scrollZones;
  const currentDeadClicks = isMobile ? (mobileConfig?.deadClickHotspots || []) : deadClickHotspots;
  const currentCTAs = isMobile ? (mobileConfig?.ctaMarkers || []) : ctaMarkers;

  return (
    <div className="space-y-4">
      {/* Device Toggle + Overlay Controls */}
      <div className="flex flex-col gap-3">
        {/* Device Toggle */}
        {mobileConfig && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 mr-1">Device:</span>
            <button
              onClick={() => setActiveDevice('desktop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeDevice === 'desktop'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Desktop
            </button>
            <button
              onClick={() => setActiveDevice('mobile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeDevice === 'mobile'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Mobile
            </button>
          </div>
        )}

        {/* Overlay Toggles */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowScrollDepth(!showScrollDepth)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showScrollDepth
                ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showScrollDepth ? '✓' : '○'} Scroll Depth Zones
          </button>
          <button
            onClick={() => setShowDeadClicks(!showDeadClicks)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showDeadClicks
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showDeadClicks ? '✓' : '○'} Dead Click Hotspots
          </button>
          <button
            onClick={() => setShowCTAs(!showCTAs)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showCTAs
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showCTAs ? '✓' : '○'} CTA Performance
          </button>
        </div>
      </div>

      {/* Screenshot with Overlays */}
      <div className={`${isMobile ? 'flex justify-center' : ''}`}>
        <div className={`relative ${isMobile ? 'w-[375px] mx-auto' : ''}`}>
          {/* Phone Frame for Mobile */}
          {isMobile && (
            <div className="absolute -inset-3 border-[3px] border-gray-500 rounded-[2rem] pointer-events-none z-20">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-gray-600 rounded-full"></div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-gray-600 rounded-full"></div>
            </div>
          )}

          <div className={`relative border-2 border-gray-700 rounded-lg overflow-hidden shadow-2xl ${isMobile ? 'rounded-[1.5rem]' : ''}`}>
            <Image
              src={currentImage}
              alt={`Page Screenshot - ${activeDevice}`}
              width={isMobile ? 375 : 1920}
              height={currentHeight}
              className="w-full h-auto"
            />

            {/* Scroll Depth Overlay */}
            {showScrollDepth && (
              <div className="absolute inset-0 pointer-events-none">
                {currentScrollZones.map((zone, idx) => (
                  <div
                    key={idx}
                    className="absolute w-full border-t-2 border-dashed"
                    style={{
                      top: `${zone.top}%`,
                      height: `${zone.height}%`,
                      backgroundColor: zone.color,
                      borderColor: zone.color.replace('0.2', '0.6')
                    }}
                  >
                    <div className={`absolute ${isMobile ? 'right-1 text-[10px] px-1.5 py-0.5' : 'right-4 text-sm px-3 py-1'} top-2 bg-gray-900/90 text-white rounded-full font-bold`}>
                      {zone.percentage} {zone.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dead Click Hotspots */}
            {showDeadClicks && currentDeadClicks.map((hotspot, idx) => (
              <div
                key={idx}
                className="absolute pointer-events-none animate-pulse"
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative">
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-16 h-16'} bg-red-500/30 rounded-full border-4 border-red-500 animate-ping absolute`}></div>
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-16 h-16'} bg-red-500/50 rounded-full border-4 border-red-500 flex items-center justify-center`}>
                    <span className={`text-white font-bold ${isMobile ? 'text-[8px]' : 'text-xs'}`}>{hotspot.percentage}</span>
                  </div>
                  <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 bg-red-900 text-white ${isMobile ? 'px-1 py-0.5 text-[8px]' : 'px-2 py-1 text-xs'} rounded whitespace-nowrap`}>
                    {hotspot.label}
                  </div>
                </div>
              </div>
            ))}

            {/* CTA Markers */}
            {showCTAs && currentCTAs.map((cta, idx) => (
              <div
                key={idx}
                className="absolute pointer-events-none"
                style={{
                  left: `${cta.x}%`,
                  top: `${cta.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="relative">
                  <div className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center`}>
                    <span className={`text-white font-bold ${isMobile ? 'text-sm' : 'text-lg'}`}>📍</span>
                  </div>
                  <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-900 text-white ${isMobile ? 'px-1.5 py-0.5 text-[9px]' : 'px-3 py-1 text-sm'} rounded-lg font-semibold whitespace-nowrap shadow-xl`}>
                    {cta.label}: {cta.percentage}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Summary Callout */}
      {isMobile && mobileConfig?.summary && (
        <div className="bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r text-gray-300">
          <strong className="text-purple-300">Mobile Insight:</strong> {mobileConfig.summary}
        </div>
      )}

      {/* Legend */}
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        {showScrollDepth && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="font-bold text-white mb-2">Scroll Depth Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/40 border border-green-500"></div>
                <span className="text-gray-300">100% of users see this</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500/40 border border-yellow-500"></div>
                <span className="text-gray-300">50% reach this zone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/40 border border-red-500"></div>
                <span className="text-gray-300">&lt;10% see this (critical)</span>
              </div>
            </div>
          </div>
        )}
        {showDeadClicks && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="font-bold text-white mb-2">Dead Click Hotspots</h4>
            <p className="text-gray-300">
              {isMobile
                ? 'Red circles show tap areas with no response. Mobile dead clicks are typically much lower (1–2%) due to linear, tap-friendly layouts.'
                : 'Red circles show areas where users click expecting action but nothing happens. 18.3% of desktop clicks are dead clicks.'
              }
            </p>
          </div>
        )}
        {showCTAs && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="font-bold text-white mb-2">CTA Performance</h4>
            <p className="text-gray-300">
              {isMobile
                ? 'Blue pins mark CTA tap rates. Mobile CTAs typically see 2–3x higher engagement than desktop due to the linear scroll layout.'
                : 'Blue pins mark call-to-action buttons with their click-through rates from Hotjar data.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
