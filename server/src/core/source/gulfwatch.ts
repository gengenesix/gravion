/**
 * GulfWatch — UAE alert data source
 * API base: https://gulfwatch-api.onrender.com/api
 * GeoJSON:  https://gulfwatch.ai/data/uae-emirates.geojson
 */

const BASE = 'https://gulfwatch-api.onrender.com/api';
const GEOJSON_URL = 'https://gulfwatch.ai/data/uae-emirates.geojson';
const TIMEOUT_MS = 10_000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AlertDescription {
  ar: string;
  en: string;
}

export interface GulfWatchAlert {
  id: string;
  emirateId: string;
  type: string; // 'air-raid' | 'security' | etc.
  severity: string; // 'warning' | 'watch' | etc.
  description: AlertDescription;
  startedAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  expiredAt?: string; // ISO 8601 — only present in history
  sourceCount: number;
}

export interface EmirateStatus {
  emirateId: string;
  activeAlerts: GulfWatchAlert[];
  status: string; // 'active' | 'clear'
}

export interface ActiveAlertsResponse {
  emirateStatuses: EmirateStatus[];
  lastUpdated: string;
}

export interface AlertHistoryResponse {
  alerts: GulfWatchAlert[];
  count: number;
}

export interface AlertSummary {
  isActive: boolean;
  activeEmirateIds: string[];
  alerts: GulfWatchAlert[];
  totalActive: number;
  lastUpdated: string;
}

// ── Internal fetch helper ─────────────────────────────────────────────────────

async function apiFetch<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'IntelMap/1.0' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch current active alerts per emirate.
 */
export async function fetchActiveAlerts(): Promise<ActiveAlertsResponse> {
  return apiFetch<ActiveAlertsResponse>(`${BASE}/alerts?country=uae`);
}

/**
 * Fetch recent alert history.
 * @param limit  Max records to return (default 50)
 * @param offset Pagination offset (default 0)
 */
export async function fetchAlertHistory(limit = 50, offset = 0): Promise<AlertHistoryResponse> {
  const params = new URLSearchParams({
    country: 'uae',
    limit: String(limit),
    offset: String(offset),
  });
  return apiFetch<AlertHistoryResponse>(`${BASE}/alerts/history?${params}`);
}

/**
 * Fetch the UAE emirates GeoJSON (MultiPolygon per emirate).
 * Feature properties: { id, name_en, name_ar }
 */
export async function fetchEmiratesGeoJSON(): Promise<unknown> {
  return apiFetch<unknown>(GEOJSON_URL);
}

/**
 * Summarise active alerts for dashboard consumption.
 */
export async function getAlertSummary(): Promise<AlertSummary> {
  const data = await fetchActiveAlerts().catch(
    (): ActiveAlertsResponse => ({ emirateStatuses: [], lastUpdated: new Date().toISOString() }),
  );

  const activeStatuses = data.emirateStatuses.filter((s) => s.activeAlerts.length > 0);
  const alerts = activeStatuses.flatMap((s) => s.activeAlerts);
  const activeEmirateIds = [...new Set(activeStatuses.map((s) => s.emirateId))];

  return {
    isActive: alerts.length > 0,
    activeEmirateIds,
    alerts,
    totalActive: alerts.length,
    lastUpdated: data.lastUpdated,
  };
}
