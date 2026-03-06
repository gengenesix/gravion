# GPS Jamming Data Integration

## Overview

Successfully integrated GPS jamming data from [gpsjam.org](https://gpsjam.org) into the INTELMAP monitoring system. The system now displays daily global GPS interference patterns using H3 hexagonal cells on the tactical map.

## Data Source

**Provider:** gpsjam.org
**Coverage:** Global GPS interference detection via ADS-B aircraft tracking
**Update Frequency:** Daily
**Historical Data:** Available from 2022-02-14 to present (1,285+ datasets)

### Data Structure

#### Manifest (manifest.csv)

- `date`: Dataset date (YYYY-MM-DD)
- `suspect`: Boolean flag for anomalous/suspicious days
- `num_bad_aircraft_hexes`: Count of problematic aircraft identifiers

#### Daily Datasets (YYYY-MM-DD-h3_4.csv)

- `hex`: H3 geospatial index (resolution 4, ~1,770 km² per cell)
- `count_good_aircraft`: Valid aircraft detections (clean ADS-B signals)
- `count_bad_aircraft`: Interfered detections (GPS interference indicator)

**Derived Metric:**
`interference_ratio = bad / (good + bad)`

## Server Implementation

### Location

`server/src/core/source/gpsjam.ts`

### Key Features

1. **Manifest Reader**
   - Fetches and caches manifest.csv
   - Parses available datasets with metadata
   - Auto-detects new datasets

2. **Dataset Downloader**
   - Downloads CSV files on-demand
   - Local caching (24-hour TTL)
   - Automatic retry handling

3. **CSV Parser**
   - Streams large CSV files efficiently
   - Calculates interference ratios
   - Validates data integrity

4. **Data Normalization**
   - Standardized response format
   - Optimized for map rendering
   - Includes suspect flags

5. **Robustness**
   - Duplicate import prevention
   - Stale cache fallback
   - Comprehensive error handling
   - Background ingestion logging

### Scheduler

**Location:** `server/src/core/scheduler.ts`

- Checks for new GPS jamming data every 6 hours
- Maintains last 7 days of datasets in cache
- Automatic backfill support
- Non-blocking background execution

### API Endpoints

#### GET `/api/monitor/gps-jamming`

Fetch GPS interference data for map rendering.

**Query Parameters:**

- `date`: Optional date (YYYY-MM-DD), defaults to latest
- `h3`: Optional comma-separated H3 indices filter
- `minInterference`: Optional minimum interference ratio (0-1)

**Response:**

```json
{
  "date": "2026-03-05",
  "suspect": false,
  "totalCells": 12543,
  "cells": [
    {
      "h3": "842a107ffffffff",
      "interference": 0.37,
      "good": 150,
      "bad": 88
    }
  ]
}
```

#### GET `/api/monitor/gps-jamming/dates`

List all available dataset dates.

**Response:**

```json
{
  "dates": ["2022-02-14", "2022-02-15", ..., "2026-03-05"]
}
```

#### GET `/api/monitor/gps-jamming/stats`

Get interference statistics for a date.

**Query Parameters:**

- `date`: Optional date (defaults to latest)

**Response:**

```json
{
  "date": "2026-03-05",
  "totalCells": 12543,
  "suspect": false,
  "cellsWithInterference": 3421,
  "avgInterferenceRatio": 0.15,
  "maxInterferenceRatio": 0.89,
  "totalBadAircraft": 45892,
  "totalGoodAircraft": 251743
}
```

#### POST `/api/monitor/gps-jamming/backfill`

Manually trigger dataset backfill.

**Body:**

```json
{
  "limit": 30
}
```

## Client Implementation

### Location

`client/src/modules/monitor/`

### Architecture

1. **State Management** (`gpsJamming.store.ts`)
   - Zustand store for layer state
   - Enabled/disabled toggle
   - Selected date tracking
   - Data caching

2. **Data Hook** (`hooks/useGPSJammingData.ts`)
   - Automatic date list fetching
   - On-demand data loading
   - Error handling
   - Loading states

3. **Map Layer** (`components/GPSJammingLayer.tsx`)
   - H3 hexagon rendering using h3-js
   - Color-coded interference levels
   - Interactive popups
   - GeoJSON polygon generation

4. **Control Panel** (`components/GPSJammingControl.tsx`)
   - Layer toggle button
   - Date selector dropdown
   - Color legend
   - Status indicators
   - Suspect flag warnings

### Visual Design

**Color Scheme:**

- **Green** (0-20%): Low interference
- **Yellow** (20-50%): Medium interference
- **Orange** (50-80%): High interference
- **Red** (80-100%): Severe interference

**UI Elements:**

- Animated pulse indicator when enabled
- Expandable control panel
- Tech-themed styling matching INTELMAP aesthetic
- Responsive tooltips with detailed metrics

### Map Integration

**Component:** `MonitorMap.tsx`

```tsx
{
  gpsJammingEnabled && <GPSJammingLayer />;
}
<GPSJammingControl />;
```

Layers are conditionally rendered and properly ordered to appear above the base map but below labels.

## Performance Optimizations

### Server-Side

1. **Multi-level Caching**
   - Manifest cache: 1 hour TTL
   - Dataset cache: 1 hour in-memory
   - Raw file cache: 24 hours on disk

2. **Efficient Parsing**
   - Stream-based CSV reading
   - On-demand data loading
   - No duplicate downloads

3. **Smart Scheduling**
   - 6-hour update interval
   - Background processing
   - Maintains 7-day rolling cache

### Client-Side

1. **Lazy Loading**
   - Data only fetched when layer is enabled
   - On-demand date selection

2. **State Management**
   - Zustand for minimal re-renders
   - Memoized GeoJSON generation
   - Efficient H3 boundary calculation

3. **Map Optimization**
   - Conditional layer rendering
   - MapLibre's built-in culling
   - Optimized polygon rendering

### Future Enhancements

- Viewport-based filtering (only load visible cells)
- Progressive loading for large datasets
- WebWorker for H3 calculations
- IndexedDB caching on client

## Usage

### Starting the System

**Server:**

```bash
cd server
npm install
npm run dev
```

The scheduler will automatically:

- Initialize on server startup
- Fetch latest GPS jamming data
- Check for updates every 6 hours

**Client:**

```bash
cd client
npm install
npm run dev
```

### Using the GPS Jamming Layer

1. Navigate to the **Monitor** page
2. Click the **GPS Jamming** button in the bottom-left corner
3. Toggle the layer on/off
4. Select a date from the dropdown (defaults to latest)
5. Click on any hex cell to view detailed interference metrics

### Manual Backfill

To backfill historical datasets:

```bash
curl -X POST http://localhost:3001/api/monitor/gps-jamming/backfill \
  -H "Content-Type: application/json" \
  -d '{"limit": 30}'
```

## Code Quality

### TypeScript

- Full type safety across server and client
- Strict interface definitions
- No `any` types in production code

### Error Handling

- Try-catch blocks around all network calls
- Graceful fallbacks for missing data
- User-friendly error messages
- Comprehensive logging

### Modularity

- Separated concerns (ingestion, API, UI)
- Reusable components
- Clean architecture pattern
- Easy to extend for future data sources

## Testing Checklist

- [x] Server ingestion pipeline
- [x] API endpoints return correct data
- [x] Scheduler runs automatically
- [x] Client layer renders properly
- [x] Date selector works
- [x] Popups display correct information
- [x] Layer toggles on/off
- [x] Caching prevents redundant downloads
- [x] Error states handled gracefully
- [x] Performance acceptable with large datasets

## Files Created/Modified

### Server

- ✅ `server/src/core/source/gpsjam.ts` - Main ingestion module
- ✅ `server/src/core/scheduler.ts` - Job scheduler
- ✅ `server/src/routes/monitor.ts` - API endpoints
- ✅ `server/src/index.ts` - Scheduler initialization
- ✅ `server/src/Data/gpsjam/` - Data storage directory

### Client

- ✅ `client/src/modules/monitor/gpsJamming.store.ts` - State management
- ✅ `client/src/modules/monitor/hooks/useGPSJammingData.ts` - Data hook
- ✅ `client/src/modules/monitor/components/GPSJammingLayer.tsx` - Map layer
- ✅ `client/src/modules/monitor/components/GPSJammingControl.tsx` - UI controls
- ✅ `client/src/modules/monitor/components/MonitorMap.tsx` - Integration

### Dependencies

- ✅ `h3-js` - H3 geospatial indexing library

## Maintenance

### Regular Tasks

- Monitor scheduler logs for ingestion failures
- Check disk space in `server/src/Data/gpsjam/`
- Verify data freshness (latest date)

### Troubleshooting

**No data appearing:**

1. Check API: `curl http://localhost:3001/api/monitor/gps-jamming`
2. Check server logs for ingestion errors
3. Verify gpsjam.org is accessible

**Old data:**

1. Manually trigger backfill endpoint
2. Check scheduler is running
3. Verify 6-hour interval hasn't elapsed yet

**Performance issues:**

1. Clear old cached datasets (keep last 30 days)
2. Check dataset cell counts (stats endpoint)
3. Consider viewport filtering implementation

## Future Enhancements

1. **Viewport Filtering**: Only load H3 cells within map bounds
2. **Clustering**: Aggregate cells at low zoom levels
3. **Time Series**: Animate interference changes over time
4. **Alerts**: Notify on high interference events
5. **Comparison**: Side-by-side date comparison
6. **Export**: Download interference data as GeoJSON/CSV
7. **Analytics**: Historical trends and statistics dashboard
8. **Integration**: Correlate with other data sources (flights, maritime)

## References

- **Data Source**: https://gpsjam.org
- **H3 Geospatial**: https://h3geo.org
- **MapLibre GL JS**: https://maplibre.org
- **React Map GL**: https://visgl.github.io/react-map-gl/
