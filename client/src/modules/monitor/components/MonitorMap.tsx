import { useRef, useEffect, useCallback } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapRef } from 'react-map-gl/maplibre';
import type { ProjectionSpecification } from 'maplibre-gl';
import { useThemeStore } from '../../../ui/theme/theme.store';
import { SATELLITE_STYLE, DARK_STYLE } from '../../../lib/mapStyles';
import { useOsintStore } from '../../osint/osint.store';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
};

export function MonitorMap() {
  const mapRef = useRef<MapRef>(null);
  const { mapLayer, mapProjection } = useThemeStore();
  const { setCurrentRegion } = useOsintStore();

  const activeMapStyle = mapLayer === 'satellite' ? SATELLITE_STYLE : DARK_STYLE;

  const onClick = useCallback(
    (e: import('maplibre-gl').MapMouseEvent) => {
      // Set OSINT region on click, just like FlightsMap
      setCurrentRegion(e.lngLat.lat, e.lngLat.lng);
    },
    [setCurrentRegion],
  );

  // Force map resize on mount to fix MapLibre zero-dimension rendering bug in flex/grid layouts
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="w-full h-full relative bg-black">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={activeMapStyle}
        styleDiffing={false}
        onClick={onClick}
        cursor="crosshair"
        projection={
          mapProjection === 'globe'
            ? ({ type: 'globe' } as ProjectionSpecification)
            : ({ type: 'mercator' } as ProjectionSpecification)
        }
        doubleClickZoom={mapProjection !== 'globe'}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass={true} visualizePitch={true} />
      </Map>
      <div className="absolute top-4 left-4 pointer-events-none z-10 tech-panel px-4 py-2 drop-shadow-[0_0_15px_rgba(0,229,255,0.2)]">
        <div className="flex items-center gap-3 text-sm font-mono font-bold tracking-[0.15em] text-intel-text-light">
          <span className="w-2 h-2 bg-intel-accent animate-pulse shadow-[0_0_10px_var(--color-intel-accent)]"></span>
          GLOBAL TACTICAL OVERVIEW
        </div>
      </div>
    </div>
  );
}
