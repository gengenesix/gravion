import React, { type ReactNode, useEffect, useState } from 'react';
import { TopNav } from './TopNav';
import { useThemeStore } from '../theme/theme.store';
import { clsx } from 'clsx';
import '../theme/crt.css';
import '../theme/flir.css';
import '../theme/eo.css';

interface ShellLayoutProps {
  children: ReactNode;
}

// System status bar at the bottom
function StatusBar() {
  const [time, setTime] = useState('');
  const [stats, setStats] = useState({ flights: 0, vessels: 0 });

  useEffect(() => {
    const tick = () => setTime(new Date().toUTCString().replace('GMT', 'Z'));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [fr, mr] = await Promise.all([
          fetch('/api/flights/snapshot').catch(() => null),
          fetch('/api/maritime/status').catch(() => null),
        ]);
        if (fr?.ok) {
          const fd = await fr.json() as { states?: unknown[] };
          setStats(s => ({ ...s, flights: fd.states?.length ?? 0 }));
        }
        if (mr?.ok) {
          const md = await mr.json() as { vesselCount?: number };
          setStats(s => ({ ...s, vessels: md.vesselCount ?? 0 }));
        }
      } catch { /* ignore */ }
    };
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="h-6 bg-black border-t border-cyan-950 flex items-center px-4 gap-6 shrink-0 font-mono text-[10px]"
      style={{ boxShadow: 'inset 0 1px 0 rgba(0,229,255,0.08)' }}>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 4px rgba(74,222,128,0.9)' }} />
        <span className="text-green-500/80 tracking-wider">SYS OPERATIONAL</span>
      </div>
      <div className="text-cyan-800">|</div>
      <span className="text-cyan-700 tracking-wider">✈ <span className="text-cyan-500">{stats.flights.toLocaleString()}</span> TRACKS</span>
      <div className="text-cyan-800">|</div>
      <span className="text-cyan-700 tracking-wider">⛵ <span className="text-cyan-500">{stats.vessels.toLocaleString()}</span> VESSELS</span>
      <div className="text-cyan-800">|</div>
      <span className="text-cyan-700 tracking-wider">NEO4J <span className="text-green-500">●</span></span>
      <span className="text-cyan-700 tracking-wider">TRACCAR <span className="text-green-500">●</span></span>
      <span className="text-cyan-700 tracking-wider">OLLAMA <span className="text-yellow-500">●</span></span>
      <div className="flex-1" />
      <span className="text-cyan-700 tracking-wider">{time}</span>
      <div className="text-cyan-800">|</div>
      <a href="https://github.com/gengenesix/gravion" target="_blank" rel="noopener noreferrer"
        className="text-cyan-800 hover:text-cyan-500 transition-colors tracking-wider">
        GRAVION v2.0
      </a>
    </footer>
  );
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children }) => {
  const mode = useThemeStore((s) => s.mode);

  return (
    <div
      className={clsx('flex flex-col h-screen w-screen overflow-hidden', `theme-${mode}`)}
      style={{ background: '#020408' }}
    >
      <TopNav />
      <main className="flex-1 relative overflow-hidden" style={{ background: '#020408' }}>
        {children}
      </main>
      <StatusBar />
    </div>
  );
};
