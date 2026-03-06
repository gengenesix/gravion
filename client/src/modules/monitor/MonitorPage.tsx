import React from 'react';
import { MonitorMap } from './components/MonitorMap';
import { GPSJammingWidget } from './components/widgets/GPSJammingWidget';
import { AIInsightsWidget } from './components/widgets/AIInsightsWidget';

export const MonitorPage: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-intel-bg font-mono overflow-hidden z-20 flex flex-col text-intel-text tracking-wide">
      {/* Top Half: Global Map */}
      <div className="h-1/2 relative w-full border-b border-intel-accent/30 shadow-[0_4px_30px_rgba(0,229,255,0.05)] z-10 bg-black">
        <MonitorMap />
      </div>

      {/* Bottom Half: Intelligence Dashboard */}
      <div className="h-1/2 p-6 min-h-0 bg-gradient-to-b from-black to-intel-bg relative">
        {/* Tech grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

        {/* Widget Grid */}
        <div className="h-full relative z-10 grid grid-cols-3 gap-5">
          {/* GPS Jamming Widget */}
          <div className="relative tech-panel p-4 overflow-hidden group hover:shadow-lg hover:shadow-orange-500/10 transition-all">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <GPSJammingWidget />
          </div>

          {/* AI Synthesis Engine Widget - Spans 2 columns */}
          <div className="relative col-span-2 tech-panel p-4 overflow-hidden group hover:shadow-lg hover:shadow-purple-500/10 transition-all">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <AIInsightsWidget />
          </div>
        </div>
      </div>

      {/* Scanlines overlay for aesthetic */}
      <div className="absolute inset-0 pointer-events-none bg-[url('/scanlines.png')] opacity-[0.05] mix-blend-overlay z-50"></div>
    </div>
  );
};
