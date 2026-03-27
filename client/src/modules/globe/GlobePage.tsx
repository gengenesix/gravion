import { useEffect, useRef, useState } from 'react';

// GRAVION 3D Globe — CesiumJS loaded via CDN at runtime to avoid build complexity
// This guarantees the globe works regardless of npm package structure

const CESIUM_VERSION = '1.120.0';
const CESIUM_CDN = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;
const ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN as string || '';
const API_BASE = import.meta.env.VITE_API_URL as string || '';

// Yesterday for GIBS tiles
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cesium: any;
    _gravionViewer: unknown;
  }
}

export function GlobePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Loading CesiumJS...');
  const [ready, setReady] = useState(false);
  const [flightCount, setFlightCount] = useState(0);
  const [shipCount, setShipCount] = useState(0);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const viewerRef = useRef<unknown>(null);
  const layerRefs = useRef<Map<string, unknown>>(new Map());

  useEffect(() => {
    let destroyed = false;

    async function init() {
      // 1. Inject Cesium CSS
      if (!document.getElementById('cesium-css')) {
        const link = document.createElement('link');
        link.id = 'cesium-css';
        link.rel = 'stylesheet';
        link.href = `${CESIUM_CDN}/Widgets/widgets.css`;
        document.head.appendChild(link);
      }

      // 2. Load Cesium JS from CDN if not already loaded
      if (!window.Cesium) {
        setStatus('Downloading CesiumJS (~8MB)...');
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `${CESIUM_CDN}/Cesium.js`;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load CesiumJS from CDN'));
          document.head.appendChild(script);
        });
      }

      if (destroyed || !containerRef.current) return;

      setStatus('Initializing 3D globe...');
      const Cesium = window.Cesium;
      Cesium.Ion.defaultAccessToken = ION_TOKEN;

      // 3. Create viewer
      const viewer = new Cesium.Viewer(containerRef.current, {
        terrainProvider: ION_TOKEN
          ? Cesium.createWorldTerrain()
          : undefined,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        creditContainer: document.createElement('div'),
      });

      viewerRef.current = viewer;
      window._gravionViewer = viewer;

      // 4. Click handler
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((e: { position: unknown }) => {
        const picked = viewer.scene.pick(e.position);
        if (Cesium.defined(picked) && picked.id) {
          const ent = picked.id;
          if (ent.gravionData) {
            // Could show a popup — for now log to console
            console.log('GRAVION entity selected:', ent.gravionData);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      setReady(true);
      setStatus('');

      // 5. Start polling live data
      pollFlights(viewer, Cesium, () => destroyed);
      pollShips(viewer, Cesium, () => destroyed);
    }

    init().catch((e) => {
      if (!destroyed) setStatus(`Error: ${String(e)}`);
    });

    return () => {
      destroyed = true;
      if (viewerRef.current) {
        (viewerRef.current as { destroy(): void }).destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  async function pollFlights(viewer: unknown, Cesium: unknown, isDestroyed: () => boolean) {
    const C = Cesium as typeof window.Cesium;
    const v = viewer as typeof window.Cesium.Viewer.prototype;
    const flightIds = new Set<string>();

    const update = async () => {
      if (isDestroyed()) return;
      try {
        const res = await fetch(`${API_BASE}/api/flights/snapshot`);
        if (!res.ok) return;
        const data = await res.json() as { states?: unknown[][] };
        if (!data.states) return;

        // Remove old
        flightIds.forEach((id) => {
          const e = v.entities.getById(id);
          if (e) v.entities.remove(e);
        });
        flightIds.clear();

        const states = data.states.slice(0, 3000);
        states.forEach((s: unknown[]) => {
          const lon = Number(s[5]);
          const lat = Number(s[6]);
          if (!lon || !lat) return;
          const icao = String(s[0] || '');
          const callsign = String(s[1] || '').trim();
          const alt = Math.max(Number(s[7] || 1000), 100);
          const hdg = Number(s[10] || 0);
          const id = `ac-${icao}`;
          v.entities.add({
            id,
            position: C.Cartesian3.fromDegrees(lon, lat, alt),
            billboard: {
              image: '/aircraft.svg',
              width: 18, height: 18,
              color: C.Color.fromCssColorString('#00e5ff'),
              rotation: C.Math.toRadians(hdg),
              scaleByDistance: new C.NearFarScalar(1e4, 1.5, 2e7, 0.3),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            label: {
              text: callsign || icao,
              font: '10px monospace',
              fillColor: C.Color.fromCssColorString('#00e5ff'),
              outlineColor: C.Color.BLACK,
              outlineWidth: 2,
              style: C.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new C.Cartesian2(0, -20),
              scaleByDistance: new C.NearFarScalar(1e5, 1.0, 5e6, 0.0),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            gravionData: { type: 'aircraft', icao, callsign, alt, hdg },
          } as unknown as object);
          flightIds.add(id);
        });
        setFlightCount(states.filter((s: unknown[]) => s[5] && s[6]).length);
      } catch { /* ignore */ }

      if (!isDestroyed()) setTimeout(update, 8000);
    };
    update();
  }

  async function pollShips(viewer: unknown, Cesium: unknown, isDestroyed: () => boolean) {
    const C = Cesium as typeof window.Cesium;
    const v = viewer as typeof window.Cesium.Viewer.prototype;
    const shipIds = new Set<string>();

    const update = async () => {
      if (isDestroyed()) return;
      try {
        const res = await fetch(`${API_BASE}/api/maritime/snapshot`);
        if (!res.ok) return;
        const data = await res.json() as { vessels?: Array<{ mmsi: number; name: string; lat: number; lon: number; cog: number; heading: number; sog: number }> };
        const ships = data.vessels || [];

        shipIds.forEach((id) => {
          const e = v.entities.getById(id);
          if (e) v.entities.remove(e);
        });
        shipIds.clear();

        ships.slice(0, 2000).forEach((s) => {
          if (!s.lat || !s.lon) return;
          const id = `ship-${s.mmsi}`;
          v.entities.add({
            id,
            position: C.Cartesian3.fromDegrees(s.lon, s.lat, 10),
            billboard: {
              image: '/flight.svg',
              width: 16, height: 16,
              color: C.Color.fromCssColorString('#fbbf24'),
              rotation: C.Math.toRadians(s.heading || s.cog || 0),
              scaleByDistance: new C.NearFarScalar(1e4, 1.5, 2e7, 0.3),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            label: {
              text: s.name || String(s.mmsi),
              font: '9px monospace',
              fillColor: C.Color.fromCssColorString('#fbbf24'),
              outlineColor: C.Color.BLACK,
              outlineWidth: 2,
              style: C.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new C.Cartesian2(0, -18),
              scaleByDistance: new C.NearFarScalar(1e5, 1.0, 5e6, 0.0),
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            gravionData: { type: 'vessel', mmsi: s.mmsi, name: s.name, speed: s.sog },
          } as unknown as object);
          shipIds.add(id);
        });
        setShipCount(ships.length);
      } catch { /* ignore */ }

      if (!isDestroyed()) setTimeout(update, 30000);
    };
    update();
  }

  const SAT_LAYERS = [
    { id: 'modis', name: 'MODIS Terra', url: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${yesterday()}/250m/{TileMatrix}/{TileRow}/{TileCol}.jpg` },
    { id: 'sentinel2', name: 'Sentinel-2', url: 'https://tiles.maps.eox.at/wms?service=WMS&request=GetMap&version=1.1.1&layers=s2cloudless-2023&styles=&format=image/jpeg&transparent=false&width=256&height=256&srs=EPSG:4326&bbox={westDegrees},{southDegrees},{eastDegrees},{northDegrees}' },
    { id: 'nexrad', name: 'NEXRAD Radar', url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png' },
    { id: 'firms', name: 'FIRMS Fire', url: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/DEMO_KEY/VIIRS_SNPP_NRT/world/1' },
  ];

  const toggleLayer = (layerId: string) => {
    if (!viewerRef.current || !window.Cesium) return;
    const C = window.Cesium;
    const v = viewerRef.current as typeof window.Cesium.Viewer.prototype;

    if (activeLayers.has(layerId)) {
      const layer = layerRefs.current.get(layerId);
      if (layer) {
        v.imageryLayers.remove(layer, true);
        layerRefs.current.delete(layerId);
      }
      setActiveLayers((p) => { const n = new Set(p); n.delete(layerId); return n; });
    } else {
      const sat = SAT_LAYERS.find((l) => l.id === layerId);
      if (!sat) return;
      let provider;
      if (layerId === 'modis') {
        provider = new C.WebMapTileServiceImageryProvider({
          url: 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/{Layer}/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
          layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
          style: 'default',
          format: 'image/jpeg',
          tileMatrixSetID: '250m',
          times: new C.TimeIntervalCollection([
            new C.TimeInterval({ start: C.JulianDate.fromIso8601(yesterday()), stop: C.JulianDate.now() }),
          ]),
          maximumLevel: 5,
        });
      } else {
        provider = new C.UrlTemplateImageryProvider({ url: sat.url, credit: sat.name });
      }
      const cesiumLayer = v.imageryLayers.addImageryProvider(provider);
      cesiumLayer.alpha = 0.8;
      layerRefs.current.set(layerId, cesiumLayer);
      setActiveLayers((p) => new Set([...p, layerId]));
    }
  };

  return (
    <div className="w-full h-full relative bg-black">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading/error overlay */}
      {status && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20 pointer-events-none">
          <div className="text-cyan-400 font-mono text-xl font-bold tracking-[0.3em] mb-3">GRAVION</div>
          <div className="text-gray-400 font-mono text-sm animate-pulse">{status}</div>
          {status.includes('Error') && (
            <div className="text-gray-600 font-mono text-xs mt-3 max-w-sm text-center">
              Check network connection — CesiumJS loads from CDN on first use
            </div>
          )}
        </div>
      )}

      {/* Control panel */}
      {ready && (
        <div className="absolute top-3 left-3 z-10 bg-black/85 border border-cyan-900 font-mono text-xs w-52 rounded">
          {/* Live counts */}
          <div className="p-2 border-b border-cyan-900">
            <div className="text-cyan-400 font-bold tracking-widest text-xs mb-1.5">◈ LIVE TRACKS</div>
            <div className="flex justify-between text-gray-400 mb-0.5">
              <span>✈ Aircraft</span><span className="text-cyan-300 font-bold">{flightCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>⛵ Vessels</span><span className="text-yellow-300 font-bold">{shipCount.toLocaleString()}</span>
            </div>
          </div>

          {/* Satellite layers */}
          <div className="p-2">
            <div className="text-cyan-400 font-bold tracking-widest text-xs mb-1.5">🛰 SATELLITE</div>
            {SAT_LAYERS.slice(0, 3).map((layer) => (
              <label key={layer.id} className="flex items-center gap-2 cursor-pointer py-0.5 hover:text-cyan-300 transition-colors">
                <input type="checkbox" checked={activeLayers.has(layer.id)}
                  onChange={() => toggleLayer(layer.id)} className="accent-cyan-500" />
                <span className={activeLayers.has(layer.id) ? 'text-cyan-300' : 'text-gray-500'}>{layer.name}</span>
              </label>
            ))}
          </div>

          {/* Legend */}
          <div className="p-2 border-t border-cyan-900 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
              <span className="text-gray-500">ADS-B Aircraft (8s refresh)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
              <span className="text-gray-500">AIS Vessels (30s refresh)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
