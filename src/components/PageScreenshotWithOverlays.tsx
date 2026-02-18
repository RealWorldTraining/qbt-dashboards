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

interface PageScreenshotProps {
  imagePath: string;
  pageHeight: number;
  scrollZones: OverlayZone[];
  deadClickHotspots: Hotspot[];
  ctaMarkers: Hotspot[];
}

export default function PageScreenshotWithOverlays({
  imagePath,
  pageHeight,
  scrollZones,
  deadClickHotspots,
  ctaMarkers
}: PageScreenshotProps) {
  const [showScrollDepth, setShowScrollDepth] = useState(true);
  const [showDeadClicks, setShowDeadClicks] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);

  return (
    <div className="space-y-4">
      {/* Toggle Controls */}
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

      {/* Screenshot with Overlays */}
      <div className="relative border-2 border-gray-700 rounded-lg overflow-hidden shadow-2xl">
        <Image
          src={imagePath}
          alt="Page Screenshot"
          width={1920}
          height={pageHeight}
          className="w-full h-auto"
        />

        {/* Scroll Depth Overlay */}
        {showScrollDepth && (
          <div className="absolute inset-0 pointer-events-none">
            {scrollZones.map((zone, idx) => (
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
                <div className="absolute right-4 top-2 bg-gray-900/90 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {zone.percentage} {zone.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dead Click Hotspots */}
        {showDeadClicks && deadClickHotspots.map((hotspot, idx) => (
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
              <div className="w-16 h-16 bg-red-500/30 rounded-full border-4 border-red-500 animate-ping absolute"></div>
              <div className="w-16 h-16 bg-red-500/50 rounded-full border-4 border-red-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{hotspot.percentage}</span>
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-red-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                {hotspot.label}
              </div>
            </div>
          </div>
        ))}

        {/* CTA Markers */}
        {showCTAs && ctaMarkers.map((cta, idx) => (
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
              <div className="w-12 h-12 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">📍</span>
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-blue-900 text-white px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap shadow-xl">
                {cta.label}: {cta.percentage}
              </div>
            </div>
          </div>
        ))}
      </div>

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
            <p className="text-gray-300">Red circles show areas where users click expecting action but nothing happens. 18.3% of desktop clicks are dead clicks.</p>
          </div>
        )}
        {showCTAs && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h4 className="font-bold text-white mb-2">CTA Performance</h4>
            <p className="text-gray-300">Blue pins mark call-to-action buttons with their click-through rates from Hotjar data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
