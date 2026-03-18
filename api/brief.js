// GET /api/brief
// Generates AI conditions brief from cached bay data.
// Called client-side after /api/generate returns.
// Cached 1 hour in Redis separately from main data.

import { Redis } from '@upstash/redis';
import Anthropic from '@anthropic-ai/sdk';

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'No API key' });

  const redis   = makeRedis();
  const now     = new Date();
  const hourKey = now.toISOString().slice(0, 13);
  const cacheKey = `bay:brief:${hourKey}`;

  // Cache check
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return res.status(200).json({ success: true, cached: true, ...parsed });
      }
    } catch(e) { /* non-fatal */ }
  }

  // Pull the cached generate data rather than re-fetching everything
  let genData = null;
  if (redis) {
    try {
      const genKey = `bay:generate:${hourKey}`;
      const cached = await redis.get(genKey);
      if (cached) {
        genData = typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch(e) { /* non-fatal */ }
  }

  if (!genData) {
    return res.status(503).json({ success: false, error: 'No cached data yet — call /api/generate first' });
  }

  // Build prompt from cached data
  const wind     = genData.wind;
  const w        = wind?.wind || {};
  const interp   = w.interpretation || {};
  const r        = genData.water?.river?.['04157005'] || {};
  const wx       = genData.weather?.today || {};
  const bestWin  = genData.weather?.bestWindow;
  const season   = genData.season || {};
  const zones    = genData.zones || [];
  const reports  = (genData.reports?.items || []).slice(0, 2);

  const reportSummary = reports
    .map(r => `[${r.source}]: ${r.content.slice(0, 280)}`)
    .join('\n\n');

  const zoneLines = zones.map(z =>
    `${z.name}: ${z.rating?.label} — ${z.rating?.tagline}`
  ).join('\n');

  const prompt = `You are a Saginaw Bay fishing guide from Bay City, Michigan writing a daily conditions brief for local walleye and perch anglers.

TODAY'S DATA:
Wind: ${w.wspd_mph !== null && w.wspd_mph !== undefined ? `${w.wspd_mph} mph from ${w.dirLabel} (${interp.label})` : 'buoy offline for the season'}
${w.gst_mph ? `Gusts: ${w.gst_mph} mph` : ''}
${interp.boatAdvice ? `Boat advisory: ${interp.boatAdvice}` : ''}
${interp.dirNote ? `Wind effect: ${interp.dirNote}` : ''}

Saginaw River: ${r.flow ? `${r.flow.toLocaleString()} cfs (${(r.flowInterp || {}).label})` : 'no data'}
Turbidity: ${r.turbidity_fnu !== null && r.turbidity_fnu !== undefined ? `${r.turbidity_fnu} FNU (${(r.turbidityInterp || {}).label})` : 'no sensor data'}
River temp: ${r.temp_f ? `${r.temp_f}°F` : 'N/A'}
Dissolved oxygen: ${r.do_mgl ? `${r.do_mgl} mg/L` : 'N/A'}

NWS Forecast: ${wx.tempF}°F, ${wx.forecast}, ${wx.rain}% rain chance, wind ${wx.wind}
${bestWin && bestWin.name !== wx.name ? `Best upcoming window: ${bestWin.name} — ${bestWin.tempF}°F, max wind ${bestWin.maxWind} mph` : ''}

Zone ratings:
${zoneLines}

Season context: ${season.label} — ${season.note || ''}

Recent fishing reports:
${reportSummary || 'No fresh weekly reports available yet.'}

Write 2-3 tight paragraphs in the voice of a Bay City charter captain who fishes this water every day. Be specific and direct. Tell anglers whether it is worth going out. Call out which zone offers the best shot today if wind and water allow. Mention specific techniques or locations when the reports give you something to work with. If conditions are dangerous, say so plainly. No em dashes. No bullet points. No hedging.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 450,
      messages: [{ role: 'user', content: prompt }],
    });

    const brief = response.content[0]?.text || null;
    const payload = { brief, season, generatedAt: now.toISOString() };

    if (redis && brief) {
      try { await redis.set(cacheKey, JSON.stringify(payload), { ex: CACHE_TTL }); }
      catch(e) { /* non-fatal */ }
    }

    return res.status(200).json({ success: true, cached: false, ...payload });
  } catch(e) {
    console.error('[brief] Anthropic error:', e.message, e.status, JSON.stringify(e.error || ''));
    return res.status(500).json({ success: false, error: e.message });
  }
}
