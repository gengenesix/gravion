import { useState } from 'react';
import { SATELLITE_LAYERS } from '../SatelliteLayersPanel';

interface Props {
  activeLayers: Set<string>;
  onToggle: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  opacities: Record<string, number>;
}

export function SatelliteLayersWidget({ activeLayers, onToggle, onOpacityChange, opacities }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = activeLayers.size;

  return (
    <div className="bg-gray-900 border border-blue-800 rounded font-mono text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-blue-400 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>🛰</span>
          <span className="font-bold tracking-wider">SATELLITE</span>
          {activeCount > 0 && (
            <span className="bg-blue-700 text-white text-xs px-1.5 rounded-full">{activeCount}</span>
          )}
        </div>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-blue-900">
          {SATELLITE_LAYERS.map((layer) => {
            const active = activeLayers.has(layer.id);
            const opacity = opacities[layer.id] ?? layer.opacity;
            return (
              <div key={layer.id} className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => onToggle(layer.id)}
                    className="accent-blue-500"
                  />
                  <span className={active ? 'text-blue-300' : 'text-gray-500'}>{layer.name}</span>
                </label>
                {active && (
                  <div className="ml-5 flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={opacity}
                      onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
                      className="w-16 accent-blue-500"
                    />
                    <span className="text-blue-400">{Math.round(opacity * 100)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
