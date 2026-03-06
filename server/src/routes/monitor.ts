import { Router } from 'express';
import * as gpsjam from '../core/source/gpsjam';

const router = Router();

/**
 * GET /api/monitor/gps-jamming
 * Fetch GPS interference data mapped to H3 hex cells
 *
 * Query Parameters:
 * - date: Optional date in YYYY-MM-DD format (default: latest)
 * - h3: Optional comma-separated list of H3 indices to filter
 * - minInterference: Optional minimum interference ratio (0-1)
 *
 * Response:
 * {
 *   date: string,
 *   suspect: boolean,
 *   totalCells: number,
 *   cells: [
 *     {
 *       h3: string,
 *       count_good_aircraft: number,
 *       count_bad_aircraft: number,
 *       interference_ratio: number
 *     }
 *   ]
 * }
 */
router.get('/gps-jamming', async (req, res) => {
  try {
    const { date, h3, minInterference } = req.query;

    // Parse query options
    const options: gpsjam.QueryOptions = {};

    if (date && typeof date === 'string') {
      options.date = date;
    }

    if (h3 && typeof h3 === 'string') {
      options.h3Indices = h3.split(',').map((s) => s.trim());
    }

    if (minInterference && typeof minInterference === 'string') {
      const val = parseFloat(minInterference);
      if (!isNaN(val)) {
        options.minInterference = val;
      }
    }

    // Query data
    const dataset = await gpsjam.queryGPSJamming(options);

    // Format response optimized for map rendering
    res.json({
      date: dataset.date,
      suspect: dataset.suspect,
      totalCells: dataset.totalCells,
      cells: dataset.cells.map((cell) => ({
        h3: cell.hex,
        interference: cell.interference_ratio,
        good: cell.count_good_aircraft,
        bad: cell.count_bad_aircraft,
      })),
    });
  } catch (error: any) {
    console.error('[API] GPS jamming error:', error);
    res.status(500).json({
      error: 'Failed to fetch GPS jamming data',
      message: error.message,
    });
  }
});

/**
 * GET /api/monitor/gps-jamming/dates
 * Get list of all available dataset dates
 */
router.get('/gps-jamming/dates', async (req, res) => {
  try {
    const dates = await gpsjam.getAvailableDates();
    res.json({ dates });
  } catch (error: any) {
    console.error('[API] GPS jamming dates error:', error);
    res.status(500).json({
      error: 'Failed to fetch available dates',
      message: error.message,
    });
  }
});

/**
 * GET /api/monitor/gps-jamming/stats
 * Get interference statistics for a specific date
 *
 * Query Parameters:
 * - date: Optional date in YYYY-MM-DD format (default: latest)
 */
router.get('/gps-jamming/stats', async (req, res) => {
  try {
    const { date } = req.query;
    const dateStr = typeof date === 'string' ? date : undefined;

    const stats = await gpsjam.getInterferenceStats(dateStr);
    res.json(stats);
  } catch (error: any) {
    console.error('[API] GPS jamming stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch interference statistics',
      message: error.message,
    });
  }
});

/**
 * POST /api/monitor/gps-jamming/backfill
 * Manually trigger backfill of missing datasets
 *
 * Body:
 * - limit: Optional number of datasets to backfill (default: all)
 */
router.post('/gps-jamming/backfill', async (req, res) => {
  try {
    const { limit } = req.body || {};
    const limitNum = typeof limit === 'number' ? limit : undefined;

    const downloaded = await gpsjam.backfillDatasets(limitNum);

    res.json({
      success: true,
      downloaded,
      message: `Successfully backfilled ${downloaded} datasets`,
    });
  } catch (error: any) {
    console.error('[API] GPS jamming backfill error:', error);
    res.status(500).json({
      error: 'Failed to backfill datasets',
      message: error.message,
    });
  }
});

export default router;
