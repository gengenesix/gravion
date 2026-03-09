import { useQuery } from '@tanstack/react-query';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AlertDescription {
  ar: string;
  en: string;
}

export interface GulfWatchAlert {
  id: string;
  emirateId: string;
  type: string;
  severity: string;
  description: AlertDescription;
  startedAt: string;
  expiresAt: string;
  expiredAt?: string;
  sourceCount: number;
}

export interface GulfWatchSummary {
  isActive: boolean;
  activeEmirateIds: string[];
  alerts: GulfWatchAlert[];
  totalActive: number;
  lastUpdated: string;
}

export function useGulfWatchAlerts() {
  return useQuery<GulfWatchSummary>({
    queryKey: ['gulf-watch-alerts'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/gulf-watch/alerts`);
      if (!res.ok) throw new Error('Failed to fetch GulfWatch alerts');
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
}

export function useEmiratesGeoJSON() {
  return useQuery({
    queryKey: ['gulf-watch-geojson'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/monitor/gulf-watch/geojson`);
      if (!res.ok) throw new Error('Failed to fetch emirates GeoJSON');
      return res.json();
    },
    staleTime: 3_600_000, // 1 hour — static geometry
    gcTime: 7_200_000,
  });
}
