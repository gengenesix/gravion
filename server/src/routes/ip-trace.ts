import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/ip-trace?ip=<IP>
router.get('/', async (req: Request, res: Response) => {
  const ip = req.query.ip as string;

  if (!ip) {
    return res.status(400).json({ error: 'ip query parameter is required' });
  }

  // Basic IP validation (IPv4 and IPv6)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return res.status(400).json({ error: 'Invalid IP address format' });
  }

  try {
    const response = await fetch(`https://ipinfo.io/${ip}/json`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch IP information' });
    }

    const data = await response.json() as Record<string, string>;

    // Parse loc field "lat,lon" into separate numbers
    let lat: number | null = null;
    let lon: number | null = null;
    if (data.loc && typeof data.loc === 'string') {
      const parts = data.loc.split(',');
      if (parts.length === 2) {
        lat = parseFloat(parts[0]);
        lon = parseFloat(parts[1]);
      }
    }

    return res.json({
      ip: data.ip ?? ip,
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country ?? null,
      org: data.org ?? null,
      loc: data.loc ?? null,
      lat,
      lon,
      timezone: data.timezone ?? null,
      postal: data.postal ?? null,
      hostname: data.hostname ?? null,
    });
  } catch (err) {
    console.error('[ip-trace] Error:', err);
    return res.status(502).json({ error: 'IP geolocation service unavailable' });
  }
});

export default router;
