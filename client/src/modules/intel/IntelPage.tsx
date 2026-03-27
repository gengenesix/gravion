import { useState, useEffect } from 'react';

interface FusionStatus {
  ollama: { online: boolean; models: string[] };
  neo4j: { connected: boolean };
  traccar: { online: boolean };
}

interface SitrepResponse {
  sitrep?: string;
  answer?: string;
  error?: string;
  hint?: string;
  context_sources?: string[];
  timestamp?: string;
  model?: string;
}

interface FusionContext {
  flight_count?: number;
  vessel_count?: number;
  tracked_devices?: number;
  timestamp_utc?: string;
  [key: string]: unknown;
}

const API_BASE = import.meta.env.VITE_API_URL as string || '';

const EXAMPLE_QUERIES = [
  'Generate a full SITREP for current global situation',
  'How many aircraft are currently tracked and where are the highest concentrations?',
  'Are there any unusual maritime vessel patterns?',
  'What is the current GPS jamming activity?',
  'Identify any high-speed aircraft or vessels that may require attention',
];

export function IntelPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SitrepResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<FusionStatus | null>(null);
  const [context, setContext] = useState<FusionContext | null>(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<'sitrep' | 'query'>('sitrep');

  useEffect(() => {
    // Load fusion status
    fetch(`${API_BASE}/api/fusion/status`)
      .then((r) => r.json())
      .then((d) => setStatus(d as FusionStatus))
      .catch(() => {});

    // Load live context preview
    fetch(`${API_BASE}/api/fusion/context`)
      .then((r) => r.json())
      .then((d) => setContext(d as FusionContext))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!query.trim() && mode === 'query') return;
    setLoading(true);
    setResult(null);
    try {
      const endpoint = mode === 'sitrep' ? '/api/fusion/sitrep' : '/api/fusion/query';
      const body = mode === 'sitrep'
        ? { query: query.trim() || undefined, include_live_data: true }
        : { question: query.trim() };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as SitrepResponse;
      setResult(data);
    } catch (err) {
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const output = result?.sitrep || result?.answer || '';
  const isError = !!result?.error;

  return (
    <div className="h-full bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-green-900 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-green-400 font-mono font-bold text-sm tracking-widest">◈ GRAVION FUSION AI</span>
          <div className="flex gap-2">
            {(['sitrep', 'query'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`font-mono text-xs px-3 py-1 border transition-colors ${mode === m ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-gray-700 text-gray-500 hover:border-green-700'}`}>
                {m === 'sitrep' ? '📋 SITREP' : '❓ QUERY'}
              </button>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${status?.ollama?.online ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={status?.ollama?.online ? 'text-green-400' : 'text-red-400'}>
              OLLAMA {status?.ollama?.online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${status?.neo4j?.connected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className={status?.neo4j?.connected ? 'text-green-400' : 'text-yellow-500'}>NEO4J</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${status?.traccar?.online ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className={status?.traccar?.online ? 'text-green-400' : 'text-yellow-500'}>TRACCAR</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Input */}
        <div className="w-1/3 border-r border-green-900 flex flex-col p-3 gap-3">
          {/* Live context summary */}
          {context && (
            <div className="border border-green-900 bg-gray-900 rounded p-2 font-mono text-xs">
              <div className="text-green-500 font-bold mb-1 tracking-wider">LIVE INTEL FEEDS</div>
              <div className="space-y-0.5 text-gray-400">
                <div className="flex justify-between">
                  <span>✈ Aircraft tracked</span>
                  <span className="text-cyan-400">{context.flight_count?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>⛵ Vessels tracked</span>
                  <span className="text-yellow-400">{context.vessel_count?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>📱 GPS devices</span>
                  <span className="text-green-400">{context.tracked_devices ?? 0}</span>
                </div>
                <div className="text-gray-600 text-xs mt-1">{context.timestamp_utc}</div>
              </div>
            </div>
          )}

          {/* Query input */}
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'sitrep'
                ? 'Optional: specific focus for SITREP\n(leave blank for full situation report)'
                : 'Ask a question about live intel data...'}
              className="flex-1 bg-gray-900 border border-green-800 text-green-300 placeholder-gray-600 px-3 py-2 rounded text-xs font-mono focus:outline-none focus:border-green-500 resize-none min-h-[80px]"
            />

            <button onClick={handleGenerate}
              disabled={loading || (mode === 'query' && !query.trim()) || !status?.ollama?.online}
              className="bg-green-900 hover:bg-green-800 disabled:opacity-30 text-green-300 py-2 rounded text-xs font-mono font-bold tracking-widest transition-colors">
              {loading ? '⟳ PROCESSING...' : mode === 'sitrep' ? '▶ GENERATE SITREP' : '▶ QUERY INTEL'}
            </button>

            {!status?.ollama?.online && (
              <div className="text-yellow-600 text-xs font-mono border border-yellow-900 bg-yellow-950/30 rounded p-2">
                ⚠ Ollama offline. Run:<br />
                <code className="text-yellow-400">docker exec gravion-ollama ollama pull llama3</code>
              </div>
            )}
          </div>

          {/* Example queries */}
          <div>
            <div className="text-gray-600 text-xs font-mono mb-1">EXAMPLES:</div>
            <div className="space-y-1">
              {EXAMPLE_QUERIES.map((q) => (
                <button key={q} onClick={() => setQuery(q)}
                  className="w-full text-left text-xs text-gray-600 hover:text-green-400 font-mono py-0.5 transition-colors">
                  › {q.length > 50 ? q.slice(0, 50) + '…' : q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Output */}
        <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden">
          {!result && !loading && (
            <div className="flex-1 flex items-center justify-center text-gray-700 font-mono text-sm">
              SELECT MODE AND GENERATE INTEL REPORT
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="text-green-500 font-mono text-sm animate-pulse">⟳ GRAVION AI PROCESSING...</div>
              <div className="text-gray-600 font-mono text-xs">Fusing live feeds: ADS-B · AIS · Traccar · Cyber</div>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="flex items-center justify-between shrink-0">
                <div className="text-green-400 font-mono text-xs font-bold tracking-wider">
                  {isError ? '⚠ ERROR' : `✓ ${mode === 'sitrep' ? 'SITREP' : 'INTEL RESPONSE'} — ${result.timestamp ? new Date(result.timestamp).toUTCString() : ''}`}
                </div>
                {!isError && (
                  <div className="flex items-center gap-2">
                    {result.context_sources && (
                      <span className="text-gray-600 text-xs font-mono">
                        Sources: {result.context_sources.join(', ')}
                      </span>
                    )}
                    <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="text-xs font-mono text-gray-500 hover:text-green-400 transition-colors">
                      {copied ? '✓ COPIED' : '⊕ COPY'}
                    </button>
                  </div>
                )}
              </div>

              {isError ? (
                <div className="border border-red-800 bg-red-950/30 rounded p-3 font-mono text-xs text-red-400">
                  <div className="font-bold mb-1">{result.error}</div>
                  {result.hint && <div className="text-yellow-500">{result.hint}</div>}
                </div>
              ) : (
                <pre className="flex-1 bg-gray-900 border border-green-900 text-green-300 text-xs p-4 rounded overflow-auto whitespace-pre-wrap leading-relaxed font-mono">
                  {output}
                </pre>
              )}

              {result.model && (
                <div className="text-gray-700 text-xs font-mono shrink-0">Model: {result.model}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
