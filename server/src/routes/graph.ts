import { Router, Request, Response } from 'express';

const router = Router();

// Lazy neo4j driver — avoids hard dependency at startup
let _driver: unknown = null;

async function getDriver(): Promise<{
  verifyConnectivity(): Promise<unknown>;
  session(): {
    run(q: string, p: unknown): Promise<{ records: unknown[] }>;
    close(): Promise<void>;
  };
} | null> {
  if (_driver) return _driver as ReturnType<typeof getDriver> extends Promise<infer T> ? T : never;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const neo4j = await import('neo4j-driver').catch(() => null) as any;
    if (!neo4j) return null;
    _driver = neo4j.default.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.default.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'gravion_neo4j_2024'
      ),
      { maxConnectionLifetime: 30000 }
    );
    return _driver as ReturnType<typeof getDriver> extends Promise<infer T> ? T : never;
  } catch {
    return null;
  }
}

// GET /api/graph/status
router.get('/status', async (_req: Request, res: Response) => {
  const d = await getDriver();
  if (!d) return res.json({ connected: false, reason: 'neo4j-driver not installed' });
  try {
    await d.verifyConnectivity();
    res.json({ connected: true });
  } catch (err: unknown) {
    res.json({ connected: false, reason: String(err) });
  }
});

// POST /api/graph/query  — body: { cypher, params? }
router.post('/query', async (req: Request, res: Response) => {
  const { cypher, params } = req.body as { cypher?: string; params?: unknown };
  if (!cypher) return res.status(400).json({ error: 'cypher query required' });

  const d = await getDriver();
  if (!d) return res.status(503).json({ error: 'Neo4j not available' });

  const session = d.session();
  try {
    const result = await session.run(cypher, params || {});
    const records = result.records.map((r: unknown) => {
      const rec = r as { keys: string[]; get(k: string): unknown };
      return Object.fromEntries(rec.keys.map((k) => [k, rec.get(k)]));
    });
    res.json({ records, count: records.length });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  } finally {
    await session.close();
  }
});

export default router;
