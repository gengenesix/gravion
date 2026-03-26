import { useState } from 'react';

interface IPTraceResult {
  ip: string;
  city: string | null;
  region: string | null;
  country: string | null;
  org: string | null;
  loc: string | null;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  postal: string | null;
  hostname: string | null;
}

export function IPTracePanel() {
  const [ip, setIp] = useState('');
  const [result, setResult] = useState<IPTraceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_URL || '';

  const handleTrace = async () => {
    if (!ip.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${apiBase}/api/ip-trace?ip=${encodeURIComponent(ip.trim())}`);
      const data = await res.json() as IPTraceResult & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error || 'Trace failed');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error — server unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-950 border border-green-700 rounded-md p-4 font-mono text-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-green-400 font-bold text-xs tracking-widest">◈ IP TRACE</span>
        <span className="text-gray-600 text-xs">GEOLOCATION MODULE</span>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
          placeholder="Enter IP address (e.g. 8.8.8.8)"
          className="flex-1 bg-gray-900 border border-green-800 text-green-300 placeholder-gray-600 px-3 py-1.5 rounded text-xs focus:outline-none focus:border-green-500"
        />
        <button
          onClick={handleTrace}
          disabled={loading || !ip.trim()}
          className="bg-green-900 hover:bg-green-800 disabled:opacity-40 text-green-300 px-4 py-1.5 rounded text-xs font-bold tracking-widest transition-colors"
        >
          {loading ? '...' : 'TRACE'}
        </button>
      </div>

      {error && (
        <div className="border border-red-800 bg-red-950 text-red-400 px-3 py-2 rounded text-xs mb-3">
          ⚠ {error}
        </div>
      )}

      {result && (
        <div className="border border-green-800 bg-gray-900 rounded p-3 space-y-1.5">
          <div className="text-green-400 font-bold text-xs tracking-widest mb-2">
            ✓ TRACE COMPLETE — {result.ip}
          </div>
          {[
            ['HOSTNAME', result.hostname],
            ['LOCATION', [result.city, result.region, result.country].filter(Boolean).join(', ')],
            ['COORDS', result.lat != null ? `${result.lat.toFixed(4)}°N, ${result.lon!.toFixed(4)}°E` : null],
            ['ISP/ORG', result.org],
            ['TIMEZONE', result.timezone],
            ['POSTAL', result.postal],
          ].map(([label, value]) =>
            value ? (
              <div key={label as string} className="flex gap-3">
                <span className="text-gray-500 w-20 shrink-0">{label}</span>
                <span className="text-green-300">{value}</span>
              </div>
            ) : null
          )}
          {result.lat != null && (
            <div className="mt-2 text-xs text-green-600">
              ↗ Plotting on globe: [{result.lat?.toFixed(4)}, {result.lon?.toFixed(4)}]
            </div>
          )}
        </div>
      )}
    </div>
  );
}
