/**
 * GRAVION Fusion Intelligence API
 * Handles entity resolution, graph queries, and AI-powered SITREP with context fusion
 */
import { Router, Request, Response } from 'express';

const router = Router();

const OLLAMA_URL = () => process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = () => process.env.OLLAMA_MODEL || 'llama3';
const API_BASE = `http://localhost:${process.env.PORT || 3001}`;

// ─── Helper: fetch with timeout ───────────────────────────────────────────────
async function fetchJSON(url: string, opts?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10000), ...opts });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Helper: gather live context ─────────────────────────────────────────────
async function gatherLiveContext(): Promise<Record<string, unknown>> {
  const ctx: Record<string, unknown> = {};

  // Flights snapshot
  try {
    const flights = await fetchJSON(`${API_BASE}/api/flights/snapshot`) as { states?: unknown[][] };
    ctx.flight_count = flights.states?.length ?? 0;
    ctx.sample_flights = (flights.states || []).slice(0, 5).map((s: unknown[]) => ({
      icao: s[0], callsign: String(s[1] || '').trim(),
      lat: s[6], lon: s[5], alt: s[7], speed: s[9],
    }));
  } catch { ctx.flights = 'unavailable'; }

  // Maritime vessels
  try {
    const vessels = await fetchJSON(`${API_BASE}/api/maritime/vessels`) as unknown[];
    ctx.vessel_count = Array.isArray(vessels) ? vessels.length : 0;
    ctx.sample_vessels = Array.isArray(vessels) ? vessels.slice(0, 5) : [];
  } catch { ctx.vessels = 'unavailable'; }

  // Traccar devices
  try {
    const devices = await fetchJSON(`${API_BASE}/api/traccar/devices`) as unknown[];
    const positions = await fetchJSON(`${API_BASE}/api/traccar/positions`) as unknown[];
    ctx.tracked_devices = Array.isArray(devices) ? devices.length : 0;
    ctx.device_positions = Array.isArray(positions) ? positions.length : 0;
  } catch { ctx.traccar = 'unavailable'; }

  // GPS jamming
  try {
    const jamming = await fetchJSON(`${API_BASE}/api/monitor/gps-jamming`) as unknown;
    ctx.gps_jamming = jamming;
  } catch { ctx.gps_jamming = 'unavailable'; }

  ctx.timestamp_utc = new Date().toUTCString();
  ctx.operator = 'GRAVION FUSION ENGINE v1.0';

  return ctx;
}

// ─── POST /api/fusion/sitrep ───────────────────────────────────────────────────
// Generate a full SITREP with live fused context
router.post('/sitrep', async (req: Request, res: Response) => {
  const { query, include_live_data = true } = req.body as {
    query?: string;
    include_live_data?: boolean;
  };

  const prompt = query || 'Generate a comprehensive current situation report covering all active tracks, threats, and notable activity.';

  let context: Record<string, unknown> = {};
  if (include_live_data) {
    context = await gatherLiveContext();
  }

  const systemPrompt = `You are GRAVION, an autonomous military intelligence fusion AI equivalent to Palantir Gotham.
You have access to real-time intelligence feeds including:
- Global ADS-B aircraft tracking (${context.flight_count ?? '?'} active tracks)
- Global AIS maritime vessel tracking (${context.vessel_count ?? '?'} vessels)
- GPS device tracking via Traccar (${context.tracked_devices ?? 0} devices)
- GPS jamming detection data
- Cyber threat intelligence feeds

Produce intelligence assessments in a structured military SITREP format:
1. SITUATION OVERVIEW
2. AIR PICTURE (notable aircraft activity)
3. MARITIME PICTURE (notable vessel activity)
4. GROUND/DEVICE TRACKING
5. THREAT ASSESSMENT
6. RECOMMENDED ACTIONS

Be specific, use real data from context, use military terminology. Keep it concise but actionable.`;

  const userMessage = Object.keys(context).length > 0
    ? `LIVE INTEL CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nINTEL QUERY: ${prompt}`
    : prompt;

  try {
    const response = await fetch(`${OLLAMA_URL()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL(),
        prompt: userMessage,
        system: systemPrompt,
        stream: false,
        options: { temperature: 0.2, num_predict: 800 },
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      return res.status(502).json({
        error: 'Ollama AI agent unavailable',
        hint: 'Run: docker exec gravion-ollama ollama pull llama3',
        context_gathered: Object.keys(context),
      });
    }

    const data = await response.json() as { response: string; done: boolean };
    return res.json({
      sitrep: data.response,
      model: OLLAMA_MODEL(),
      context_sources: Object.keys(context),
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return res.status(502).json({
      error: 'AI agent timeout or unavailable',
      detail: String(err),
      hint: 'Ensure Ollama is running and a model is pulled',
    });
  }
});

// ─── POST /api/fusion/query ───────────────────────────────────────────────────
// Natural language query with live data context
router.post('/query', async (req: Request, res: Response) => {
  const { question } = req.body as { question?: string };
  if (!question) return res.status(400).json({ error: 'question required' });

  const context = await gatherLiveContext();

  const systemPrompt = `You are GRAVION intelligence fusion AI. Answer questions about live operational data concisely and precisely. Use only the data provided in context. If data is unavailable, say so clearly.`;

  try {
    const response = await fetch(`${OLLAMA_URL()}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL(),
        prompt: `LIVE DATA:\n${JSON.stringify(context, null, 2)}\n\nQUESTION: ${question}`,
        system: systemPrompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 400 },
      }),
      signal: AbortSignal.timeout(90000),
    });

    if (!response.ok) return res.status(502).json({ error: 'Ollama unavailable' });
    const data = await response.json() as { response: string };
    res.json({ answer: data.response, context_sources: Object.keys(context), timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    res.status(502).json({ error: String(err) });
  }
});

// ─── GET /api/fusion/context ──────────────────────────────────────────────────
// Return current live fused context without AI processing
router.get('/context', async (_req: Request, res: Response) => {
  const context = await gatherLiveContext();
  res.json(context);
});

// ─── GET /api/fusion/status ───────────────────────────────────────────────────
router.get('/status', async (_req: Request, res: Response) => {
  const status: Record<string, unknown> = {};

  // Check Ollama
  try {
    const r = await fetch(`${OLLAMA_URL()}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const d = await r.json() as { models: Array<{ name: string }> };
    status.ollama = { online: true, models: d.models?.map((m) => m.name) ?? [] };
  } catch { status.ollama = { online: false }; }

  // Check Neo4j
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const neo4j = require('neo4j-driver');
    const driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'gravion_neo4j_2024')
    );
    await driver.verifyConnectivity();
    await driver.close();
    status.neo4j = { connected: true };
  } catch { status.neo4j = { connected: false }; }

  // Check Traccar
  try {
    const r = await fetch(`${process.env.TRACCAR_URL || 'http://localhost:8082'}/api/server`, {
      headers: { Authorization: 'Basic ' + Buffer.from('admin:gravion_traccar_2024').toString('base64') },
      signal: AbortSignal.timeout(3000),
    });
    status.traccar = { online: r.ok };
  } catch { status.traccar = { online: false }; }

  res.json(status);
});

export default router;
