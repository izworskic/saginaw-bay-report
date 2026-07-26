// GET /api/generate
// Returns full bay conditions: wind, water, weather, zone ratings, AI brief
// Cached 1 hour in Redis

import { Redis } from '@upstash/redis';
import { fetchAllBuoys, getPrimaryWind } from '../lib/wind.js';
import { fetchRiverData, fetchLakeLevel } from '../lib/water.js';
import { fetchBayWeather } from '../lib/weather.js';
import { fetchAllReports } from '../lib/reports.js';
import { ZONES } from '../lib/sources.js';
import { rateZone, getSeasonContext } from '../lib/rater.js';

function makeRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const CACHE_TTL = 60 * 60; // 1 hour

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis  = makeRedis();
  const now    = new Date();
  const dateKey = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH bucket
  const cacheKey = `bay:generate:${dateKey}`;

  // Cache check
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json({ success: true, cached: true, ...parsed });
      }
    } catch(e) { /* non-fatal */ }
  }

  try {
    // Fetch everything in parallel
    const [buoys, riverData, lakeLevel, weather, reports] = await Promise.all([
      fetchAllBuoys(),
      fetchRiverData(),
      fetchLakeLevel(),
      fetchBayWeather(),
      fetchAllReports(),
    ]);

    const primaryWind = getPrimaryWind(buoys);
    const month = now.getMonth() + 1;
    const tempF  = riverData?.['04157005']?.temp_f ?? null;
    const season = getSeasonContext(month, tempF);

    // Rate each zone
    const zones = Object.entries(ZONES).map(([id, zone]) => {
      const rating = rateZone(id, primaryWind, riverData);
      return {
        id,
        name: zone.name,
        subtitle: zone.subtitle,
        description: zone.description,
        species: zone.species,
        typicalDepths: zone.typicalDepths,
        hotSpots: zone.hotSpots,
        launches: zone.launches,
        rating,
        zoneReports: reports?.zones?.[id] || [],
      };
    });

    const payload = {
      zones,
      wind: primaryWind,
      buoys,
      water: {
        river: riverData,
        lakeLevel,
      },
      weather,
      reports: {
        items: (reports?.reports || []).slice(0, 3).map(r => ({
          source: r.source,
          url: r.url,
          date: r.date,
          content: r.content.slice(0, 400),
        })),
      },
      season,
      generatedAt: now.toISOString(),
    };

    if (redis) {
      try { await redis.set(cacheKey, JSON.stringify(payload), { ex: CACHE_TTL }); }
      catch(e) { /* non-fatal */ }
    }

    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json({ success: true, cached: false, ...payload });
  } catch(e) {
    console.error('[generate] error:', e);
    return res.status(500).json({ success: false, error: e.message });
  }
}
