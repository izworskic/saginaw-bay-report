// /api/bay — proxies NOAA NDBC buoy observations for Saginaw Bay.
//
// NDBC sends no CORS headers, so the browser cannot read it directly. This also
// lets us do the staleness judgment in one place: buoy 45163 in the outer bay
// was last reporting on 2026-07-14 when this was built, and rendering a twelve
// day old wind reading as "live" would be worse than showing nothing. Any
// observation older than the cutoff is returned flagged rather than dropped, so
// the page can say a station is stale instead of silently omitting it.

export const config = { runtime: 'edge' };

const UA = { 'User-Agent': 'saginaw-bay-report (saginawbay.chrisizworski.com)' };

const STATIONS = [
  { id: 'SBLM4', name: 'Saginaw Bay Light', where: 'inner bay' },
  { id: 'GSLM4', name: 'Gravelly Shoal Light', where: 'north end' },
  { id: 'TAWM4', name: 'Tawas Point', where: 'northwest corner' }
];

const STALE_HOURS = 3;

function num(v) {
  if (v === undefined || v === null || v === 'MM') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function readStation(st) {
  try {
    const r = await fetch('https://www.ndbc.noaa.gov/data/realtime2/' + st.id + '.txt', { headers: UA });
    if (!r.ok) return { ...st, ok: false, reason: 'http ' + r.status };
    const text = await r.text();
    const rows = text.split('\n').filter((l) => l && !l.startsWith('#'));
    if (!rows.length) return { ...st, ok: false, reason: 'no rows' };
    const p = rows[0].trim().split(/\s+/);
    // columns: YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP ...
    const obs = Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]), Number(p[3]), Number(p[4]));
    const ageHours = (Date.now() - obs) / 3600000;
    return {
      ...st,
      ok: true,
      stale: ageHours > STALE_HOURS,
      ageHours: Math.round(ageHours * 10) / 10,
      observedAt: new Date(obs).toISOString(),
      windDirDeg: num(p[5]),
      windSpeedMs: num(p[6]),
      gustMs: num(p[7]),
      waveHeightM: num(p[8]),
      airTempC: num(p[13]),
      waterTempC: num(p[14])
    };
  } catch (e) {
    return { ...st, ok: false, reason: 'fetch failed' };
  }
}

export default async function handler() {
  const stations = await Promise.all(STATIONS.map(readStation));
  return new Response(JSON.stringify({
    ok: true,
    generatedAt: new Date().toISOString(),
    staleAfterHours: STALE_HOURS,
    source: 'NOAA National Data Buoy Center realtime2',
    stations
  }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      // NDBC updates roughly every ten to twenty minutes; ten is plenty fresh
      // and keeps us off their servers on every page view.
      'cache-control': 'public, max-age=600, stale-while-revalidate=1800'
    }
  });
}
