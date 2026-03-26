import { Router, Request, Response } from 'express';

const router = Router();

// POST /api/intel/sitrep
router.post('/sitrep', async (req: Request, res: Response) => {
  const { query, context } = req.body as { query?: string; context?: unknown };
  if (!query) return res.status(400).json({ error: 'query required' });

  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';

  const systemPrompt = `You are GRAVION, a military intelligence fusion AI assistant similar to Palantir Gotham.
You analyze live intelligence data including ADS-B aircraft tracks, AIS maritime vessels, GPS device locations,
cyber threat feeds, and satellite imagery. Respond in a concise military SITREP (Situation Report) format.
Be direct, factual, and actionable. Use military terminology. When asked about specific entities, provide tactical assessments.`;

  const userMessage = context
    ? `INTEL CONTEXT:\n${JSON.stringify(context, null, 2)}\n\nQUERY: ${query}`
    : query;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: userMessage,
        system: systemPrompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 512 },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Ollama unavailable', detail: err });
    }

    const data = (await response.json()) as { response: string; done: boolean };
    return res.json({
      sitrep: data.response,
      model,
      done: data.done,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: 'AI agent unavailable', detail: msg });
  }
});

// GET /api/intel/status
router.get('/status', async (_req: Request, res: Response) => {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  try {
    const r = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    const data = (await r.json()) as { models: Array<{ name: string }> };
    res.json({ online: true, models: data.models?.map((m) => m.name) ?? [] });
  } catch {
    res.json({ online: false, models: [] });
  }
});

export default router;
