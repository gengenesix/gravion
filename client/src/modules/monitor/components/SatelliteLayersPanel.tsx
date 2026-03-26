import { useState } from 'react';

export interface SatelliteLayer {
  id: string;
  name: string;
  description: string;
  getTileUrl: (date?: string) => string;
  type: 'raster' | 'wms';
  opacity: number;
}

// Yesterday's date in YYYY-MM-DD for GIBS
function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export const SATELLITE_LAYERS: SatelliteLayer[] = [
  {
    id: 'gibs-modis-terra',
    name: 'MODIS Terra TrueColor',
    description: 'NASA GIBS — Near real-time optical imagery (~3h delay)',
    type: 'raster',
    opacity: 0.85,
    getTileUrl: (date) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date || yesterday()}/GoogleMapsCompatible/{z}/{y}/{x}.jpg`,
  },
  {
    id: 'sentinel2-cloudless',
    name: 'Sentinel-2 Cloudless',
    description: 'Copernicus — High-res optical mosaic (public, no auth)',
    type: 'raster',
    opacity: 0.9,
    getTileUrl: () =>
      'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg',
  },
  {
    id: 'nasa-firms-fire',
    name: 'FIRMS Active Fire',
    description: 'NASA VIIRS — Active fire/hotspot detections',
    type: 'raster',
    opacity: 0.8,
    getTileUrl: () =>
      'https://neo.gsfc.nasa.gov/wms/wms?service=WMS&version=1.3.0&request=GetMap&layers=MOD14A1_M_FIRE&crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true',
  },
  {
    id: 'noaa-weather-radar',
    name: 'NOAA Weather Radar',
    description: 'NEXRAD composite — Live precipitation radar',
    type: 'raster',
    opacity: 0.7,
    getTileUrl: () =>
      'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
  },
  {
    id: 'gibs-viirs-night',
    name: 'VIIRS Night Lights',
    description: 'NASA GIBS — Earth at night, activity indicator',
    type: 'raster',
    opacity: 0.9,
    getTileUrl: (date) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/${date || yesterday()}/GoogleMapsCompatible/{z}/{y}/{x}.jpg`,
  },
];

interface Props {
  activeLayers: Set<string>;
  onToggle: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  opacities: Record<string, number>;
}

export function SatelliteLayersPanel({ activeLayers, onToggle, onOpacityChange, opacities }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-gray-950 border border-blue-800 rounded-md text-xs font-mono">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-blue-400 hover:bg-gray-900 transition-colors"
      >
        <span className="font-bold tracking-widest">◈ SATELLITE LAYERS</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-blue-900">
          {SATELLITE_LAYERS.map((layer) => {
            const active = activeLayers.has(layer.id);
            const opacity = opacities[layer.id] ?? layer.opacity;
            return (
              <div key={layer.id} className="pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={layer.id}
                    checked={active}
                    onChange={() => onToggle(layer.id)}
                    className="accent-blue-500"
                  />
                  <label
                    htmlFor={layer.id}
                    className={`cursor-pointer ${active ? 'text-blue-300' : 'text-gray-500'}`}
                  >
                    {layer.name}
                  </label>
                </div>
                <div className="text-gray-600 ml-5 mb-1">{layer.description}</div>
                {active && (
                  <div className="ml-5 flex items-center gap-2">
                    <span className="text-gray-600">opacity</span>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={opacity}
                      onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
                      className="w-20 accent-blue-500"
                    />
                    <span className="text-blue-400">{Math.round(opacity * 100)}%</span>
                  </div>
                )}
              </div>
            );
          })}
          <div className="text-gray-700 pt-1 border-t border-gray-900">
            Sources: NASA GIBS · Copernicus EOX · NOAA/IEM · FIRMS
          </div>
        </div>
      )}
    </div>
  );
}
