import { useGPSJammingStore } from '../../gpsJamming.store';
import { useGPSJammingData } from '../../hooks/useGPSJammingData';
import { Radio, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

/**
 * GPS Jamming Statistics Widget
 * Displays interference data overview and filters
 */
export function GPSJammingWidget() {
  const { data, loading, enabled, setEnabled } = useGPSJammingData();
  const {
    showCleanSignals,
    showInterferedSignals,
    showMixedSignals,
    setShowCleanSignals,
    setShowInterferedSignals,
    setShowMixedSignals,
  } = useGPSJammingStore();

  // Calculate statistics
  const stats = data
    ? {
        total: data.totalCells,
        clean: data.cells.filter((c) => c.interference <= 0.02).length,
        mixed: data.cells.filter((c) => c.interference > 0.02 && c.interference <= 0.1).length,
        interfered: data.cells.filter((c) => c.interference > 0.1).length,
      }
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 uppercase tracking-widest text-xs font-bold text-intel-text-light pb-3 border-b border-white/10 min-h-[28px]">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-orange-400 drop-shadow-[0_0_8px_rgba(255,165,0,0.8)]" />
          <span>GPS Jamming</span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={clsx(
            'text-[9px] px-2 py-0.5 border transition-colors',
            enabled
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
              : 'bg-transparent text-white/50 border-white/20 hover:border-orange-500/30',
          )}
        >
          {enabled ? 'ACTIVE' : 'DISABLED'}
        </button>
      </div>

      {/* Spacer to match AI widget structure */}
      <div className="shrink-0 h-[52px]"></div>

      {!enabled && (
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div className="text-white/30 text-xs">
            &gt; Layer disabled. Click DISABLED to activate.
          </div>
        </div>
      )}

      {enabled && loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-orange-400 animate-pulse text-xs">
            &gt; Syncing GPS interference data...
          </div>
        </div>
      )}

      {enabled && !loading && stats && (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-white/10 bg-black/40 p-3">
              <div className="text-[9px] text-white/50 uppercase tracking-wider mb-1">
                Total Cells
              </div>
              <div className="text-2xl font-bold text-intel-accent">
                {stats.total.toLocaleString()}
              </div>
            </div>

            <div className="border border-green-500/30 bg-green-500/5 p-3">
              <div className="text-[9px] text-green-400/70 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle2 size={10} />
                Low (0-2%)
              </div>
              <div className="text-2xl font-bold text-green-400">
                {stats.clean.toLocaleString()}
              </div>
              <div className="text-[9px] text-green-400/50 mt-1">
                {((stats.clean / stats.total) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="border border-yellow-500/30 bg-yellow-500/5 p-3">
              <div className="text-[9px] text-yellow-400/70 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertCircle size={10} />
                Medium (2-10%)
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {stats.mixed.toLocaleString()}
              </div>
              <div className="text-[9px] text-yellow-400/50 mt-1">
                {((stats.mixed / stats.total) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="border border-red-500/30 bg-red-500/5 p-3">
              <div className="text-[9px] text-red-400/70 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertTriangle size={10} />
                High (&gt;10%)
              </div>
              <div className="text-2xl font-bold text-red-400">
                {stats.interfered.toLocaleString()}
              </div>
              <div className="text-[9px] text-red-400/50 mt-1">
                {((stats.interfered / stats.total) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="border-t border-white/10 pt-4">
            <div className="text-[10px] text-white/50 uppercase tracking-wider mb-3">
              Map Filters
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showCleanSignals}
                  onChange={(e) => setShowCleanSignals(e.target.checked)}
                  className="w-3 h-3 rounded border-2 border-green-500/50 bg-black/50 checked:bg-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-sm bg-green-500/80" />
                  <span className="text-[11px] text-white/80 group-hover:text-white transition-colors">
                    Show Low Interference
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showMixedSignals}
                  onChange={(e) => setShowMixedSignals(e.target.checked)}
                  className="w-3 h-3 rounded border-2 border-yellow-500/50 bg-black/50 checked:bg-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 cursor-pointer"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-sm bg-yellow-500/80" />
                  <span className="text-[11px] text-white/80 group-hover:text-white transition-colors">
                    Show Medium Interference
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showInterferedSignals}
                  onChange={(e) => setShowInterferedSignals(e.target.checked)}
                  className="w-3 h-3 rounded border-2 border-red-500/50 bg-black/50 checked:bg-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-sm bg-red-500/80" />
                  <span className="text-[11px] text-white/80 group-hover:text-white transition-colors">
                    Show High Interference
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Data Source */}
          <div className="text-[9px] text-white/30 pt-3 border-t border-white/5">
            Data from <span className="text-orange-400/70">gpsjam.org</span>
          </div>
        </div>
      )}
    </div>
  );
}
