// Saginaw Bay Report — NWS Weather Forecasts
//
// Three grids: Bay City (inner bay), Mid Bay, Outer Bay (Au Gres)
// DTX = Detroit Weather Forecast Office

import { NWS_GRIDS } from './sources.js';

const UA = 'SaginawBayFishing/1.0 (freighterviewfarms.com)';

async function timedFetch(url, ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, 'Accept': 'application/geo+json' }
    });
    clearTimeout(t);
    return r;
  } catch(e) { clearTimeout(t); throw e; }
}

function interpretCloudCover(forecast) {
  const f = (forecast || '').toLowerCase();
  if (/sunny|clear/.test(f))          return { code: 'sunny',   fishNote: 'Bright sun: fish go deep and tight to structure. Best early and late.' };
  if (/mostly cloudy|overcast/.test(f)) return { code: 'cloudy', fishNote: 'Overcast: fish more active, looser on structure. Good trolling conditions.' };
  if (/partly/.test(f))               return { code: 'partial', fishNote: 'Partly cloudy: solid conditions. Fish active during cloud cover.' };
  if (/rain|shower/.test(f))          return { code: 'rain',    fishNote: 'Rain can push walleye shallow and active. Fish edges and drop-offs.' };
  if (/snow/.test(f))                 return { code: 'snow',    fishNote: 'Snow: fish slow, stay tight to bottom structure.' };
  return                                { code: 'variable', fishNote: 'Variable sky — watch for clouds to time bite windows.' };
}

function findBestFishingWindow(periods) {
  if (!periods?.length) return null;
  const scored = periods.slice(0, 8).filter(p => p.isDaytime).map(p => {
    let score = 0;
    const tempF = p.temperatureUnit === 'C' ? p.temperature * 9/5 + 32 : p.temperature;
    const rain  = p.probabilityOfPrecipitation?.value || 0;
    const ws    = p.windSpeed || '';
    const maxWind = Math.max(...(ws.match(/\d+/g) || [0]).map(Number));
    const f     = (p.shortForecast || '').toLowerCase();

    // Temperature scoring for bay fishing
    if (tempF >= 45 && tempF <= 70) score += 3;
    else if (tempF >= 38) score += 1;

    // Wind scoring (bay needs lighter wind)
    if (maxWind <= 8)  score += 4;
    else if (maxWind <= 12) score += 2;
    else if (maxWind <= 18) score += 0;
    else score -= 2;

    // Rain
    if (rain <= 20) score += 1;
    else if (rain >= 60) score -= 1;

    // Cloud cover (overcast = good walleye bite)
    if (/mostly cloudy|overcast/.test(f)) score += 2;
    if (/partly/.test(f)) score += 1;

    const maxWindN = Math.max(...(ws.match(/\d+/g) || [0]).map(Number));
    return { ...p, score, tempF: Math.round(tempF), maxWind: maxWindN, rain };
  });

  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  return {
    name: best.name,
    tempF: best.tempF,
    forecast: best.shortForecast,
    rain: best.rain,
    wind: best.windSpeed,
    maxWind: best.maxWind,
    score: best.score,
    worthGoing: best.score >= 4,
  };
}

async function fetchGridForecast(gridKey) {
  const grid = NWS_GRIDS[gridKey];
  if (!grid) return null;
  const url = `https://api.weather.gov/gridpoints/${grid.cwa}/${grid.gridX},${grid.gridY}/forecast`;
  try {
    const r = await timedFetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    return d.properties?.periods || [];
  } catch(e) {
    console.error(`[weather] ${gridKey} error:`, e.message);
    return null;
  }
}

async function fetchGridHourly(gridKey) {
  const grid = NWS_GRIDS[gridKey];
  if (!grid) return null;
  const url = `https://api.weather.gov/gridpoints/${grid.cwa}/${grid.gridX},${grid.gridY}/forecast/hourly`;
  try {
    const r = await timedFetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    return (d.properties?.periods || []).slice(0, 24);
  } catch(e) {
    console.error(`[weather] ${gridKey} hourly error:`, e.message);
    return null;
  }
}

export async function fetchBayWeather() {
  // Fetch inner bay (Bay City) as primary, mid and outer in parallel
  const [bayCity7day, bayCity_hr, outer7day] = await Promise.all([
    fetchGridForecast('bay_city'),
    fetchGridHourly('bay_city'),
    fetchGridForecast('outer_bay'),
  ]);

  if (!bayCity7day) return null;

  const today   = bayCity7day.find(p => p.isDaytime) || bayCity7day[0];
  const tonight = bayCity7day.find(p => !p.isDaytime) || bayCity7day[1];

  const todayTempF = today.temperatureUnit === 'C' ? Math.round(today.temperature * 9/5 + 32) : today.temperature;
  const todayRain  = today.probabilityOfPrecipitation?.value || 0;
  const todayWS    = today.windSpeed || '';
  const todayWind  = Math.max(...(todayWS.match(/\d+/g) || [0]).map(Number));
  const todayCloud = interpretCloudCover(today.shortForecast);

  const week = bayCity7day.filter(p => p.isDaytime).slice(0, 7).map(p => {
    const tF  = p.temperatureUnit === 'C' ? Math.round(p.temperature * 9/5 + 32) : p.temperature;
    const rain = p.probabilityOfPrecipitation?.value || 0;
    const ws   = p.windSpeed || '';
    const maxW = Math.max(...(ws.match(/\d+/g) || [0]).map(Number));
    return {
      name: p.name,
      tempF: tF,
      forecast: p.shortForecast,
      rain,
      wind: p.windSpeed,
      maxWind: maxW,
      cloud: interpretCloudCover(p.shortForecast),
      goodForFishing: maxW <= 12 && rain <= 30,
    };
  });

  // Add overnight lows
  const nights = bayCity7day.filter(p => !p.isDaytime);
  week.forEach((day, i) => {
    if (nights[i]) {
      day.tempLow = nights[i].temperatureUnit === 'C'
        ? Math.round(nights[i].temperature * 9/5 + 32)
        : nights[i].temperature;
    }
  });

  // Rain trend
  const rainNext48 = bayCity7day.slice(0, 4).map(p => p.probabilityOfPrecipitation?.value || 0);
  const maxRain48  = Math.max(...rainNext48);

  // Hourly
  const hourly = (bayCity_hr || []).slice(0, 12).map(h => ({
    time:  h.startTime,
    tempF: h.temperatureUnit === 'C' ? Math.round(h.temperature * 9/5 + 32) : h.temperature,
    rain:  h.probabilityOfPrecipitation?.value || 0,
    wind:  h.windSpeed,
    short: h.shortForecast,
  }));

  const bestWindow = findBestFishingWindow(bayCity7day);

  return {
    today: {
      name:      today.name,
      tempF:     todayTempF,
      forecast:  today.shortForecast,
      detail:    today.detailedForecast,
      rain:      todayRain,
      wind:      today.windSpeed,
      windDir:   today.windDirection,
      maxWind:   todayWind,
      cloud:     todayCloud,
    },
    tonight: tonight ? {
      name:    tonight.name,
      tempF:   tonight.temperatureUnit === 'C' ? Math.round(tonight.temperature * 9/5 + 32) : tonight.temperature,
      forecast: tonight.shortForecast,
      rain:    tonight.probabilityOfPrecipitation?.value || 0,
    } : null,
    week,
    bestWindow,
    maxRain48,
    hourly,
    fetchedAt: new Date().toISOString(),
  };
}
