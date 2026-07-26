// Saginaw Bay Report — Wind Data (NDBC)
//
// Wind is THE primary variable for Saginaw Bay fishing.
// It determines: boat safety, fish location (pushed baitfish),
// trolling angle, wave height, and whether charters run.

import { BUOYS } from './sources.js';

const STALE_MS = 3 * 60 * 60 * 1000; // 3 hours — buoys go offline in winter

async function timedFetch(url, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'SaginawBayFishing/1.0 (freighterviewfarms.com)' }
    });
    clearTimeout(t);
    return r;
  } catch(e) { clearTimeout(t); throw e; }
}

// Parse NDBC fixed-width text format
function parseNdbcLine(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 8) return null;
  const [yr, mo, dy, hr, mn] = parts;
  const wdir = parts[5] !== 'MM' ? parseInt(parts[5]) : null;
  const wspd = parts[6] !== 'MM' ? parseFloat(parts[6]) : null; // m/s
  const gst  = parts[7] !== 'MM' ? parseFloat(parts[7]) : null; // m/s
  const atmp = parts.length > 13 && parts[13] !== 'MM' ? parseFloat(parts[13]) : null;
  const pres = parts.length > 12 && parts[12] !== 'MM' ? parseFloat(parts[12]) : null;

  const dateStr = `${yr}-${mo}-${dy}T${hr}:${mn}:00Z`;
  return {
    dateTime: dateStr,
    wdir,
    wspd_ms: wspd,
    gst_ms:  gst,
    wspd_mph: wspd !== null ? Math.round(wspd * 2.237 * 10) / 10 : null,
    gst_mph:  gst  !== null ? Math.round(gst  * 2.237 * 10) / 10 : null,
    wspd_kts: wspd !== null ? Math.round(wspd * 1.944 * 10) / 10 : null,
    atmp_c:   atmp,
    atmp_f:   atmp !== null ? Math.round((atmp * 9/5 + 32) * 10) / 10 : null,
    pres_hpa: pres,
  };
}

function directionLabel(deg) {
  if (deg === null) return null;
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

// Bay-specific wind interpretation for fishing
function interpretWind(wspd_mph, wdir) {
  if (wspd_mph === null) return null;

  let rating, label, boatAdvice, fishingNote;

  if (wspd_mph < 5) {
    rating = 'CALM';
    label  = 'Flat Calm';
    boatAdvice = 'All boats go.';
    fishingNote = 'Glass conditions. Fish can see everything — lighter line, longer leaders. Best early morning before any breeze develops.';
  } else if (wspd_mph < 10) {
    rating = 'GOOD';
    label  = 'Light Chop';
    boatAdvice = 'All boats go.';
    fishingNote = 'Good fishing chop. Wave action concentrates baitfish. Trolling is easy, presentation is clean.';
  } else if (wspd_mph < 15) {
    rating = 'FISHABLE';
    label  = 'Moderate Chop';
    boatAdvice = 'All boats. Stay aware.';
    fishingNote = 'Fishable for most. Wind may push walleye tight to certain shorelines — fish the lee side.';
  } else if (wspd_mph < 20) {
    rating = 'ROUGH';
    label  = 'Rough';
    boatAdvice = 'Small boats use caution. 17ft+ recommended.';
    fishingNote = 'Challenging. Experienced bay anglers can manage. Walleye often stack up on wind-pushed shorelines — can be productive if you can hold position.';
  } else if (wspd_mph < 25) {
    rating = 'DANGEROUS';
    label  = 'Dangerous';
    boatAdvice = 'Small boats stay in. Larger boats with caution only.';
    fishingNote = 'Stay home unless you have a big boat and know this water cold. Saginaw Bay builds steep chop fast.';
  } else {
    rating = 'STAY_HOME';
    label  = 'Stay Home';
    boatAdvice = 'No recreational fishing. All boats stay in.';
    fishingNote = 'Saginaw Bay is dangerous in these conditions. No fish is worth it.';
  }

  // Wind direction effects on fish location
  let dirNote = null;
  if (wdir !== null) {
    const dir = directionLabel(wdir);
    if (['SW','WSW','W','WNW'].includes(dir)) {
      dirNote = `${dir} wind pushes baitfish and walleye toward the eastern shoreline — Sebewaing, Wildfowl Bay, Fish Point.`;
    } else if (['NW','NNW','N','NNE'].includes(dir)) {
      dirNote = `${dir} wind concentrates fish along the southern and inner bay shorelines. Thomas Road area can fire up.`;
    } else if (['SE','ESE','E','ENE'].includes(dir)) {
      dirNote = `${dir} wind pushes fish toward the western and inner bay. Bay City area and the shipping channel edge.`;
    } else if (['S','SSW','SSE'].includes(dir)) {
      dirNote = `${dir} wind — check the northern shorelines. Fish stack up where current meets structure.`;
    }
  }

  return { rating, label, boatAdvice, fishingNote, dirNote };
}

export async function fetchBuoyData(buoyId) {
  const buoy = BUOYS[buoyId];
  if (!buoy) return null;

  try {
    const r = await timedFetch(buoy.dataUrl);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    const lines = text.split('\n').filter(l => !l.startsWith('#') && l.trim());

    // Find the most recent reading with wind data
    let latest = null;
    for (const line of lines.slice(0, 10)) {
      const parsed = parseNdbcLine(line);
      if (parsed && parsed.wspd_mph !== null) {
        // Check freshness
        const age = Date.now() - new Date(parsed.dateTime).getTime();
        if (age < STALE_MS) {
          latest = parsed;
          break;
        }
      }
    }

    if (!latest) {
      console.log(`[wind] ${buoyId}: no fresh data`);
      return { buoyId, buoy, online: false, stale: true };
    }

    const windInterp = interpretWind(latest.wspd_mph, latest.wdir);
    const dirLabel   = directionLabel(latest.wdir);

    return {
      buoyId,
      buoy,
      online: true,
      stale: false,
      wind: {
        ...latest,
        dirLabel,
        interpretation: windInterp,
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch(e) {
    console.error(`[wind] ${buoyId} error:`, e.message);
    return { buoyId, buoy, online: false, error: e.message };
  }
}

export async function fetchAllBuoys() {
  const results = await Promise.all(Object.keys(BUOYS).map(id => fetchBuoyData(id)));
  const out = {};
  for (const r of results) {
    if (r) out[r.buoyId] = r;
  }
  return out;
}

// Primary bay wind — use SBLM4, fall back to GSLM4
export function getPrimaryWind(buoys) {
  const sblm4 = buoys['SBLM4'];
  if (sblm4?.online && !sblm4.stale) return sblm4;
  const gslm4 = buoys['GSLM4'];
  if (gslm4?.online && !gslm4.stale) return gslm4;
  return null;
}
