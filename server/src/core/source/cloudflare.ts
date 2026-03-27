import 'dotenv/config';

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';
const CACHE_TTL = 15 * 60 * 1000; // 15 mins

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queryCache = new Map<string, { data: any; expiresAt: number }>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchCloudflareRadar(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const token = process.env.CLOUDFLARE_RADAR_TOKEN;

  const searchParams = new URLSearchParams(params);
  searchParams.set('format', 'json');
  // Cloudflare Radar requires either dateRange or start+end
  if (!searchParams.has('dateRange') && !searchParams.has('start')) {
    searchParams.set('dateRange', '7d');
  }
  const cacheKey = `${endpoint}?${searchParams.toString()}`;

  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  // No token — return graceful empty response instead of throwing
  if (!token || token === 'your_cloudflare_token_here') {
    console.warn('[Cloudflare] No API token set — returning empty data. Get a free token at https://dash.cloudflare.com');
    return { top_0: [], summary_0: { total: 0 }, meta: { dateRange: [] }, noToken: true };
  }

  try {
    const resp = await fetch(`${CLOUDFLARE_API_URL}${endpoint}?${searchParams.toString()}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.warn(`[Cloudflare] API error ${resp.status}: ${body.slice(0, 200)}`);
      // Return empty rather than throw — so the UI shows empty state not error
      return { top_0: [], summary_0: { total: 0 }, meta: { dateRange: [] }, apiError: resp.status };
    }

    const data = await resp.json() as { success: boolean; result: unknown; errors: unknown };
    if (!data.success) {
      console.warn('[Cloudflare] API returned failure:', data.errors);
      return { top_0: [], apiError: 'failure' };
    }

    queryCache.set(cacheKey, { data: data.result, expiresAt: Date.now() + CACHE_TTL });
    return data.result;
  } catch (err: unknown) {
    console.error(`[Cloudflare] fetch error for ${endpoint}:`, err);
    if (cached?.data) return cached.data; // stale fallback
    return { top_0: [], summary_0: { total: 0 }, meta: { dateRange: [] }, fetchError: String(err) };
  }
}
