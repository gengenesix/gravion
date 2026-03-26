import { useState, useEffect } from 'react';

interface SitrepResponse {
  sitrep: string;
  model: string;
  timestamp: string;
  error?: string;
}

interface OllamaStatus {
  online: boolean;
  models: string[];
}

export function IntelBriefPanel() {
  const [query, setQuery] = useState('');
  const [sitrep, setSitrep] = useState<SitrepResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [copied, setCopied] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${apiBase}/api/intel/status`)
      .then((r) => r.json())
      .then((d) => setStatus(d as OllamaStatus))
      .catch(() => setStatus({ online: false, models: [] }));
  }, [apiBase]);

  const handleGenerate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSitrep(null);
    try {
      const res = await fetch(`${apiBase}/api/intel/sitrep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = (await res.json()) as SitrepResponse;
      if (!res.ok || data.error) {
        setError(data.error || 'SITREP generation failed');
      } else {
        setSitrep(data);
      }
    } catch {
      setError('Network error — AI agent unreachable');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!sitrep) return;
    navigator.clipboard.writeText(sitrep.sitrep).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const EXAMPLE_QUERIES = [
    'Generate a SITREP for current maritime situation in the Red Sea',
    'Identify unusual flight patterns over the last 6 hours',
    'Assess cyber threat landscape based on active feeds',
    'Summarize geopolitical hotspots with active tracking data',
  ];

  return (
    <div className="bg-gray-950 border border-green-700 rounded-md p-4 font-mono text-sm h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-bold text-xs tracking-widest">◈ GRAVION AI AGENT</span>
          <span className="text-gray-600 text-xs">SITREP GENERATOR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${status?.online ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className={`text-xs ${status?.online ? 'text-green-500' : 'text-red-500'}`}>
            OLLAMA {status?.online ? 'ONLINE' : 'OFFLINE'}
          </span>
          {status?.models?.length ? (
            <span className="text-gray-600 text-xs">· {status.models[0]}</span>
          ) : null}
        </div>
      </div>

      {/* Query input */}
      <div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter intel query... e.g. 'Generate SITREP for vessels near Strait of Hormuz'"
          rows={3}
          className="w-full bg-gray-900 border border-green-800 text-green-300 placeholder-gray-600 px-3 py-2 rounded text-xs focus:outline-none focus:border-green-500 resize-none"
        />
        <div className="flex gap-2 mt-1.5 flex-wrap">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className="text-xs text-gray-600 hover:text-green-500 underline decoration-dotted transition-colors"
            >
              {q.substring(0, 40)}…
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !query.trim() || !status?.online}
        className="bg-green-900 hover:bg-green-800 disabled:opacity-40 text-green-300 py-2 rounded text-xs font-bold tracking-widest transition-colors"
      >
        {loading ? '⟳ GENERATING SITREP...' : '▶ GENERATE SITREP'}
      </button>

      {error && (
        <div className="border border-red-800 bg-red-950 text-red-400 px-3 py-2 rounded text-xs">
          ⚠ {error}
        </div>
      )}

      {sitrep && (
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-green-500 text-xs font-bold tracking-widest">
              ✓ SITREP — {new Date(sitrep.timestamp).toUTCString()}
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-gray-500 hover:text-green-400 transition-colors"
            >
              {copied ? '✓ COPIED' : '⊕ COPY'}
            </button>
          </div>
          <pre className="flex-1 bg-gray-900 border border-green-900 text-green-300 text-xs p-3 rounded overflow-auto whitespace-pre-wrap leading-relaxed">
            {sitrep.sitrep}
          </pre>
          <div className="text-gray-700 text-xs">Model: {sitrep.model}</div>
        </div>
      )}
    </div>
  );
}
