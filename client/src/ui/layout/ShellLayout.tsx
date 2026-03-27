import React, { type ReactNode } from 'react';
import { TopNav } from './TopNav';
import { useThemeStore } from '../theme/theme.store';
import { clsx } from 'clsx';
import { Github } from 'lucide-react';
import '../theme/crt.css';
import '../theme/flir.css';
import '../theme/eo.css';

interface ShellLayoutProps {
  children: ReactNode;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children }) => {
  const mode = useThemeStore((s) => s.mode);

  return (
    <div className={clsx('flex flex-col h-screen w-screen overflow-hidden', `theme-${mode}`)}>
      <TopNav />
      <main className="flex-1 relative bg-intel-bg">{children}</main>
      <footer className="flex items-center justify-center gap-4 px-4 py-1.5 bg-black/70 border-t border-white/10 text-[10px] text-white/40 shrink-0">
        <span className="font-bold tracking-[0.2em] text-white/70 uppercase text-[11px]">
          GRAVION
        </span>
        <span className="text-white/15">|</span>
        <a
          href="https://github.com/gengenesix/gravion"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1 transition-all duration-200 hover:text-white"
          style={{ textShadow: 'none' }}
          onMouseEnter={(e) => (e.currentTarget.style.textShadow = '0 0 8px rgba(255,255,255,0.8)')}
          onMouseLeave={(e) => (e.currentTarget.style.textShadow = 'none')}
        >
          <Github size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
          <span>GitHub</span>
        </a>
        <span className="text-white/15">|</span>
        <span className="text-white/40">ADS-B · AIS · GPS · AI</span>
      </footer>
    </div>
  );
};
