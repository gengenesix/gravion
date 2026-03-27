/**
 * GRAVION Neo4j Entity Loader
 * Loads Common Core Ontology schema + live ADS-B/AIS entities into Neo4j
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const neo4j = (() => { try { return require('neo4j-driver'); } catch { return null; } })();

export async function getDriver() {
  if (!neo4j) return null;
  try {
    const driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'gravion_neo4j_2024'
      )
    );
    await driver.verifyConnectivity();
    return driver;
  } catch { return null; }
}

/** Bootstrap CCO-aligned schema constraints + indexes */
export async function bootstrapSchema(driver: unknown): Promise<void> {
  if (!driver) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = driver as any;
  const session = d.session();
  try {
    const constraints = [
      // CCO-aligned entity types
      'CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (n:Agent) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT aircraft_icao IF NOT EXISTS FOR (n:Aircraft) REQUIRE n.icao IS UNIQUE',
      'CREATE CONSTRAINT vessel_mmsi IF NOT EXISTS FOR (n:Vessel) REQUIRE n.mmsi IS UNIQUE',
      'CREATE CONSTRAINT device_id IF NOT EXISTS FOR (n:Device) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT ip_addr IF NOT EXISTS FOR (n:IPAddress) REQUIRE n.address IS UNIQUE',
      'CREATE CONSTRAINT event_id IF NOT EXISTS FOR (n:Event) REQUIRE n.id IS UNIQUE',
      'CREATE CONSTRAINT location_id IF NOT EXISTS FOR (n:Location) REQUIRE n.id IS UNIQUE',
      // Indexes for geo queries
      'CREATE INDEX aircraft_pos IF NOT EXISTS FOR (n:Aircraft) ON (n.lat, n.lon)',
      'CREATE INDEX vessel_pos IF NOT EXISTS FOR (n:Vessel) ON (n.lat, n.lon)',
      'CREATE INDEX event_time IF NOT EXISTS FOR (n:Event) ON (n.timestamp)',
    ];
    for (const c of constraints) {
      await session.run(c).catch(() => {}); // ignore if already exists
    }
    console.log('[GRAVION] Neo4j schema bootstrapped');
  } finally {
    await session.close();
  }
}

/** Upsert aircraft from ADS-B snapshot */
export async function upsertAircraft(driver: unknown, aircraft: Array<{
  icao: string; callsign: string; lat: number; lon: number;
  alt: number; speed: number; heading: number; country: string;
}>): Promise<void> {
  if (!driver || aircraft.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = driver as any;
  const session = d.session();
  try {
    await session.run(`
      UNWIND $aircraft AS a
      MERGE (n:Aircraft {icao: a.icao})
      SET n.callsign = a.callsign,
          n.lat = a.lat,
          n.lon = a.lon,
          n.altitude = a.alt,
          n.speed = a.speed,
          n.heading = a.heading,
          n.country = a.country,
          n.lastSeen = datetime(),
          n.type = 'Aircraft'
      WITH n, a
      MERGE (loc:Location {id: 'geo_' + toString(round(a.lat*10)/10) + '_' + toString(round(a.lon*10)/10)})
      SET loc.lat = round(a.lat * 10) / 10, loc.lon = round(a.lon * 10) / 10
      MERGE (n)-[:LOCATED_AT]->(loc)
    `, { aircraft: aircraft.slice(0, 500) }); // batch limit
  } finally {
    await session.close();
  }
}

/** Upsert vessels from AIS snapshot */
export async function upsertVessels(driver: unknown, vessels: Array<{
  mmsi: number; name: string; lat: number; lon: number;
  sog: number; cog: number; type: number; callsign: string;
}>): Promise<void> {
  if (!driver || vessels.length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = driver as any;
  const session = d.session();
  try {
    await session.run(`
      UNWIND $vessels AS v
      MERGE (n:Vessel {mmsi: v.mmsi})
      SET n.name = v.name,
          n.lat = v.lat,
          n.lon = v.lon,
          n.speed = v.sog,
          n.course = v.cog,
          n.vesselType = v.type,
          n.callsign = v.callsign,
          n.lastSeen = datetime(),
          n.type = 'Vessel'
      WITH n, v
      MERGE (loc:Location {id: 'geo_' + toString(round(v.lat*10)/10) + '_' + toString(round(v.lon*10)/10)})
      SET loc.lat = round(v.lat * 10) / 10, loc.lon = round(v.lon * 10) / 10
      MERGE (n)-[:LOCATED_AT]->(loc)
    `, { vessels: vessels.slice(0, 500) });
  } finally {
    await session.close();
  }
}

/** Proximity query: find entities within ~radius degrees of a point */
export async function findNearby(driver: unknown, lat: number, lon: number, radiusDeg = 1.0): Promise<unknown[]> {
  if (!driver) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = driver as any;
  const session = d.session();
  try {
    const result = await session.run(`
      MATCH (n)
      WHERE (n:Aircraft OR n:Vessel OR n:Device)
        AND n.lat IS NOT NULL AND n.lon IS NOT NULL
        AND abs(n.lat - $lat) < $r AND abs(n.lon - $lon) < $r
      RETURN n.type as type, n.lat as lat, n.lon as lon,
             coalesce(n.callsign, n.name, n.id, toString(n.mmsi)) as name,
             n.lastSeen as lastSeen
      LIMIT 50
    `, { lat, lon, r: radiusDeg });
    return result.records.map((r: { keys: string[]; get: (k: string) => unknown }) =>
      Object.fromEntries(r.keys.map((k) => [k, r.get(k)]))
    );
  } finally {
    await session.close();
  }
}
