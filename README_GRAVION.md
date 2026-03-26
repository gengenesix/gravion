# GRAVION

**Open-source Palantir Gotham for the rest of us**

A military-grade intelligence fusion platform built on CesiumJS, Node.js, Neo4j, and open data feeds. Track aircraft, ships, ground assets, and cyber threats on a real-time 3D globe.

---

## Features

| Capability         | Status |
|--------------------|--------|
| ADS-B Flight Tracking | ✅ |
| AIS Ship Tracking  | ✅ |
| GPS Asset Tracking (Traccar) | ✅ |
| IP Geolocation     | ✅ |
| AI Agents (Ollama) | ✅ |
| Neo4j Graph Database | ✅ |
| Military UI / EO Theme | ✅ |
| GPS Jamming Detection | ✅ |
| Military Bases Layer | ✅ |
| OSINT Panel        | ✅ |
| Cyber Threat Intel | ✅ |
| Real-time WebSocket Feeds | ✅ |

---

## One-Command Install

```bash
curl -sSL https://raw.githubusercontent.com/gengenesix/gravion/main/install.sh | sudo bash
```

Requires Ubuntu 20.04+ or Debian 11+. Installs Docker, Neo4j, Traccar, Ollama, and all services automatically.

---

## Post-Install Verification

- [ ] Open http://gravion.local — 3D globe loads
- [ ] Flights appear on globe within 30 seconds
- [ ] Ships appear on globe (requires AIS API key)
- [ ] Neo4j browser accessible at http://localhost:7474
- [ ] Traccar accessible at http://localhost:8082
- [ ] Ollama accessible at http://localhost:11434
- [ ] `gravion status` shows all containers running
- [ ] `gravion health` returns OK for all services

---

## gravion CLI Reference

```bash
gravion start              # Start all services
gravion stop               # Stop all services
gravion restart [service]  # Restart all or one service
gravion status             # Show container status + URLs
gravion logs [service]     # Tail logs
gravion update             # Pull latest + rebuild
gravion backup             # Backup volumes to /var/backups/gravion/
gravion restore <file>     # Restore from backup archive
gravion health             # Ping all service health endpoints
gravion ip-trace <IP>      # Geolocate an IP address
gravion help               # Show help
```

---

## Configuration

Edit `/opt/gravion/server/.env` (or `server/.env` in dev):

| Key | Description |
|-----|-------------|
| `CESIUM_ION_TOKEN` | CesiumJS Ion token for 3D globe + imagery |
| `AIS_API_KEY` | AISstream.io API key (WebSocket maritime feed) |
| `AISSTREAM_API_KEY` | AIS ship data API key (same as AIS_API_KEY) |
| `FLIGHT_DATA_SOURCE` | ADS-B source: `adsblol` or `opensky` |
| `ADSB_LOL_LAT` | Center latitude for ADS-B coverage area |
| `ADSB_LOL_LON` | Center longitude for ADS-B coverage area |
| `ADSB_LOL_RADIUS` | Radius in nautical miles for ADS-B feed |
| `NEO4J_URI` | Neo4j bolt URI (default: bolt://localhost:7687) |
| `NEO4J_USER` | Neo4j username (default: neo4j) |
| `NEO4J_PASSWORD` | Neo4j password |
| `TRACCAR_URL` | Traccar server URL (default: http://localhost:8082) |
| `TRACCAR_USER` | Traccar admin username |
| `TRACCAR_PASSWORD` | Traccar admin password |
| `OLLAMA_URL` | Ollama API URL (default: http://localhost:11434) |
| `OLLAMA_MODEL` | Ollama model name (default: llama3) |
| `JWT_SECRET` | JWT signing secret — auto-generated on install |
| `SESSION_SECRET` | Session signing secret — auto-generated on install |
| `OPENROUTER_API_KEY` | AI/LLM API key (openrouter.ai) — optional |
| `CLOUDFLARE_RADAR_TOKEN` | Cloudflare Radar API token — optional |

Edit `client/.env`:

| Key | Description |
|-----|-------------|
| `VITE_CESIUM_ION_TOKEN` | CesiumJS Ion token (ion.cesium.com) |
| `VITE_API_URL` | Backend API URL |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│              CesiumJS 3D Globe + React UI                   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Nginx (port 80/443)                     │
│                    gravion.local proxy                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               GRAVION Server (Node.js :3001)                │
│  /api/flights   /api/maritime   /api/geo   /api/monitor     │
│  /api/cyber     /api/ip-trace                               │
└────┬──────────────┬──────────────┬────────────┬────────────┘
     │              │              │            │
     ▼              ▼              ▼            ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Neo4j  │  │  Traccar │  │  Ollama  │  │ External │
│ :7687   │  │  :8082   │  │  :11434  │  │   APIs   │
│ Graph   │  │  GPS     │  │  Local   │  │ ADS-B    │
│ Database│  │  Tracking│  │  AI/LLM  │  │ AIS etc. │
└─────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## Development

```bash
# Clone
git clone https://github.com/gengenesix/gravion
cd gravion

# Setup env
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both .env files with your API keys

# Start with Docker
docker compose up -d

# Or run locally
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

---

## Credits

- Forked from [RADAR](https://github.com/Syntax-Error-1337/radar) by Syntax-Error-1337
- CesiumJS 3D globe engine
- ADS-B data via adsb.lol
- AIS data via AISStream.io
- Graph database by Neo4j
- GPS tracking by Traccar
- Local AI by Ollama
