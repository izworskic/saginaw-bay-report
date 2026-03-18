// GET /api/generate
// Returns full bay conditions: wind, water, weather, zone ratings, AI brief
// Cached 1 hour in Redis

import { Redis } from '@upstash/redis';
import Anthropic from '@anthropic-ai/sdk';
import { fetchAllBuoys, getPrimaryWind } from '../lib/wind.js';
import { fetchRiverData, fetchLakeLevel } from '../lib/water.js';
import { fetchBayWeather } from '../lib/weather.js';
import { fetchAllReports } from '../lib/reports.js';
import { ZONES, SEASONS } from '../lib/sources.js';
import { rateZone, getSeasonContext, RATINGS } from '../lib/rater.js';

function makeRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const CACHE_TTL = 60 * 60; // 1 hour

async function generateAIBrief(wind, water, weather, reports, season) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });
  const now = new Date();
  const month = now.getMonth() + 1;

  const windSpd  = wind?.wind?.wspd_mph;
  const windDir  = wind?.wind?.dirLabel;
  const windRat  = wind?.wind?.interpretation?.label;
  const turb     = water?.['04157005']?.turbidity_fnu;
  const turbLabel = water?.['04157005']?.turbidityInterp?.label;
  const flow     = water?.['04157005']?.flow;
  const riverTemp = water?.['04157005']?.temp_f;
  const wxToday  = weather?.today;
  const bestWin  = weather?.bestWindow;

  const reportSummary = (reports?.reports || [])
    .slice(0, 2)
    .map(r => `[${r.source}]: ${r.content.slice(0, 300)}`)
    .join('\n\n');

  const prompt = `You are a knowledgeable Saginaw Bay fishing guide from Bay City, Michigan. Write a concise, honest daily conditions brief for local walleye and perch anglers.

TODAY'S CONDITIONS:
- Wind: ${windSpd !== null && windSpd !== undefined ? `${windSpd} mph from ${windDir} (${windRat})` : 'buoy offline'}
- Saginaw River turbidity: ${turb !== null && turb !== undefined ? `${turb} FNU (${turbLabel})` : 'no sensor data'}
- Saginaw River flow: ${flow ? `${flow.toLocaleString()} cfs` : 'N/A'}
- River water temp: ${riverTemp ? `${riverTemp}°F` : 'N/A'}
- NWS Forecast: ${wxToday?.tempF}°F, ${wxToday?.forecast}, ${wxToday?.rain}% rain, wind ${wxToday?.wind}
${bestWin && bestWin.name !== wxToday?.name ? `- Best upcoming window: ${bestWin.name} — ${bestWin.tempF}°F, ${bestWin.forecast}, max wind ${bestWin.maxWind} mph` : ''}
- Season: ${season?.label} — ${season?.primarySpecies}

RECENT FISHING REPORTS:
${reportSummary || 'No fresh reports available.'}

Write 2-3 tight paragraphs in the voice of a Bay City charter captain who fishes this water every day. Be direct — tell people whether it's worth going. Name specific locations and techniques when the reports have intel. If wind is too high, say so plainly. No em dashes. No bullet points. No fluff.`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0]?.text || null;
  } catch(e) {
    console.error('[generate] AI brief error:', e.message);
    return null;
  }
}

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

    // AI brief
    const brief = await generateAIBrief(primaryWind, riverData, weather, reports, season);

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
      brief,
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
