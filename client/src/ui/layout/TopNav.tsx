import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../theme/theme.store';
import type { ActiveModule } from '../theme/theme.store';

// UTC clock
function UTCClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-green-400/70 font-mono text-xs tabular-nums">{time}</span>;
}

interface NavTab {
  id: ActiveModule;
  label: string;
  icon?: string;
  color?: string;
}

const NAV_TABS: NavTab[] = [
  { id: 'flights',  label: 'AIR',      icon: '✈', color: 'cyan' },
  { id: 'maritime', label: 'SEA',      icon: '⛵', color: 'cyan' },
  { id: 'monitor',  label: 'MONITOR',  icon: '⚠', color: 'cyan' },
  { id: 'cyber',    label: 'CYBER',    icon: '⚡', color: 'cyan' },
  { id: 'intel',    label: 'INTEL AI', icon: '🤖', color: 'green' },
  { id: 'tracking', label: 'TRACK',    icon: '📡', color: 'green' },
  { id: 'ip-trace', label: 'IP TRACE', icon: '🌐', color: 'green' },
  { id: 'osint',    label: 'OSINT',    icon: '🕷', color: 'purple' },
  { id: 'globe',    label: '3D GLOBE', icon: '🌍', color: 'yellow' },
];

const COLOR_MAP = {
  cyan:   { active: 'border-cyan-400 text-cyan-300 bg-cyan-400/5 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]', hover: 'hover:text-cyan-300 hover:border-cyan-600' },
  green:  { active: 'border-green-400 text-green-300 bg-green-400/5 drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]', hover: 'hover:text-green-300 hover:border-green-600' },
  purple: { active: 'border-purple-400 text-purple-300 bg-purple-400/5 drop-shadow-[0_0_6px_rgba(192,132,252,0.6)]', hover: 'hover:text-purple-300 hover:border-purple-600' },
  yellow: { active: 'border-yellow-400 text-yellow-300 bg-yellow-400/5 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]', hover: 'hover:text-yellow-300 hover:border-yellow-600' },
};

export const TopNav: React.FC = () => {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const mapProjection = useThemeStore((s) => s.mapProjection);
  const setMapProjection = useThemeStore((s) => s.setMapProjection);
  const activeModule = useThemeStore((s) => s.activeModule);
  const setActiveModule = useThemeStore((s) => s.setActiveModule);

  return (
    <header className="h-12 bg-black border-b border-cyan-900/60 flex items-stretch z-10 relative select-none"
      style={{ boxShadow: '0 1px 20px rgba(0,229,255,0.07), inset 0 -1px 0 rgba(0,229,255,0.15)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 border-r border-cyan-900/40 shrink-0">
        <div className="flex gap-0.5">
          <div className="w-1 h-5 bg-cyan-400" style={{ boxShadow: '0 0 6px rgba(0,229,255,0.8)' }} />
          <div className="w-1 h-5 bg-cyan-600/60" />
        </div>
        <div>
          <div className="text-cyan-300 font-mono font-black text-sm tracking-[0.25em] leading-none"
            style={{ textShadow: '0 0 10px rgba(0,229,255,0.5)' }}>
            GRAVION
          </div>
          <div className="text-cyan-600 font-mono text-[9px] tracking-[0.15em] leading-none mt-0.5">
            INTEL FUSION
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex items-stretch flex-1 overflow-x-auto scrollbar-none">
        {NAV_TABS.map((tab) => {
          const isActive = activeModule === tab.id;
          const colors = COLOR_MAP[tab.color as keyof typeof COLOR_MAP] || COLOR_MAP.cyan;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 h-full border-b-2 font-mono text-[11px] tracking-[0.12em] uppercase transition-all whitespace-nowrap shrink-0
                ${isActive
                  ? `${colors.active} border-b-2`
                  : `border-transparent text-gray-500 ${colors.hover} hover:bg-white/3`
                }
              `}
            >
              <span className={`text-xs ${isActive ? '' : 'opacity-60'}`}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-3 px-4 border-l border-cyan-900/40 shrink-0">
        {/* UTC Clock */}
        <UTCClock />

        {/* Projection */}
        <div className="flex items-center gap-1.5 border-l border-cyan-900/30 pl-3">
          <span className="text-gray-600 font-mono text-[10px] tracking-wider">PROJ</span>
          <button
            onClick={() => setMapProjection(mapProjection === 'mercator' ? 'globe' : 'mercator')}
            className="px-2 py-0.5 font-mono text-[10px] border border-cyan-800/60 text-cyan-500 hover:border-cyan-500 hover:text-cyan-300 transition-all tracking-wider"
          >
            {mapProjection.toUpperCase()}
          </button>
        </div>

        {/* Sensor mode */}
        <div className="flex items-center gap-1 border-l border-cyan-900/30 pl-3">
          <span className="text-gray-600 font-mono text-[10px] tracking-wider mr-1">SENSOR</span>
          {(['eo', 'flir', 'crt'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-0.5 font-mono text-[10px] border transition-all tracking-wider ${
                mode === m
                  ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-1.5 border-l border-cyan-900/30 pl-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: '0 0 4px rgba(74,222,128,0.8)' }} />
          <span className="text-green-500/70 font-mono text-[10px] tracking-wider">LIVE</span>
        </div>
      </div>
    </header>
  );
};
