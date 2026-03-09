import { Shield, AlertTriangle } from 'lucide-react';
import { useGulfWatchAlerts } from '../../hooks/useGulfWatchAlerts';

const SEVERITY_COLOR: Record<string, { text: string; border: string; bg: string; dot: string }> = {
  warning: {
    text: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/8',
    dot: 'bg-red-400',
  },
  watch: {
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/8',
    dot: 'bg-orange-400',
  },
};

function fmt(iso: string) {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '';
}

export function GulfWatchWidget() {
  const { data, isLoading, isError } = useGulfWatchAlerts();

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Shield
            size={12}
            className={
              data?.isActive
                ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.9)] animate-pulse'
                : 'text-orange-400/50'
            }
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-intel-text-light">
            Gulf Watch
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {data?.isActive ? (
            <span className="flex items-center gap-1 text-[8px] text-orange-400 font-bold uppercase tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
              LIVE
            </span>
          ) : (
            <span className="text-[8px] text-white/20 uppercase tracking-wider">
              {isLoading ? 'loading...' : 'monitoring'}
            </span>
          )}
        </div>
      </div>

      {/* Source row */}
      <div className="flex items-center gap-1.5 shrink-0 py-2 border-b border-white/5">
        <AlertTriangle size={9} className="text-orange-400/40 shrink-0" />
        <span className="text-[7px] text-white/25 uppercase tracking-wider">
          gulfwatch.ai · UAE
        </span>
        {data && (
          <span className="ml-auto text-[8px] text-orange-400/60 font-bold tabular-nums">
            {data.totalActive} active
          </span>
        )}
      </div>

      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] text-orange-400/50 font-mono">&gt; feed unavailable</span>
        </div>
      )}

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] text-orange-400/40 animate-pulse font-mono">
            &gt; connecting...
          </span>
        </div>
      )}

      {data && (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pt-2">
          {!data.isActive && (
            <div className="border border-white/5 bg-black/30 px-2.5 py-2 text-center">
              <p className="text-[9px] text-white/20 font-mono">&gt; No active alerts</p>
            </div>
          )}

          {data.isActive && data.alerts.length > 0 && (
            <div className="space-y-1.5">
              {data.alerts.slice(0, 10).map((alert) => {
                const c = SEVERITY_COLOR[alert.severity] ?? SEVERITY_COLOR.watch;
                return (
                  <div
                    key={alert.id}
                    className={`border ${c.border} ${c.bg} px-2.5 py-2 rounded-sm`}
                  >
                    <div className={`flex items-center justify-between mb-1 ${c.text}`}>
                      <div className="flex items-center gap-1">
                        <span className={`w-1 h-1 rounded-full shrink-0 animate-pulse ${c.dot}`} />
                        <span className="text-[8px] font-bold uppercase tracking-wider">
                          {alert.emirateId.replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-[7px] opacity-60 uppercase tracking-wider">
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-[9px] text-white/60 leading-snug line-clamp-2">
                      {alert.description.en}
                    </p>

                    <div className="flex items-center justify-between mt-1 text-[7px] text-white/20">
                      <span className="uppercase tracking-wider">
                        {alert.type.replace('-', ' ')}
                      </span>
                      <span className="tabular-nums">{fmt(alert.startedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-[7px] text-white/15 mt-auto pt-2 border-t border-white/5">
            Refreshes every 60 s · UAE only
          </div>
        </div>
      )}
    </div>
  );
}
