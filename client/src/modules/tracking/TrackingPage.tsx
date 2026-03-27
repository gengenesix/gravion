import { useState, useEffect } from "react";

interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  lastUpdate: string;
  positionId?: number;
}

interface TraccarPosition {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  fixTime: string;
  deviceTime: string;
}

export function TrackingPage() {
  const [devices, setDevices] = useState<TraccarDevice[]>([]);
  const [positions, setPositions] = useState<TraccarPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiBase = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, posRes] = await Promise.all([
          fetch(`${apiBase}/api/traccar/devices`),
          fetch(`${apiBase}/api/traccar/positions`),
        ]);
        const devData = await devRes.json() as TraccarDevice[] | { error: string };
        const posData = await posRes.json() as TraccarPosition[] | { error: string };
        if (Array.isArray(devData)) setDevices(devData);
        if (Array.isArray(posData)) setPositions(posData);
      } catch {
        setError("Traccar unavailable");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [apiBase]);

  const getPosition = (deviceId: number) =>
    positions.find((p) => p.deviceId === deviceId);

  return (
    <div className="h-full bg-gray-950 p-4 overflow-auto font-mono">
      <div className="flex items-center justify-between mb-4">
        <div className="text-green-400 text-xs font-bold tracking-widest">
          ◈ TRACCAR GPS TRACKING — {devices.length} DEVICES
        </div>
        <div className="flex gap-3 text-xs text-gray-500">
          <span>AUTO-REFRESH: 15s</span>
          <a
            href="http://localhost:8082"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-400 underline"
          >
            OPEN TRACCAR UI →
          </a>
        </div>
      </div>

      {loading && <div className="text-gray-500 text-xs">Loading tracking data...</div>}
      {error && (
        <div className="border border-red-800 bg-red-950 text-red-400 px-3 py-2 rounded text-xs mb-4">
          ⚠ {error} — Is Traccar running? <code>docker compose ps gravion-traccar</code>
        </div>
      )}

      {!loading && devices.length === 0 && !error && (
        <div className="border border-green-900 bg-gray-900 rounded p-6 text-center text-xs text-gray-500">
          <div className="text-green-600 text-lg mb-2">📡</div>
          <div className="text-green-500 font-bold mb-2">No devices registered yet</div>
          <div className="text-gray-600 mb-3">Connect devices by installing Traccar Client:</div>
          <div className="space-y-1 text-gray-600">
            <div>1. Install "Traccar Client" from App Store / Play Store</div>
            <div>2. Set server URL: <span className="text-green-600">http://{"<your-server-ip>"}:5055</span></div>
            <div>3. Set device identifier (any unique ID)</div>
            <div>4. Tap Start — device appears here instantly</div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {devices.map((device) => {
          const pos = getPosition(device.id);
          const isOnline = device.status === "online";
          return (
            <div
              key={device.id}
              className={`border rounded p-3 ${isOnline ? "border-green-700 bg-gray-900" : "border-gray-800 bg-gray-950"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-600"}`} />
                  <span className={`font-bold text-sm ${isOnline ? "text-green-300" : "text-gray-500"}`}>
                    {device.name || device.uniqueId}
                  </span>
                  <span className="text-gray-600 text-xs">{device.uniqueId}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${isOnline ? "bg-green-900 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                  {device.status?.toUpperCase() || "UNKNOWN"}
                </span>
              </div>
              {pos ? (
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                  <div><span className="text-gray-600">LAT</span> <span className="text-green-300">{pos.latitude.toFixed(5)}</span></div>
                  <div><span className="text-gray-600">LON</span> <span className="text-green-300">{pos.longitude.toFixed(5)}</span></div>
                  <div><span className="text-gray-600">ALT</span> <span className="text-green-300">{Math.round(pos.altitude)}m</span></div>
                  <div><span className="text-gray-600">SPD</span> <span className="text-green-300">{(pos.speed * 1.852).toFixed(1)} km/h</span></div>
                  <div><span className="text-gray-600">HDG</span> <span className="text-green-300">{Math.round(pos.course)}°</span></div>
                  <div><span className="text-gray-600">FIX</span> <span className="text-gray-500">{new Date(pos.fixTime).toLocaleTimeString()}</span></div>
                </div>
              ) : (
                <div className="text-xs text-gray-600">No position data</div>
              )}
              <div className="text-xs text-gray-700 mt-1">
                Last update: {device.lastUpdate ? new Date(device.lastUpdate).toLocaleString() : "Never"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
