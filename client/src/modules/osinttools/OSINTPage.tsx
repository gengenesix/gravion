import { useState, useEffect } from 'react';

interface ToolStatus {
  spiderfoot: { online: boolean; url: string };
  opencti: { online: boolean; url: string };
}

interface SpiderFootScan {
  started: boolean;
  target: string;
  scanId: string;
  url: string;
  error?: string;
}

const API_BASE = import.meta.env.VITE_API_URL as string || '';

const OSINT_TOOLS = [
  { id: 'spiderfoot', name: 'SpiderFoot', desc: '200+ OSINT recon modules', port: 5001, icon: '🕷' },
  { id: 'opencti', name: 'OpenCTI', desc: 'STIX2 threat intelligence', port: 8888, icon: '🔬' },
  { id: 'traccar', name: 'Traccar', desc: 'GPS device tracking', port: 8082, icon: '📡' },
  { id: 'neo4j', name: 'Neo4j', desc: 'Entity graph database', port: 7474, icon: '🕸' },
  { id: 'ollama', name: 'Ollama', desc: 'Local AI inference', port: 11434, icon: '🤖' },
];

export function OSINTPage() {
  const [status, setStatus] = useState<ToolStatus | null>(null);
  const [target, setTarget] = useState('');
  const [scanResult, setScanResult] = useState<SpiderFootScan | null>(null);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'spiderfoot' | 'opencti'>('dashboard');
  const serverIp = window.location.hostname;

  useEffect(() => {
    fetch(`${API_BASE}/api/osint/status`)
      .then((r) => r.json())
      .then((d) => setStatus(d as ToolStatus))
      .catch(() => {});
  }, []);

  const startScan = async () => {
    if (!target.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/osint/spiderfoot/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim() }),
      });
      const data = await res.json() as SpiderFootScan;
      setScanResult(data);
    } catch (err) {
      setScanResult({ started: false, target, scanId: '', url: '', error: String(err) });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="h-full bg-gray-950 flex flex-col font-mono overflow-hidden">
      {/* Header */}
      <div className="border-b border-purple-900 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-purple-400 font-bold text-sm tracking-widest">◈ GRAVION OSINT & CTI</span>
          <div className="flex gap-1">
            {(['dashboard', 'spiderfoot', 'opencti'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`text-xs px-3 py-1 border transition-colors ${activeTab === tab ? 'border-purple-500 text-purple-300 bg-purple-900/20' : 'border-gray-700 text-gray-500 hover:border-purple-700'}`}>
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          {status && (
            <>
              <StatusDot label="SpiderFoot" online={status.spiderfoot.online} />
              <StatusDot label="OpenCTI" online={status.opencti.online} />
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="text-purple-400 text-xs font-bold tracking-widest mb-3">GRAVION INTELLIGENCE TOOLS</div>

            {/* Tool grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {OSINT_TOOLS.map((tool) => {
                const isOnline = tool.id === 'spiderfoot' ? status?.spiderfoot.online
                  : tool.id === 'opencti' ? status?.opencti.online
                  : true; // assume running
                return (
                  <div key={tool.id} className={`border rounded p-3 ${isOnline ? 'border-purple-700 bg-gray-900' : 'border-gray-800 bg-gray-950'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tool.icon}</span>
                        <span className={`font-bold text-sm ${isOnline ? 'text-purple-300' : 'text-gray-600'}`}>{tool.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                          {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-600 text-xs">{tool.desc}</div>
                    <a href={`http://${serverIp}:${tool.port}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:text-purple-400 mt-1 inline-block">
                      Open UI → :{tool.port}
                    </a>
                  </div>
                );
              })}
            </div>

            {/* Quick IP/Domain recon */}
            <div className="border border-purple-900 bg-gray-900 rounded p-4">
              <div className="text-purple-400 font-bold text-xs tracking-widest mb-3">⚡ QUICK RECON — SpiderFoot</div>
              <div className="flex gap-2 mb-3">
                <input type="text" value={target} onChange={(e) => setTarget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startScan()}
                  placeholder="IP, domain, email, username..."
                  className="flex-1 bg-gray-950 border border-purple-800 text-purple-300 placeholder-gray-600 px-3 py-1.5 rounded text-xs focus:outline-none focus:border-purple-500" />
                <button onClick={startScan} disabled={scanning || !target.trim() || !status?.spiderfoot.online}
                  className="bg-purple-900 hover:bg-purple-800 disabled:opacity-30 text-purple-300 px-4 py-1.5 rounded text-xs font-bold tracking-widest">
                  {scanning ? '⟳ SCANNING...' : '▶ SCAN'}
                </button>
              </div>

              {!status?.spiderfoot.online && (
                <div className="text-yellow-600 text-xs border border-yellow-900 bg-yellow-950/20 rounded p-2 mb-2">
                  ⚠ SpiderFoot offline. Start it: <code>docker compose up -d spiderfoot</code>
                </div>
              )}

              {scanResult && (
                <div className={`border rounded p-3 text-xs ${scanResult.error ? 'border-red-800 text-red-400' : 'border-green-800 text-green-400'}`}>
                  {scanResult.error ? (
                    <div>⚠ {scanResult.error}</div>
                  ) : (
                    <div>
                      <div className="font-bold mb-1">✓ Scan started for: {scanResult.target}</div>
                      <div className="text-gray-400">Scan ID: {scanResult.scanId}</div>
                      <a href={scanResult.url} target="_blank" rel="noopener noreferrer"
                        className="text-purple-400 hover:underline">View results in SpiderFoot →</a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Setup instructions */}
            <div className="border border-gray-800 rounded p-4 text-xs text-gray-500 space-y-2">
              <div className="text-gray-400 font-bold">SETUP INSTRUCTIONS</div>
              <div><span className="text-purple-400">SpiderFoot:</span> Already running at port 5001 → <code className="text-gray-400">http://{serverIp}:5001</code></div>
              <div><span className="text-purple-400">OpenCTI:</span> Requires 8GB+ RAM → <code className="text-gray-400">docker compose --profile heavy up -d opencti</code></div>
              <div><span className="text-purple-400">Traccar:</span> Open <code className="text-gray-400">http://{serverIp}:8082</code> → Register admin → Connect Traccar Client app</div>
              <div><span className="text-purple-400">Ollama AI:</span> <code className="text-gray-400">docker exec gravion-ollama ollama pull llama3.2</code></div>
              <div><span className="text-purple-400">Neo4j Graph:</span> Open <code className="text-gray-400">http://{serverIp}:7474</code> → login: neo4j / gravion_neo4j_2024</div>
            </div>
          </div>
        )}

        {activeTab === 'spiderfoot' && (
          <div className="h-full">
            {status?.spiderfoot.online ? (
              <iframe src={`http://${serverIp}:5001`} className="w-full h-full border border-purple-900 rounded"
                title="SpiderFoot" />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                <div className="text-4xl mb-3">🕷</div>
                <div className="font-bold text-gray-500 mb-2">SpiderFoot Offline</div>
                <code className="text-xs bg-gray-900 px-3 py-1 rounded">docker compose up -d spiderfoot</code>
              </div>
            )}
          </div>
        )}

        {activeTab === 'opencti' && (
          <div className="h-full">
            {status?.opencti.online ? (
              <iframe src={`http://${serverIp}:8888`} className="w-full h-full border border-purple-900 rounded"
                title="OpenCTI" />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                <div className="text-4xl mb-3">🔬</div>
                <div className="font-bold text-gray-500 mb-2">OpenCTI Offline (requires 8GB+ RAM)</div>
                <code className="text-xs bg-gray-900 px-3 py-1 rounded">docker compose --profile heavy up -d</code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ label, online }: { label: string; online: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className={`text-xs ${online ? 'text-green-400' : 'text-red-400'}`}>{label}</span>
    </div>
  );
}
