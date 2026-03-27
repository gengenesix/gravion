/**
 * GRAVION OSINT Proxy
 * Proxies requests to SpiderFoot, OpenCTI, and other OSINT tools
 * Also feeds results into Neo4j via the entity loader
 */
import { Router, Request, Response } from 'express';

const router = Router();

const SPIDERFOOT_URL = () => process.env.SPIDERFOOT_URL || 'http://localhost:5001';
const OPENCTI_URL = () => process.env.OPENCTI_URL || 'http://localhost:8888';
const OPENCTI_TOKEN = () => process.env.OPENCTI_TOKEN || 'gravion-opencti-token-2024';

// ─── SpiderFoot ───────────────────────────────────────────────────────────────

// GET /api/osint/spiderfoot/status
router.get('/spiderfoot/status', async (_req: Request, res: Response) => {
  try {
    const r = await fetch(`${SPIDERFOOT_URL()}/ping`, { signal: AbortSignal.timeout(3000) });
    res.json({ online: r.ok, url: SPIDERFOOT_URL() });
  } catch {
    res.json({ online: false, url: SPIDERFOOT_URL() });
  }
});

// POST /api/osint/spiderfoot/scan — start a new SpiderFoot scan
// Body: { target: "8.8.8.8" or "domain.com", modules?: ["sfp_dnsresolve", ...] }
router.post('/spiderfoot/scan', async (req: Request, res: Response) => {
  const { target, modules } = req.body as { target?: string; modules?: string[] };
  if (!target) return res.status(400).json({ error: 'target required' });

  try {
    const form = new URLSearchParams();
    form.append('scanname', `GRAVION-${target}-${Date.now()}`);
    form.append('scantarget', target);
    form.append('usecase', 'Investigate'); // All modules
    if (modules?.length) {
      modules.forEach((m) => form.append('modulelist', m));
    }

    const r = await fetch(`${SPIDERFOOT_URL()}/startscan`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(10000),
    });

    const text = await r.text();
    // SpiderFoot returns scan ID in response
    const scanIdMatch = text.match(/"scanId":\s*"([^"]+)"/);
    const scanId = scanIdMatch?.[1] || text.slice(0, 50);
    res.json({ started: true, target, scanId, url: `${SPIDERFOOT_URL()}/scaninfo?id=${scanId}` });
  } catch (err: unknown) {
    res.status(502).json({ error: 'SpiderFoot unavailable', detail: String(err) });
  }
});

// GET /api/osint/spiderfoot/scans — list all scans
router.get('/spiderfoot/scans', async (_req: Request, res: Response) => {
  try {
    const r = await fetch(`${SPIDERFOOT_URL()}/scanlist`, { signal: AbortSignal.timeout(5000) });
    const data = await r.json();
    res.json(data);
  } catch (err: unknown) {
    res.status(502).json({ error: 'SpiderFoot unavailable', detail: String(err) });
  }
});

// GET /api/osint/spiderfoot/results/:scanId — get scan results
router.get('/spiderfoot/results/:scanId', async (req: Request, res: Response) => {
  const { scanId } = req.params;
  try {
    const r = await fetch(`${SPIDERFOOT_URL()}/scaneventresultsunique?id=${scanId}&eventType=ALL`,
      { signal: AbortSignal.timeout(10000) });
    const data = await r.json();
    res.json(data);
  } catch (err: unknown) {
    res.status(502).json({ error: 'SpiderFoot unavailable', detail: String(err) });
  }
});

// ─── OpenCTI ──────────────────────────────────────────────────────────────────

// GET /api/osint/opencti/status
router.get('/opencti/status', async (_req: Request, res: Response) => {
  try {
    const r = await fetch(`${OPENCTI_URL()}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENCTI_TOKEN()}` },
      body: JSON.stringify({ query: '{ about { version } }' }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await r.json() as { data?: { about?: { version?: string } } };
    res.json({ online: true, version: data.data?.about?.version });
  } catch {
    res.json({ online: false, url: OPENCTI_URL() });
  }
});

// POST /api/osint/opencti/search — search for indicators/threats
router.post('/opencti/search', async (req: Request, res: Response) => {
  const { query } = req.body as { query?: string };
  if (!query) return res.status(400).json({ error: 'query required' });

  const gqlQuery = `
    {
      stixCyberObservables(
        filters: { mode: and, filters: [{ key: "value", values: ["${query.replace(/"/g, '\\"')}"] }], filterGroups: [] }
        first: 20
      ) {
        edges {
          node {
            id
            entity_type
            observable_value
            created_at
          }
        }
      }
    }
  `;

  try {
    const r = await fetch(`${OPENCTI_URL()}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENCTI_TOKEN()}` },
      body: JSON.stringify({ query: gqlQuery }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await r.json();
    res.json(data);
  } catch (err: unknown) {
    res.status(502).json({ error: 'OpenCTI unavailable', detail: String(err) });
  }
});

// ─── Combined OSINT status ─────────────────────────────────────────────────────
router.get('/status', async (_req: Request, res: Response) => {
  const [sfRes, ocRes] = await Promise.allSettled([
    fetch(`${SPIDERFOOT_URL()}/ping`, { signal: AbortSignal.timeout(3000) }),
    fetch(`${OPENCTI_URL()}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENCTI_TOKEN()}` },
      body: JSON.stringify({ query: '{ about { version } }' }),
      signal: AbortSignal.timeout(3000),
    }),
  ]);

  res.json({
    spiderfoot: { online: sfRes.status === 'fulfilled' && sfRes.value.ok, url: `${SPIDERFOOT_URL()}` },
    opencti: { online: ocRes.status === 'fulfilled' && ocRes.value.ok, url: `${OPENCTI_URL()}` },
  });
});

export default router;
