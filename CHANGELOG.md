# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- LICENSE file (MIT)
- CONTRIBUTING.md with contribution guidelines
- CODE_OF_CONDUCT.md
- SECURITY.md with security policy
- GitHub Actions CI/CD workflows
- Docker support with Dockerfile and docker-compose.yml
- Issue and PR templates
- Environment variable example files (.env.example)
- Comprehensive .gitignore

### Changed

- Switched from @vitejs/plugin-react-swc to @vitejs/plugin-react for cross-platform compatibility
- Updated .gitignore to properly exclude .env files
- Streamlined Monitor module to focus on core intelligence features
- Simplified OSINT dashboard to 3 panels (News, Webcams, AI Insights)

### Removed

- ACLED conflict data integration (external dependency removed)
- Country Instability Index panel (ACLED-dependent)
- Strategic Posture panel (flight tracking redundancy)
- Unused documentation files (IMPLEMENTATION_SUMMARY.md, IMMEDIATE_ACTIONS.md, etc.)
- Python venv directory (unused)

### Fixed

- Fixed native binding error on macOS (SWC compatibility issue)
- Ensured cross-platform compatibility (macOS, Windows, Linux)

### Security

- Added .env files to .gitignore (prevent credential leaks)
- Created SECURITY.md with vulnerability reporting process
- Removed ACLED API credentials requirement

## [1.0.0] - 2026-03-05

### Added

- Initial release
- Flights tracking module (ADS-B data via ADSB.lol)
- Maritime tracking module (AIS data via AISStream.io)
- Cyber security monitoring module
- OSINT news monitoring module
- Monitor dashboard with news intelligence
- Real-time WebSocket connections
- Aircraft database enrichment (DuckDB + Parquet)
- Interactive 3D globe with MapLibre GL JS
- Multiple display modes (EO, FLIR, CRT)
- Globe and Mercator projection toggle
- React 19 + Vite 7 frontend
- Express.js backend proxy
- Zustand state management
- TanStack Query for data fetching
- Tailwind CSS v4 styling

### Features

#### Flight Tracking

- Live aircraft positions from ADSB.lol
- Rich telemetry panel (altitude, speed, heading, etc.)
- Aircraft database lookup (registration, operator, model)
- Route history trail
- Emergency squawk detection
- On-ground/airborne state detection

#### Maritime Tracking

- Live vessel positions via WebSocket
- Full AIS message type support
- Vessel detail panel (MMSI, name, destination, etc.)
- Route history trail (150 points)
- Stale vessel purging (30-minute timeout)
- Auto-reconnect on disconnect

#### Cyber Module

- Cloudflare Radar integration
- BGP routing anomaly detection
- DDoS attack visualization
- Network traffic analysis

#### Monitor Module

- Live news feeds (190+ countries)
- AI-powered intelligence briefs
- Live webcam feeds from strategic locations
- Geo-located RSS aggregation

---

## Version History

- **1.0.0** - Initial public release
- More versions to come...

---

## How to Update

### From Source

```bash
git pull origin main
npm run install:all
npm run dev
```

### Using Docker

```bash
docker-compose pull
docker-compose up -d
```

---

## Upgrade Notes

### Migrating to 1.0.0

No migration needed - this is the initial release.

---

## Deprecation Notices

None at this time.

---

## Known Issues

See [GitHub Issues](https://github.com/Syntax-Error-1337/radar/issues) for current bugs and limitations.
