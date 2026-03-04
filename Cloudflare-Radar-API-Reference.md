# Cloudflare Radar API — Complete Reference

**Base URL:** `https://api.cloudflare.com/client/v4`  
**Auth:** `Authorization: Bearer <TOKEN>`  
**Permissions:** User Details Read or User Details Write (most endpoints)

*272 endpoints across AI, Annotations, AS112, Attacks, BGP, Bots, CT, Datasets, DNS, Email, Entities, Geolocations, HTTP, Leaked Credentials, NetFlows, Origins, Post Quantum, Quality, Ranking, Robots.txt, Search, TCP Resets, TLDs, Traffic Anomalies, Verified Bots*

---

## Response Format

All endpoints return:

```json
{
  "success": true,
  "result": { "meta": {...}, "top_0"|"summary_0"|"serie_0": [...] }
}
```

- `meta`: date range, units, confidence info  
- Data keys vary by endpoint: `top_0`, `summary_0`, `serie_0`, `annotations`, etc.

---

## AI

### `GET /radar/ai/bots/summary/{dimension}`

Retrieves an aggregated summary of AI bots HTTP requests grouped by the specified dimension.

### `GET /radar/ai/bots/timeseries`

Retrieves AI bots HTTP request volume over time.

### `GET /radar/ai/bots/timeseries_groups/{dimension}`

Retrieves the distribution of HTTP requests from AI bots, grouped by the specified dimension over time.

### `GET /radar/ai/bots/summary/user_agent` *(deprecated)*

Retrieves the distribution of traffic by AI user agent.

### `GET /radar/ai/inference/summary/{dimension}`

Retrieves an aggregated summary of unique accounts using Workers AI inference grouped by the specified dimension.

### `GET /radar/ai/inference/timeseries_groups/{dimension}`

Retrieves the distribution of unique accounts using Workers AI inference, grouped by the specified dimension over time.

### `GET /radar/ai/inference/summary/model` *(deprecated)*

Retrieves the distribution of unique accounts by model.

### `GET /radar/ai/inference/summary/task` *(deprecated)*

Retrieves the distribution of unique accounts by task.

### `GET /radar/ai/inference/timeseries_groups/model` *(deprecated)*

Retrieves the distribution of unique accounts by model over time.

### `GET /radar/ai/inference/timeseries_groups/task` *(deprecated)*

Retrieves the distribution of unique accounts by task over time.

### `GET /radar/ai/bots/timeseries_groups/user_agent` *(deprecated)*

Retrieves the distribution of traffic by AI user agent over time.

### `GET /radar/ai/bots/summary/{dimension}` *(deprecated)*

Retrieves an aggregated summary of AI bots HTTP requests grouped by the specified dimension.

### `GET /radar/ai/bots/timeseries` *(deprecated)*

Retrieves AI bots HTTP request volume over time.

### `GET /radar/ai/bots/timeseries_groups/{dimension}` *(deprecated)*

Retrieves the distribution of HTTP requests from AI bots, grouped by the specified dimension over time.

---

## Annotations

### `GET /radar/annotations`

Retrieves the latest annotations.

### `GET /radar/annotations/outages`

Retrieves the latest Internet outages and anomalies.

### `GET /radar/annotations/outages/locations`

Retrieves the number of outages by location.

---

## As112

### `GET /radar/as112/timeseries`

Retrieves the AS112 DNS queries over time.

### `GET /radar/as112/summary/{dimension}`

Retrieves the distribution of AS112 queries by the specified dimension.

### `GET /radar/as112/timeseries_groups/{dimension}`

Retrieves the distribution of AS112 queries grouped by dimension over time.

### `GET /radar/as112/summary/dnssec` *(deprecated)*

Retrieves the distribution of DNS queries to AS112 by DNSSEC (DNS Security Extensions) support.

### `GET /radar/as112/summary/edns` *(deprecated)*

Retrieves the distribution of DNS queries to AS112 by EDNS (Extension Mechanisms for DNS) support.

### `GET /radar/as112/summary/ip_version` *(deprecated)*

Retrieves the distribution of DNS queries to AS112 by IP version.

### `GET /radar/as112/summary/protocol` *(deprecated)*

Retrieves the distribution of DNS queries to AS112 by protocol.

### `GET /radar/as112/summary/query_type` *(deprecated)*

Retrieves the distribution of DNS queries to AS112 by type.

### `GET /radar/as112/summary/response_codes` *(deprecated)*

Retrieves the distribution of AS112 DNS requests classified by response code.

### `GET /radar/as112/timeseries_groups/protocol` *(deprecated)*

Retrieves the distribution of AS112 DNS requests classified by protocol over time.

### `GET /radar/as112/timeseries_groups/query_type` *(deprecated)*

Retrieves the distribution of AS112 DNS queries by type over time.

### `GET /radar/as112/timeseries_groups/response_codes` *(deprecated)*

Retrieves the distribution of AS112 DNS requests classified by response code over time.

### `GET /radar/as112/timeseries_groups/dnssec` *(deprecated)*

Retrieves the distribution of AS112 DNS queries by DNSSEC (DNS Security Extensions) support over time.

### `GET /radar/as112/timeseries_groups/edns` *(deprecated)*

Retrieves the distribution of AS112 DNS queries by EDNS (Extension Mechanisms for DNS) support over time.

### `GET /radar/as112/timeseries_groups/ip_version` *(deprecated)*

Retrieves the distribution of AS112 DNS queries by IP version over time.

### `GET /radar/as112/top/locations`

Retrieves the top locations by AS112 DNS queries.

### `GET /radar/as112/top/locations/dnssec/{dnssec}`

Retrieves the top locations of DNS queries to AS112 with DNSSEC (DNS Security Extensions) support.

### `GET /radar/as112/top/locations/edns/{edns}`

Retrieves the top locations of DNS queries to AS112 with EDNS (Extension Mechanisms for DNS) support.

### `GET /radar/as112/top/locations/ip_version/{ip_version}`

Retrieves the top locations of DNS queries to AS112 for an IP version.

---

## Attacks

### `GET /radar/attacks/layer3/summary/{dimension}`

Retrieves the distribution of layer 3 attacks by the specified dimension.

### `GET /radar/attacks/layer3/timeseries`

Retrieves layer 3 attacks over time.

### `GET /radar/attacks/layer3/timeseries_groups/{dimension}`

Retrieves the distribution of layer 3 attacks grouped by dimension over time.

### `GET /radar/attacks/layer3/summary/bitrate` *(deprecated)*

Retrieves the distribution of layer 3 attacks by bitrate.

### `GET /radar/attacks/layer3/summary/duration` *(deprecated)*

Retrieves the distribution of layer 3 attacks by duration.

### `GET /radar/attacks/layer3/summary/ip_version` *(deprecated)*

Retrieves the distribution of layer 3 attacks by IP version.

### `GET /radar/attacks/layer3/summary/protocol` *(deprecated)*

Retrieves the distribution of layer 3 attacks by protocol.

### `GET /radar/attacks/layer3/summary/vector` *(deprecated)*

Retrieves the distribution of layer 3 attacks by vector.

### `GET /radar/attacks/layer3/summary/industry` *(deprecated)*

Retrieves the distribution of layer 3 attacks by targeted industry.

### `GET /radar/attacks/layer3/summary/vertical` *(deprecated)*

Retrieves the distribution of layer 3 attacks by targeted vertical.

### `GET /radar/attacks/layer3/timeseries_groups/industry` *(deprecated)*

Retrieves the distribution of layer 3 attacks by targeted industry over time.

### `GET /radar/attacks/layer3/timeseries_groups/ip_version` *(deprecated)*

Retrieves the distribution of layer 3 attacks by IP version over time.

### `GET /radar/attacks/layer3/timeseries_groups/protocol` *(deprecated)*

Retrieves the distribution of layer 3 attacks by protocol over time.

### `GET /radar/attacks/layer3/timeseries_groups/vector` *(deprecated)*

Retrieves the distribution of layer 3 attacks by vector over time.

### `GET /radar/attacks/layer3/timeseries_groups/vertical` *(deprecated)*

Retrieves the distribution of layer 3 attacks by targeted vertical over time.

### `GET /radar/attacks/layer3/timeseries_groups/bitrate` *(deprecated)*

Retrieves the distribution of layer 3 attacks by bitrate over time.

### `GET /radar/attacks/layer3/timeseries_groups/duration` *(deprecated)*

Retrieves the distribution of layer 3 attacks by duration over time.

### `GET /radar/attacks/layer3/top/attacks`

Retrieves the top layer 3 attacks from origin to target location. Values are a percentage out of the total layer 3 attacks (with billing country). You can optionally limit the number of attacks by origin/target location (useful if all the top attacks are from or to the same location).

### `GET /radar/attacks/layer3/top/industry` *(deprecated)*

(see docs)

### `GET /radar/attacks/layer3/top/vertical` *(deprecated)*

(see docs)

### `GET /radar/attacks/layer3/top/locations/origin`

Retrieves the origin locations of layer 3 attacks.

### `GET /radar/attacks/layer3/top/locations/target`

Retrieves the target locations of layer 3 attacks.

### `GET /radar/attacks/layer7/summary/{dimension}`

Retrieves the distribution of layer 7 attacks by the specified dimension.

### `GET /radar/attacks/layer7/timeseries`

Retrieves layer 7 attacks over time.

### `GET /radar/attacks/layer7/timeseries_groups/{dimension}`

Retrieves the distribution of layer 7 attacks grouped by dimension over time.

### `GET /radar/attacks/layer7/summary/ip_version` *(deprecated)*

Retrieves the distribution of layer 7 attacks by IP version.

### `GET /radar/attacks/layer7/summary/http_method` *(deprecated)*

Retrieves the distribution of layer 7 attacks by HTTP method.

### `GET /radar/attacks/layer7/summary/http_version` *(deprecated)*

Retrieves the distribution of layer 7 attacks by HTTP version.

### `GET /radar/attacks/layer7/summary/managed_rules` *(deprecated)*

Retrieves the distribution of layer 7 attacks by managed rules.

### `GET /radar/attacks/layer7/summary/mitigation_product` *(deprecated)*

Retrieves the distribution of layer 7 attacks by mitigation product.

### `GET /radar/attacks/layer7/summary/industry` *(deprecated)*

Retrieves the distribution of layer 7 attacks by targeted industry.

### `GET /radar/attacks/layer7/summary/vertical` *(deprecated)*

Retrieves the distribution of layer 7 attacks by targeted vertical.

### `GET /radar/attacks/layer7/timeseries_groups/industry` *(deprecated)*

Retrieves the distribution of layer 7 attacks by targeted industry over time.

### `GET /radar/attacks/layer7/timeseries_groups/ip_version` *(deprecated)*

Retrieves the distribution of layer 7 attacks by IP version used over time.

### `GET /radar/attacks/layer7/timeseries_groups/vertical` *(deprecated)*

Retrieves the distribution of layer 7 attacks by targeted vertical over time.

### `GET /radar/attacks/layer7/timeseries_groups/http_method` *(deprecated)*

Retrieves the distribution of layer 7 attacks by HTTP method over time.

### `GET /radar/attacks/layer7/timeseries_groups/http_version` *(deprecated)*

Retrieves the distribution of layer 7 attacks by HTTP version over time.

### `GET /radar/attacks/layer7/timeseries_groups/managed_rules` *(deprecated)*

Retrieves the distribution of layer 7 attacks by managed rules over time.

### `GET /radar/attacks/layer7/timeseries_groups/mitigation_product` *(deprecated)*

Retrieves the distribution of layer 7 attacks by mitigation product over time.

### `GET /radar/attacks/layer7/top/attacks`

Retrieves the top attacks from origin to target location. Values are percentages of the total layer 7 attacks (with billing country). The attack magnitude can be defined by the number of mitigated requests or by the number of zones affected. You can optionally limit the number of attacks by origin/target location (useful if all the top attacks are from or to the same location).

### `GET /radar/attacks/layer7/top/industry` *(deprecated)*

(see docs)

### `GET /radar/attacks/layer7/top/vertical` *(deprecated)*

(see docs)

### `GET /radar/attacks/layer7/top/ases/origin`

Retrieves the top origin autonomous systems of layer 7 attacks. Values are percentages of the total layer 7 attacks, with the origin autonomous systems determined by the client IP address.

### `GET /radar/attacks/layer7/top/locations/origin`

Retrieves the top origin locations of layer 7 attacks. Values are percentages of the total layer 7 attacks, with the origin location determined by the client IP address.

### `GET /radar/attacks/layer7/top/locations/target`

Retrieves the top target locations of and by layer 7 attacks. Values are a percentage out of the total layer 7 attacks. The target location is determined by the attacked zone's billing country, when available.

---

## Bgp

### `GET /radar/bgp/timeseries`

Retrieves BGP updates over time. When requesting updates for an autonomous system, only BGP updates of type announcement are returned.

### `GET /radar/bgp/hijacks/events`

Retrieves the BGP hijack events.

### `GET /radar/bgp/ips/timeseries`

Retrieves time series data for the announced IP space count, represented as the number of IPv4 /24s and IPv6 /48s, for a given ASN.

### `GET /radar/bgp/leaks/events`

Retrieves the BGP route leak events.

### `GET /radar/bgp/routes/moas`

Retrieves all Multi-Origin AS (MOAS) prefixes in the global routing tables.

### `GET /radar/bgp/routes/pfx2as`

Retrieves the prefix-to-ASN mapping from global routing tables.

### `GET /radar/bgp/routes/stats`

Retrieves the BGP routing table stats.

### `GET /radar/bgp/routes/ases`

Retrieves all ASes in the current global routing tables with routing statistics.

### `GET /radar/bgp/routes/realtime`

Retrieves real-time BGP routes for a prefix, using public real-time data collectors (RouteViews and RIPE RIS).

### `GET /radar/bgp/rpki/aspa/snapshot`

Retrieves current or historical ASPA (Autonomous System Provider Authorization) objects. ASPA objects define which ASNs are authorized upstream providers for a customer ASN.

### `GET /radar/bgp/rpki/aspa/changes`

Retrieves ASPA (Autonomous System Provider Authorization) changes over time. Returns daily aggregated changes including additions, removals, and modifications of ASPA objects.

### `GET /radar/bgp/rpki/aspa/timeseries`

Retrieves ASPA (Autonomous System Provider Authorization) object count over time. Supports filtering by RIR or location (country code) to generate multiple named series. If no RIR or location filter is specified, returns total count.

### `GET /radar/bgp/top/prefixes`

Retrieves the top network prefixes by BGP updates.

### `GET /radar/bgp/top/ases`

Retrieves the top autonomous systems by BGP updates (announcements only).

### `GET /radar/bgp/top/ases/prefixes`

Retrieves the full list of autonomous systems on the global routing table ordered by announced prefixes count. The data comes from public BGP MRT data archives and updates every 2 hours.

---

## Bots

### `GET /radar/bots`

Retrieves a list of bots.

### `GET /radar/bots/{bot_slug}`

Retrieves the requested bot information.

### `GET /radar/bots/summary/{dimension}`

Retrieves an aggregated summary of bots HTTP requests grouped by the specified dimension.

### `GET /radar/bots/timeseries`

Retrieves bots HTTP request volume over time.

### `GET /radar/bots/timeseries_groups/{dimension}`

Retrieves the distribution of HTTP requests from bots, grouped by the specified dimension over time.

### `GET /radar/bots/crawlers/summary/{dimension}`

Retrieves an aggregated summary of HTTP requests from crawlers, grouped by the specified dimension.

### `GET /radar/bots/crawlers/timeseries_groups/{dimension}`

Retrieves the distribution of HTTP requests from crawlers, grouped by the specified dimension over time.

---

## Ct

### `GET /radar/ct/summary/{dimension}`

Retrieves an aggregated summary of certificates grouped by the specified dimension.

### `GET /radar/ct/timeseries`

Retrieves certificate volume over time.

### `GET /radar/ct/timeseries_groups/{dimension}`

Retrieves the distribution of certificates grouped by the specified dimension over time.

### `GET /radar/ct/authorities/{ca_slug}`

Retrieves the requested CA information.

### `GET /radar/ct/authorities`

Retrieves a list of certificate authorities.

### `GET /radar/ct/logs/{log_slug}`

Retrieves the requested certificate log information.

### `GET /radar/ct/logs`

Retrieves a list of certificate logs.

---

## Datasets

### `GET /radar/datasets`

Retrieves a list of datasets.

### `GET /radar/datasets/{alias}`

Retrieves the CSV content of a given dataset by alias or ID. When getting the content by alias the latest dataset is returned, optionally filtered by the latest available at a given date.

### `POST /radar/datasets/download`

Retrieves an URL to download a single dataset.

---

## Dns

### `GET /radar/dns/summary/{dimension}`

Retrieves the distribution of DNS queries by the specified dimension.

### `GET /radar/dns/timeseries`

Retrieves normalized query volume to the 1.1.1.1 DNS resolver over time.

### `GET /radar/dns/timeseries_groups/{dimension}`

Retrieves the distribution of DNS queries grouped by dimension over time.

### `GET /radar/dns/summary/cache_hit` *(deprecated)*

Retrieves the distribution of DNS queries by cache status.

### `GET /radar/dns/summary/dnssec` *(deprecated)*

Retrieves the distribution of DNS responses by DNSSEC (DNS Security Extensions) support.

### `GET /radar/dns/summary/dnssec_aware` *(deprecated)*

Retrieves the distribution of DNS queries by DNSSEC (DNS Security Extensions) client awareness.

### `GET /radar/dns/summary/dnssec_e2e` *(deprecated)*

Retrieves the distribution of DNSSEC-validated answers by end-to-end security status.

### `GET /radar/dns/summary/ip_version` *(deprecated)*

Retrieves the distribution of DNS queries by IP version.

### `GET /radar/dns/summary/matching_answer` *(deprecated)*

Retrieves the distribution of DNS queries by matching answers.

### `GET /radar/dns/summary/protocol` *(deprecated)*

Retrieves the distribution of DNS queries by DNS transport protocol.

### `GET /radar/dns/summary/query_type` *(deprecated)*

Retrieves the distribution of DNS queries by type.

### `GET /radar/dns/summary/response_code` *(deprecated)*

Retrieves the distribution of DNS queries by response code.

### `GET /radar/dns/summary/response_ttl` *(deprecated)*

Retrieves the distribution of DNS queries by minimum response TTL.

### `GET /radar/dns/timeseries_groups/cache_hit` *(deprecated)*

Retrieves the distribution of DNS queries by cache status over time.

### `GET /radar/dns/timeseries_groups/dnssec` *(deprecated)*

Retrieves the distribution of DNS responses by DNSSEC (DNS Security Extensions) support over time.

### `GET /radar/dns/timeseries_groups/dnssec_aware` *(deprecated)*

Retrieves the distribution of DNS queries by DNSSEC (DNS Security Extensions) client awareness over time.

### `GET /radar/dns/timeseries_groups/dnssec_e2e` *(deprecated)*

Retrieves the distribution of DNSSEC-validated answers by end-to-end security status over time.

### `GET /radar/dns/timeseries_groups/ip_version` *(deprecated)*

Retrieves the distribution of DNS queries by IP version over time.

### `GET /radar/dns/timeseries_groups/matching_answer` *(deprecated)*

Retrieves the distribution of DNS queries by matching answers over time.

### `GET /radar/dns/timeseries_groups/protocol` *(deprecated)*

Retrieves the distribution of DNS queries by DNS transport protocol over time.

### `GET /radar/dns/timeseries_groups/query_type` *(deprecated)*

Retrieves the distribution of DNS queries by type over time.

### `GET /radar/dns/timeseries_groups/response_code` *(deprecated)*

Retrieves the distribution of DNS queries by response code over time.

### `GET /radar/dns/timeseries_groups/response_ttl` *(deprecated)*

Retrieves the distribution of DNS queries by minimum answer TTL over time.

### `GET /radar/dns/top/ases`

Retrieves the top autonomous systems by DNS queries made to 1.1.1.1 DNS resolver.

### `GET /radar/dns/top/locations`

Retrieves the top locations by DNS queries made to 1.1.1.1 DNS resolver.

---

## Email

### `GET /radar/email/routing/summary/{dimension}`

Retrieves the distribution of email routing metrics by the specified dimension.

### `GET /radar/email/routing/timeseries_groups/{dimension}`

Retrieves the distribution of email routing metrics grouped by dimension over time.

### `GET /radar/email/routing/summary/arc` *(deprecated)*

Retrieves the distribution of emails by ARC (Authenticated Received Chain) validation.

### `GET /radar/email/routing/summary/dkim` *(deprecated)*

Retrieves the distribution of emails by DKIM (DomainKeys Identified Mail) validation.

### `GET /radar/email/routing/summary/dmarc` *(deprecated)*

Retrieves the distribution of emails by DMARC (Domain-based Message Authentication, Reporting and Conformance) validation.

### `GET /radar/email/routing/summary/encrypted` *(deprecated)*

Retrieves the distribution of emails by encryption status (encrypted vs. not-encrypted).

### `GET /radar/email/routing/summary/ip_version` *(deprecated)*

Retrieves the distribution of emails by IP version.

### `GET /radar/email/routing/summary/spf` *(deprecated)*

Retrieves the distribution of emails by SPF (Sender Policy Framework) validation.

### `GET /radar/email/routing/timeseries_groups/arc` *(deprecated)*

Retrieves the distribution of emails by ARC (Authenticated Received Chain) validation over time.

### `GET /radar/email/routing/timeseries_groups/dkim` *(deprecated)*

Retrieves the distribution of emails by DKIM (DomainKeys Identified Mail) validation over time.

### `GET /radar/email/routing/timeseries_groups/dmarc` *(deprecated)*

Retrieves the distribution of emails by DMARC (Domain-based Message Authentication, Reporting and Conformance) validation over time.

### `GET /radar/email/routing/timeseries_groups/encrypted` *(deprecated)*

Retrieves the distribution of emails by encryption status (encrypted vs. not-encrypted) over time.

### `GET /radar/email/routing/timeseries_groups/ip_version` *(deprecated)*

Retrieves the distribution of emails by IP version over time.

### `GET /radar/email/routing/timeseries_groups/spf` *(deprecated)*

Retrieves the distribution of emails by SPF (Sender Policy Framework) validation over time.

### `GET /radar/email/security/summary/{dimension}`

Retrieves the distribution of email security metrics by the specified dimension.

### `GET /radar/email/security/timeseries_groups/{dimension}`

Retrieves the distribution of email security metrics grouped by dimension over time.

### `GET /radar/email/security/summary/arc` *(deprecated)*

Retrieves the distribution of emails by ARC (Authenticated Received Chain) validation.

### `GET /radar/email/security/summary/dkim` *(deprecated)*

Retrieves the distribution of emails by DKIM (DomainKeys Identified Mail) validation.

### `GET /radar/email/security/summary/dmarc` *(deprecated)*

Retrieves the distribution of emails by DMARC (Domain-based Message Authentication, Reporting and Conformance) validation.

### `GET /radar/email/security/summary/malicious` *(deprecated)*

Retrieves the distribution of emails by malicious classification.

### `GET /radar/email/security/summary/spam` *(deprecated)*

Retrieves the proportion of emails by spam classification (spam vs. non-spam).

### `GET /radar/email/security/summary/spf` *(deprecated)*

Retrieves the distribution of emails by SPF (Sender Policy Framework) validation.

### `GET /radar/email/security/summary/threat_category` *(deprecated)*

Retrieves the distribution of emails by threat categories.

### `GET /radar/email/security/summary/spoof` *(deprecated)*

Retrieves the proportion of emails by spoof classification (spoof vs. non-spoof).

### `GET /radar/email/security/summary/tls_version` *(deprecated)*

Retrieves the distribution of emails by TLS version.

### `GET /radar/email/security/timeseries_groups/arc` *(deprecated)*

Retrieves the distribution of emails by ARC (Authenticated Received Chain) validation over time.

### `GET /radar/email/security/timeseries_groups/dkim` *(deprecated)*

Retrieves the distribution of emails by DKIM (DomainKeys Identified Mail) validation over time.

### `GET /radar/email/security/timeseries_groups/dmarc` *(deprecated)*

Retrieves the distribution of emails by DMARC (Domain-based Message Authentication, Reporting and Conformance) validation over time.

### `GET /radar/email/security/timeseries_groups/malicious` *(deprecated)*

Retrieves the distribution of emails by malicious classification over time.

### `GET /radar/email/security/timeseries_groups/spam` *(deprecated)*

Retrieves the distribution of emails by spam classification (spam vs. non-spam) over time.

### `GET /radar/email/security/timeseries_groups/spf` *(deprecated)*

Retrieves the distribution of emails by SPF (Sender Policy Framework) validation over time.

### `GET /radar/email/security/timeseries_groups/threat_category` *(deprecated)*

Retrieves the distribution of emails by threat category over time.

### `GET /radar/email/security/timeseries_groups/spoof` *(deprecated)*

Retrieves the distribution of emails by spoof classification (spoof vs. non-spoof) over time.

### `GET /radar/email/security/timeseries_groups/tls_version` *(deprecated)*

Retrieves the distribution of emails by TLS version over time.

### `GET /radar/email/security/top/tlds`

Retrieves the top TLDs by number of email messages.

### `GET /radar/email/security/top/tlds/malicious/{malicious}`

Retrieves the top TLDs by emails classified as malicious or not.

### `GET /radar/email/security/top/tlds/spam/{spam}`

Retrieves the top TLDs by emails classified as spam or not.

### `GET /radar/email/security/top/tlds/spoof/{spoof}`

Retrieves the top TLDs by emails classified as spoof or not.

---

## Entities

### `GET /radar/entities/ip`

Retrieves IP address information.

### `GET /radar/entities/asns`

Retrieves a list of autonomous systems.

### `GET /radar/entities/asns/{asn}`

Retrieves the requested autonomous system information. (A confidence level below `5` indicates a low level of confidence in the traffic data - normally this happens because Cloudflare has a small amount of traffic from/to this AS). Population estimates come from APNIC (refer to).

### `GET /radar/entities/asns/{asn}/rel`

Retrieves AS-level relationship for given networks.

### `GET /radar/entities/asns/{asn}/as_set`

Retrieves Internet Routing Registry AS-SETs that an AS is a member of.

### `GET /radar/entities/asns/ip`

Retrieves the requested autonomous system information based on IP address. Population estimates come from APNIC (refer to).

### `GET /radar/entities/asns/botnet_threat_feed`

Retrieves a ranked list of Autonomous Systems based on their presence in the Cloudflare Botnet Threat Feed. Rankings can be sorted by offense count or number of bad IPs. Optionally compare to a previous date to see rank changes.

### `GET /radar/entities/locations`

Retrieves a list of locations.

### `GET /radar/entities/locations/{location}`

Retrieves the requested location information. (A confidence level below `5` indicates a low level of confidence in the traffic data - normally this happens because Cloudflare has a small amount of traffic from/to this location).

---

## Geolocations

### `GET /radar/geolocations`

Retrieves a list of geolocations.

### `GET /radar/geolocations/{geo_id}`

Retrieves the requested Geolocation information.

---

## Http

### `GET /radar/http/summary/{dimension}`

Retrieves the distribution of HTTP requests by the specified dimension.

### `GET /radar/http/timeseries`

Retrieves the HTTP requests over time.

### `GET /radar/http/timeseries_groups/{dimension}`

Retrieves the distribution of HTTP requests grouped by dimension.

### `GET /radar/http/top/ases`

Retrieves the top autonomous systems by HTTP requests.

### `GET /radar/http/top/ases/bot_class/{bot_class}`

Retrieves the top autonomous systems, by HTTP requests, of the requested bot class.

### `GET /radar/http/top/ases/browser_family/{browser_family}`

Retrieves the top autonomous systems, by HTTP requests, of the requested browser family.

### `GET /radar/http/top/ases/device_type/{device_type}`

Retrieves the top autonomous systems, by HTTP requests, of the requested device type.

### `GET /radar/http/top/ases/http_version/{http_version}`

Retrieves the top autonomous systems, by HTTP requests, of the requested HTTP version.

### `GET /radar/http/top/ases/http_protocol/{http_protocol}`

Retrieves the top autonomous systems, by HTTP requests, of the requested HTTP protocol.

### `GET /radar/http/top/ases/ip_version/{ip_version}`

Retrieves the top autonomous systems, by HTTP requests, of the requested IP version.

### `GET /radar/http/top/ases/os/{os}`

Retrieves the top autonomous systems, by HTTP requests, of the requested operating system.

### `GET /radar/http/top/ases/tls_version/{tls_version}`

Retrieves the top autonomous systems, by HTTP requests, of the requested TLS protocol version.

### `GET /radar/http/top/locations`

Retrieves the top locations by HTTP requests.

### `GET /radar/http/top/locations/bot_class/{bot_class}`

Retrieves the top locations, by HTTP requests, of the requested bot class.

### `GET /radar/http/top/locations/browser_family/{browser_family}`

Retrieves the top locations, by HTTP requests, of the requested browser family.

### `GET /radar/http/top/locations/device_type/{device_type}`

Retrieves the top locations, by HTTP requests, of the requested device type.

### `GET /radar/http/top/locations/http_version/{http_version}`

Retrieves the top locations, by HTTP requests, of the requested HTTP version.

### `GET /radar/http/top/locations/http_protocol/{http_protocol}`

Retrieves the top locations, by HTTP requests, of the requested HTTP protocol.

### `GET /radar/http/top/locations/ip_version/{ip_version}`

Retrieves the top locations, by HTTP requests, of the requested IP version.

### `GET /radar/http/top/locations/os/{os}`

Retrieves the top locations, by HTTP requests, of the requested operating system.

### `GET /radar/http/top/locations/tls_version/{tls_version}`

Retrieves the top locations, by HTTP requests, of the requested TLS protocol version.

### `GET /radar/http/summary/bot_class` *(deprecated)*

Retrieves the distribution of bot-generated HTTP requests to genuine human traffic, as classified by Cloudflare. Visit for more information.

### `GET /radar/http/summary/device_type` *(deprecated)*

Retrieves the distribution of HTTP requests generated by mobile, desktop, and other types of devices.

### `GET /radar/http/summary/http_protocol` *(deprecated)*

Retrieves the distribution of HTTP requests by HTTP protocol (HTTP vs. HTTPS).

### `GET /radar/http/summary/http_version` *(deprecated)*

Retrieves the distribution of HTTP requests by HTTP version.

### `GET /radar/http/summary/ip_version` *(deprecated)*

Retrieves the distribution of HTTP requests by IP version.

### `GET /radar/http/summary/os` *(deprecated)*

Retrieves the distribution of HTTP requests by operating system (Windows, macOS, Android, iOS, and others).

### `GET /radar/http/summary/tls_version` *(deprecated)*

Retrieves the distribution of HTTP requests by TLS version.

### `GET /radar/http/summary/post_quantum` *(deprecated)*

Retrieves the distribution of HTTP requests by post-quantum support.

### `GET /radar/http/timeseries_groups/tls_version` *(deprecated)*

Retrieves the distribution of HTTP requests by TLS version over time.

### `GET /radar/http/timeseries_groups/bot_class` *(deprecated)*

Retrieves the distribution of HTTP requests classified as automated or human over time. Visit for more information.

### `GET /radar/http/timeseries_groups/browser` *(deprecated)*

Retrieves the distribution of HTTP requests by user agent over time.

### `GET /radar/http/timeseries_groups/browser_family` *(deprecated)*

Retrieves the distribution of HTTP requests by user agent family over time.

### `GET /radar/http/timeseries_groups/device_type` *(deprecated)*

Retrieves the distribution of HTTP requests by device type over time.

### `GET /radar/http/timeseries_groups/http_protocol` *(deprecated)*

Retrieves the distribution of HTTP requests by HTTP protocol (HTTP vs. HTTPS) over time.

### `GET /radar/http/timeseries_groups/http_version` *(deprecated)*

Retrieves the distribution of HTTP requests by HTTP version over time.

### `GET /radar/http/timeseries_groups/ip_version` *(deprecated)*

Retrieves the distribution of HTTP requests by IP version over time.

### `GET /radar/http/timeseries_groups/os` *(deprecated)*

Retrieves the distribution of HTTP requests by operating system over time.

### `GET /radar/http/timeseries_groups/post_quantum` *(deprecated)*

Retrieves the distribution of HTTP requests by post-quantum support over time.

### `GET /radar/http/top/browser` *(deprecated)*

Retrieves the top user agents by HTTP requests.

### `GET /radar/http/top/browser_family` *(deprecated)*

Retrieves the top user agents, aggregated in families, by HTTP requests.

---

## Leaked Credential Checks

### `GET /radar/leaked_credential_checks/summary/{dimension}`

Retrieves an aggregated summary of HTTP authentication requests grouped by the specified dimension.

### `GET /radar/leaked_credential_checks/timeseries_groups/{dimension}`

Retrieves the distribution of HTTP authentication requests, grouped by the specified dimension over time.

### `GET /radar/leaked_credential_checks/summary/bot_class` *(deprecated)*

Retrieves the distribution of HTTP authentication requests by bot class.

### `GET /radar/leaked_credential_checks/summary/compromised` *(deprecated)*

Retrieves the distribution of HTTP authentication requests by compromised credential status.

### `GET /radar/leaked_credential_checks/timeseries_groups/bot_class` *(deprecated)*

Retrieves the distribution of HTTP authentication requests by bot class over time.

### `GET /radar/leaked_credential_checks/timeseries_groups/compromised` *(deprecated)*

Retrieves the distribution of HTTP authentication requests by compromised credential status over time.

---

## Netflows

### `GET /radar/netflows/timeseries`

Retrieves network traffic (NetFlows) over time.

### `GET /radar/netflows/summary` *(deprecated)*

Retrieves the distribution of network traffic (NetFlows) by HTTP vs other protocols.

### `GET /radar/netflows/summary/{dimension}`

Retrieves the distribution of network traffic (NetFlows) by the specified dimension.

### `GET /radar/netflows/timeseries_groups/{dimension}`

Retrieves the distribution of NetFlows traffic, grouped by the specified dimension over time.

### `GET /radar/netflows/top/ases`

Retrieves the top autonomous systems by network traffic (NetFlows).

### `GET /radar/netflows/top/locations`

Retrieves the top locations by network traffic (NetFlows).

---

## Origins

### `GET /radar/origins`

Retrieves a list of origins with their regions.

### `GET /radar/origins/{slug}`

Retrieves the requested origin information with its regions.

### `GET /radar/origins/timeseries`

Retrieves the time series of origin metrics for the specified origin.

### `GET /radar/origins/summary/{dimension}`

Retrieves an aggregated summary of origin metrics grouped by the specified dimension.

### `GET /radar/origins/timeseries_groups/{dimension}`

Retrieves the distribution of origin metrics grouped by the specified dimension over time.

---

## Post Quantum

### `GET /radar/post_quantum/origin/summary/{dimension}`

Get Origin Post Quantum Data Over Time \-> Envelope<{ meta, serie\_0 }\>

### `GET /radar/post_quantum/origin/timeseries_groups/{dimension}`

[Radar](https://developers.cloudflare.com/api/resources/radar/)[Post Quantum](https://developers.cloudflare.com/api/resources/radar/subresources/post%5Fquantum/)

### `GET /radar/post_quantum/tls/support`

Tests whether a hostname or IP address supports Post-Quantum (PQ) TLS key exchange. Returns information about the negotiated key exchange algorithm and whether it uses PQ cryptography.

---

## Quality

### `GET /radar/quality/iqi/summary`

Retrieves a summary (percentiles) of bandwidth, latency, or DNS response time from the Radar Internet Quality Index (IQI).

### `GET /radar/quality/iqi/timeseries_groups`

Retrieves a time series (percentiles) of bandwidth, latency, or DNS response time from the Radar Internet Quality Index (IQI).

### `GET /radar/quality/speed/summary`

Retrieves a summary of bandwidth, latency, jitter, and packet loss, from the previous 90 days of Cloudflare Speed Test data.

### `GET /radar/quality/speed/histogram`

Retrieves a histogram from the previous 90 days of Cloudflare Speed Test data, split into fixed bandwidth (Mbps), latency (ms), or jitter (ms) buckets.

### `GET /radar/quality/speed/top/ases`

Retrieves the top autonomous systems by bandwidth, latency, jitter, or packet loss, from the previous 90 days of Cloudflare Speed Test data.

### `GET /radar/quality/speed/top/locations`

Retrieves the top locations by bandwidth, latency, jitter, or packet loss, from the previous 90 days of Cloudflare Speed Test data.

---

## Ranking

### `GET /radar/ranking/timeseries_groups`

Retrieves domains rank over time.

### `GET /radar/ranking/top`

Retrieves the top or trending domains based on their rank. Popular domains are domains of broad appeal based on how people use the Internet. Trending domains are domains that are generating a surge in interest. For more information on top domains, see.

### `GET /radar/ranking/domain/{domain}`

Retrieves domain rank details. Cloudflare provides an ordered rank for the top 100 domains, but for the remainder it only provides ranking buckets like top 200 thousand, top one million, etc.. These are available through Radar datasets endpoints.

### `GET /radar/ranking/internet_services/timeseries_groups`

Retrieves Internet Services rank update changes over time.

### `GET /radar/ranking/internet_services/top`

Retrieves top Internet services based on their rank.

### `GET /radar/ranking/internet_services/categories`

Retrieves the list of Internet services categories.

---

## Robots Txt

### `GET /radar/robots_txt/top/domain_categories`

Retrieves the top domain categories by the number of robots.txt files parsed.

### `GET /radar/robots_txt/top/user_agents/directive`

Retrieves the top user agents on robots.txt files.

---

## Search

### `GET /radar/search/global`

Searches for locations, autonomous systems, reports, bots, certificate logs, certificate authorities, industries and verticals

---

## Tcp Resets Timeouts

### `GET /radar/tcp_resets_timeouts/summary`

Retrieves the distribution of connection stage by TCP connections terminated within the first 10 packets by a reset or timeout.

### `GET /radar/tcp_resets_timeouts/timeseries_groups`

Retrieves the distribution of connection stage by TCP connections terminated within the first 10 packets by a reset or timeout over time.

---

## Tlds

### `GET /radar/tlds`

Retrieves a list of TLDs.

### `GET /radar/tlds/{tld}`

Retrieves the requested TLD information.

---

## Traffic Anomalies

### `GET /radar/traffic_anomalies`

Retrieves the latest Internet traffic anomalies, which are signals that might indicate an outage. These alerts are automatically detected by Radar and manually verified by our team.

### `GET /radar/traffic_anomalies/locations`

Retrieves the sum of Internet traffic anomalies, grouped by location. These anomalies are signals that might indicate an outage, automatically detected by Radar and manually verified by our team.

---

## Verified Bots

> Use [Radar Bots](#bots) API instead of these deprecated endpoints.

### `GET /radar/verified_bots/top/bots` *(deprecated)*

Retrieves the top verified bots by HTTP requests, with owner and category.

**Query:** `asn`, `continent`, `dateEnd`, `dateRange`, `dateStart`, `format` (JSON/CSV), `limit`, `location`, `name`

**Response example:**
```json
{
  "success": true,
  "result": {
    "meta": {
      "dateRange": [{"startTime": "...", "endTime": "..."}],
      "normalization": "PERCENTAGE",
      "units": [{"name": "*", "value": "requests"}]
    },
    "top_0": [
      {"botCategory": "Search Engine Crawler", "botName": "GoogleBot", "botOwner": "Google", "value": "10"}
    ]
  }
}
```

### `GET /radar/verified_bots/top/categories` *(deprecated)*

Retrieves the top verified bot categories by HTTP requests, along with their corresponding percentage, over the total verified bot HTTP requests.

---

## Accounts

### `POST /accounts/{account_id}/ai/tomarkdown` *(deprecated)*

Convert Files into Markdown

---
