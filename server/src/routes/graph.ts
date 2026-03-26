import { Router, Request, Response } from 'express';

const router = Router();

// We use `require` at runtime so the build doesn't need neo4j-driver as a dep.
// If neo4j-driver is not installed, the status endpoint reports disconnected.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _driver: any = null;

async function getDriver(): Promise<any> {
  if (_driver) return _driver;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const neo4j = require('neo4j-driver');
    _driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'gravion_neo4j_2024'
      ),
      { maxConnectionLifetime: 30000 }
    );
    return _driver;
  } catch {
    return null;
  }
}

// GET /api/graph/status
router.get('/status', async (_req: Request, res: Response) => {
  const d = await getDriver();
  if (!d) return res.json({ connected: false, reason: 'neo4j-driver not installed (run: npm install neo4j-driver in server/)' });
  try {
    await d.verifyConnectivity();
    res.json({ connected: true });
  } catch (err: unknown) {
    res.json({ connected: false, reason: String(err) });
  }
});

// POST /api/graph/query — body: { cypher, params? }
router.post('/query', async (req: Request, res: Response) => {
  const { cypher, params } = req.body as { cypher?: string; params?: unknown };
  if (!cypher) return res.status(400).json({ error: 'cypher query required' });

  const d = await getDriver();
  if (!d) return res.status(503).json({ error: 'Neo4j not available — neo4j-driver not installed' });

  const session = d.session();
  try {
    const result = await session.run(cypher, params || {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = result.records.map((r: any) =>
      Object.fromEntries(r.keys.map((k: string) => [k, r.get(k)]))
    );
    res.json({ records, count: records.length });
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  } finally {
    await session.close();
  }
});

export default router;
