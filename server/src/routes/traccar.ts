import { Router, Request, Response } from 'express';

const router = Router();

const traccarUrl = () => process.env.TRACCAR_URL || 'http://localhost:8082';
const traccarAuth = () => {
  const u = process.env.TRACCAR_USER || 'admin';
  const p = process.env.TRACCAR_PASSWORD || 'admin';
  return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
};

async function traccarFetch(path: string): Promise<unknown> {
  const r = await fetch(`${traccarUrl()}/api${path}`, {
    headers: { Authorization: traccarAuth(), Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Traccar ${r.status}: ${await r.text()}`);
  return r.json();
}

// GET /api/traccar/devices
router.get('/devices', async (_req: Request, res: Response) => {
  try {
    res.json(await traccarFetch('/devices'));
  } catch (err: unknown) {
    res.status(502).json({ error: 'Traccar unavailable', detail: String(err) });
  }
});

// GET /api/traccar/positions
router.get('/positions', async (_req: Request, res: Response) => {
  try {
    res.json(await traccarFetch('/positions'));
  } catch (err: unknown) {
    res.status(502).json({ error: 'Traccar unavailable', detail: String(err) });
  }
});

// GET /api/traccar/positions/:deviceId
router.get('/positions/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    res.json(await traccarFetch(`/positions?deviceId=${deviceId}`));
  } catch (err: unknown) {
    res.status(502).json({ error: 'Traccar unavailable', detail: String(err) });
  }
});

// GET /api/traccar/status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const server = await traccarFetch('/server') as Record<string, unknown>;
    res.json({ online: true, version: server.version ?? 'unknown' });
  } catch {
    res.json({ online: false });
  }
});

export default router;
