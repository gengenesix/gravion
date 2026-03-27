import { useEffect, useRef, useState, useCallback } from 'react';

// Dynamic Cesium import — loaded only when Globe tab is active
// This keeps the main bundle small and avoids SSR issues

interface Flight {
  icao: string;
  callsign: string;
  lat: number;
  lon: number;
  alt: number;
  heading: number;
  speed: number;
}

interface Ship {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  course: number;
  speed: number;
}

interface CesiumModule {
  Ion: { defaultAccessToken: string };
  Viewer: new (el: HTMLElement, opts: object) => CesiumViewer;
  Cartesian3: { fromDegrees: (lon: number, lat: number, alt?: number) => object };
  Color: { fromCssColorString: (s: string) => object; RED: object; CYAN: object; YELLOW: object; WHITE: object; fromAlpha: (c: object, a: number, r?: object) => object };
  HeadingPitchRange: new (h: number, p: number, r: number) => object;
  Math: { toRadians: (d: number) => number };
  Entity: new (opts: object) => object;
  JulianDate: { now: () => object };
  ClockRange: { LOOP_STOP: number };
  ScreenSpaceEventType: { LEFT_CLICK: number };
  ScreenSpaceEventHandler: new (c: object) => { setInputAction: (fn: (e: object) => void, t: number) => void };
  defined: (v: unknown) => boolean;
  BillboardGraphics: new (opts: object) => object;
  LabelGraphics: new (opts: object) => object;
  LabelStyle: { FILL: number };
  VerticalOrigin: { BOTTOM: number };
  HorizontalOrigin: { CENTER: number };
  NearFarScalar: new (n: number, ns: number, f: number, fs: number) => object;
  ImageryLayer: new (provider: object, opts?: object) => object;
  WebMapTileServiceImageryProvider: new (opts: object) => object;
  UrlTemplateImageryProvider: new (opts: object) => object;
  Rectangle: { fromDegrees: (w: number, s: number, e: number, n: number) => object };
}

interface CesiumViewer {
  entities: {
    add: (e: object) => CesiumEntity;
    remove: (e: CesiumEntity) => void;
    removeAll: () => void;
    getById: (id: string) => CesiumEntity | undefined;
  };
  imageryLayers: {
    addImageryProvider: (p: object, index?: number) => CesiumImageryLayer;
    remove: (l: CesiumImageryLayer, destroy?: boolean) => void;
    get: (index: number) => CesiumImageryLayer;
    length: number;
  };
  scene: { canvas: HTMLCanvasElement; globe: object };
  camera: {
    flyTo: (opts: object) => void;
    lookAt: (target: object, offset: object) => void;
    setView: (opts: object) => void;
  };
  destroy: () => void;
  clock: { currentTime: object };
  screenSpaceEventHandler: object;
}

interface CesiumEntity {
  id: string;
  position?: object;
  billboard?: object;
  label?: object;
}

interface CesiumImageryLayer {
  alpha: number;
  show: boolean;
}

const CESIUM_ION_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN as string || '';
const API_BASE = import.meta.env.VITE_API_URL as string || '';

// Yesterday YYYY-MM-DD for GIBS
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const SAT_LAYERS = [
  {
    id: 'modis-terra',
    name: 'MODIS Terra',
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${yesterday()}/250m/{TileMatrix}/{TileRow}/{TileCol}.jpg`,
    type: 'wmts' as const,
  },
  {
    id: 'sentinel2',
    name: 'Sentinel-2',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg',
    type: 'url' as const,
  },
  {
    id: 'firms-fire',
    name: 'FIRMS Fire',
    url: 'https://firms.modaps.eosdis.nasa.gov/api/map_service/ws/fire/?source=VIIRS_SNPP_NRT&date={yesterday}&area_km2=1000&key=DEMO_KEY',
    type: 'url' as const,
  },
  {
    id: 'nexrad',
    name: 'NEXRAD Radar',
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
    type: 'url' as const,
  },
];

export function GlobePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const satLayerRefs = useRef<Map<string, CesiumImageryLayer>>(new Map());
  const flightEntityIds = useRef<Set<string>>(new Set());
  const shipEntityIds = useRef<Set<string>>(new Set());

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSatLayers, setActiveSatLayers] = useState<Set<string>>(new Set());
  const [flightCount, setFlightCount] = useState(0);
  const [shipCount, setShipCount] = useState(0);
  const [selected, setSelected] = useState<{ type: string; data: Record<string, unknown> } | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  // Load Cesium dynamically
  useEffect(() => {
    if (!containerRef.current) return;

    let destroyed = false;

    (async () => {
      try {
        const Cesium = await import('cesium') as unknown as CesiumModule;
        // Cesium widgets CSS — import path varies by version, try both
        try { await import('cesium/Build/Cesium/Widgets/widgets.css'); } catch {
          try { await import('cesium/Source/Widgets/widgets.css'); } catch { /* css not critical */ }
        }

        if (destroyed) return;
        cesiumRef.current = Cesium;

        Cesium.Ion.defaultAccessToken = CESIUM_ION_TOKEN;

        const viewer = new Cesium.Viewer(containerRef.current!, {
          terrainProvider: undefined,
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
          creditContainer: document.createElement('div'), // hide credits
        });

        viewerRef.current = viewer;

        // Click handler
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement: object) => {
          const mv = movement as { position: object };
          const picked = (viewer as unknown as { scene: { pick: (p: object) => unknown } }).scene.pick(mv.position);
          if (Cesium.defined(picked)) {
            const entity = (picked as { id?: CesiumEntity }).id;
            if (entity?.id) {
              const id = entity.id;
              if (id.startsWith('flight-')) {
                const icao = id.replace('flight-', '');
                setSelected({ type: 'flight', data: { icao } });
              } else if (id.startsWith('ship-')) {
                const mmsi = id.replace('ship-', '');
                setSelected({ type: 'ship', data: { mmsi } });
              }
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        setLoaded(true);
      } catch (e) {
        if (!destroyed) setError(String(e));
      }
    })();

    return () => {
      destroyed = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  // Fetch and plot flights
  const updateFlights = useCallback(async () => {
    if (!viewerRef.current || !cesiumRef.current) return;
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;

    try {
      const res = await fetch(`${API_BASE}/api/flights/snapshot`);
      if (!res.ok) return;
      const data = await res.json() as { states?: unknown[][] };
      if (!data.states) return;

      // Remove old flight entities
      flightEntityIds.current.forEach((id) => {
        const e = viewer.entities.getById(id);
        if (e) viewer.entities.remove(e);
      });
      flightEntityIds.current.clear();

      const flights: Flight[] = (data.states || [])
        .filter((s: unknown[]) => s[5] != null && s[6] != null)
        .slice(0, 2000)
        .map((s: unknown[]) => ({
          icao: String(s[0] || ''),
          callsign: String(s[1] || '').trim(),
          lat: Number(s[6]),
          lon: Number(s[5]),
          alt: Number(s[7] || 0),
          heading: Number(s[10] || 0),
          speed: Number(s[9] || 0),
        }));

      flights.forEach((f) => {
        if (!f.lat || !f.lon) return;
        const id = `flight-${f.icao}`;
        viewer.entities.add({
          id,
          position: Cesium.Cartesian3.fromDegrees(f.lon, f.lat, Math.max(f.alt, 100)),
          billboard: {
            image: '/aircraft.svg',
            width: 16,
            height: 16,
            color: Cesium.Color.fromCssColorString('#00e5ff'),
            rotation: Cesium.Math.toRadians(f.heading),
            scaleByDistance: new Cesium.NearFarScalar(1e4, 1.5, 1e7, 0.5),
          },
          label: {
            text: f.callsign || f.icao,
            font: '10px monospace',
            fillColor: Cesium.Color.fromCssColorString('#00e5ff'),
            outlineColor: Cesium.Color.fromCssColorString('#000000'),
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            pixelOffset: { x: 0, y: -20 },
            scaleByDistance: new Cesium.NearFarScalar(1e4, 1.0, 1e7, 0.0),
          },
        } as object);
        flightEntityIds.current.add(id);
      });

      setFlightCount(flights.length);
    } catch {
      // silently fail — network issues
    }
  }, []);

  // Fetch and plot ships
  const updateShips = useCallback(async () => {
    if (!viewerRef.current || !cesiumRef.current) return;
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;

    try {
      const res = await fetch(`${API_BASE}/api/maritime/vessels`);
      if (!res.ok) return;
      const ships = await res.json() as Ship[];
      if (!Array.isArray(ships)) return;

      shipEntityIds.current.forEach((id) => {
        const e = viewer.entities.getById(id);
        if (e) viewer.entities.remove(e);
      });
      shipEntityIds.current.clear();

      ships.slice(0, 1000).forEach((s) => {
        if (!s.lat || !s.lon) return;
        const id = `ship-${s.mmsi}`;
        viewer.entities.add({
          id,
          position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, 10),
          billboard: {
            image: '/flight.svg',
            width: 14,
            height: 14,
            color: Cesium.Color.fromCssColorString('#fbbf24'),
            rotation: Cesium.Math.toRadians(s.course || 0),
            scaleByDistance: new Cesium.NearFarScalar(1e4, 1.5, 1e7, 0.5),
          },
          label: {
            text: s.name || String(s.mmsi),
            font: '9px monospace',
            fillColor: Cesium.Color.fromCssColorString('#fbbf24'),
            outlineColor: Cesium.Color.fromCssColorString('#000000'),
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            pixelOffset: { x: 0, y: -18 },
            scaleByDistance: new Cesium.NearFarScalar(1e4, 1.0, 1e7, 0.0),
          },
        } as object);
        shipEntityIds.current.add(id);
      });

      setShipCount(ships.length);
    } catch {
      // silently fail
    }
  }, []);

  // Poll live data when viewer is ready
  useEffect(() => {
    if (!loaded) return;
    updateFlights();
    updateShips();
    const fi = setInterval(updateFlights, 8000);
    const si = setInterval(updateShips, 30000);
    return () => { clearInterval(fi); clearInterval(si); };
  }, [loaded, updateFlights, updateShips]);

  // Toggle satellite imagery layers
  const toggleSatLayer = useCallback((layerId: string) => {
    if (!viewerRef.current || !cesiumRef.current) return;
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;

    setActiveSatLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        // Remove layer
        const layer = satLayerRefs.current.get(layerId);
        if (layer) {
          viewer.imageryLayers.remove(layer, true);
          satLayerRefs.current.delete(layerId);
        }
        next.delete(layerId);
      } else {
        // Add layer
        const sat = SAT_LAYERS.find((l) => l.id === layerId);
        if (!sat) return prev;
        let provider;
        if (sat.type === 'wmts') {
          provider = new Cesium.WebMapTileServiceImageryProvider({
            url: sat.url,
            layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
            style: 'default',
            format: 'image/jpeg',
            tileMatrixSetID: '250m',
            maximumLevel: 5,
          });
        } else {
          provider = new Cesium.UrlTemplateImageryProvider({ url: sat.url });
        }
        const cesiumLayer = viewer.imageryLayers.addImageryProvider(provider);
        cesiumLayer.alpha = 0.85;
        satLayerRefs.current.set(layerId, cesiumLayer);
        next.add(layerId);
      }
      return next;
    });
  }, []);

  return (
    <div className="w-full h-full relative bg-black">
      {/* Cesium container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
          <div className="text-cyan-400 font-mono text-lg font-bold tracking-widest animate-pulse mb-2">
            GRAVION 3D GLOBE
          </div>
          <div className="text-gray-500 font-mono text-xs">Initializing CesiumJS...</div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
          <div className="text-red-400 font-mono text-sm font-bold mb-2">⚠ Globe Error</div>
          <div className="text-gray-500 font-mono text-xs max-w-md text-center">{error}</div>
          <div className="text-gray-600 font-mono text-xs mt-2">Check VITE_CESIUM_ION_TOKEN in client/.env</div>
        </div>
      )}

      {/* Control Panel */}
      {loaded && (
        <>
          {/* Toggle panel button */}
          <button
            onClick={() => setShowPanel((p) => !p)}
            className="absolute top-3 left-3 z-10 bg-black/80 border border-cyan-800 text-cyan-400 font-mono text-xs px-2 py-1 hover:bg-cyan-900/30 transition-colors"
          >
            {showPanel ? '◀ HIDE' : '▶ PANEL'}
          </button>

          {showPanel && (
            <div className="absolute top-10 left-3 z-10 w-48 bg-black/90 border border-cyan-900 font-mono text-xs space-y-2 p-3">
              {/* Live data status */}
              <div className="border-b border-cyan-900 pb-2">
                <div className="text-cyan-400 font-bold tracking-widest text-xs mb-1">◈ LIVE FEEDS</div>
                <div className="flex justify-between text-gray-400">
                  <span>✈ Aircraft</span>
                  <span className="text-cyan-300">{flightCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>⛵ Vessels</span>
                  <span className="text-yellow-300">{shipCount.toLocaleString()}</span>
                </div>
              </div>

              {/* Satellite layers */}
              <div>
                <div className="text-cyan-400 font-bold tracking-widest text-xs mb-1">🛰 SATELLITE</div>
                {SAT_LAYERS.map((layer) => (
                  <label key={layer.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={activeSatLayers.has(layer.id)}
                      onChange={() => toggleSatLayer(layer.id)}
                      className="accent-cyan-500"
                    />
                    <span className={activeSatLayers.has(layer.id) ? 'text-cyan-300' : 'text-gray-500'}>
                      {layer.name}
                    </span>
                  </label>
                ))}
              </div>

              {/* Legend */}
              <div className="border-t border-cyan-900 pt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-500">ADS-B Aircraft</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-gray-500">AIS Vessels</span>
                </div>
              </div>
            </div>
          )}

          {/* Selected entity popup */}
          {selected && (
            <div className="absolute bottom-6 left-3 z-10 bg-black/90 border border-cyan-700 font-mono text-xs p-3 w-52">
              <div className="flex justify-between mb-2">
                <span className="text-cyan-400 font-bold">
                  {selected.type === 'flight' ? '✈ AIRCRAFT' : '⛵ VESSEL'}
                </span>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              {Object.entries(selected.data).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-gray-500 uppercase">{k}</span>
                  <span className="text-cyan-300">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
