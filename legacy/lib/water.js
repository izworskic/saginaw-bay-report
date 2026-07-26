// Saginaw Bay Report — Water Conditions (USGS + NOAA)
//
// Saginaw River gauges tell you what's coming into the bay:
//   - Turbidity: will the bay be clear or muddy?
//   - Flow: high flow = off-color water, fish pushed to cleaner areas
//   - Temperature: proxy for inner bay water temp in spring/fall
//   - DO: fish health and activity
//
// Lake Huron water level affects depth on shallow structure

import { GAUGES, WATER_LEVEL } from './sources.js';

const STALE_MS = 48 * 60 * 60 * 1000;

async function timedFetch(url, ms = 12000) {
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

function isFresh(dt) {
  if (!dt) return false;
  return (Date.now() - new Date(dt).getTime()) < STALE_MS;
}

function cToF(c) {
  if (c === null || c === undefined) return null;
  return Math.round((c * 9/5 + 32) * 10) / 10;
}

// Turbidity interpretation — bay fishing context
function interpretTurbidity(fnu) {
  if (fnu === null) return null;
  if (fnu < 5)   return { label: 'Clear',           note: 'Excellent clarity. Bay should be fishable everywhere.', bayImpact: 'good' };
  if (fnu < 15)  return { label: 'Slightly Cloudy', note: 'Minor turbidity. Inner bay may have slight color but outer bay clear.', bayImpact: 'ok' };
  if (fnu < 40)  return { label: 'Turbid',          note: 'River pushing murky water into the bay. Inner bay will be off-color. Fish the outer bay or eastern shore.', bayImpact: 'poor' };
  if (fnu < 100) return { label: 'Muddy',           note: 'Heavy turbidity. Bay clarity compromised. Fish will move to cleaner water — outer lower bay or east side.', bayImpact: 'bad' };
  return            { label: 'Very Muddy',          note: 'Extreme turbidity from high river flow. Fishing will be very tough in the inner bay. Wait for flow to drop.', bayImpact: 'terrible' };
}

// River flow interpretation for bay context
function interpretFlow(cfs) {
  if (cfs === null) return null;
  // Saginaw River at Holland Ave historical context
  if (cfs < 3000)  return { label: 'Low',           note: 'Low river flow. Bay water should be clearing.' };
  if (cfs < 8000)  return { label: 'Normal',        note: 'Normal flow. Stable bay conditions.' };
  if (cfs < 15000) return { label: 'Above Normal',  note: 'Elevated flow pushing into inner bay. Some color expected.' };
  if (cfs < 25000) return { label: 'High',          note: 'High flow. Inner bay will be turbid. Move to outer or eastern bay.' };
  return             { label: 'Flood Stage',        note: 'River in flood. Inner bay fishing will be poor. Wait this out.' };
}

// DO interpretation
function interpretDO(mgl) {
  if (mgl === null) return null;
  if (mgl >= 11) return { label: 'Excellent', note: 'Highly oxygenated. Fish active and feeding.' };
  if (mgl >= 8)  return { label: 'Good',      note: 'Good oxygen. Normal fish activity.' };
  if (mgl >= 6)  return { label: 'Adequate',  note: 'Acceptable. Fish may be less active.' };
  return           { label: 'Low',            note: 'Low oxygen. Fish stressed. Avoid catch-and-release.' };
}

export async function fetchRiverData() {
  const siteIds = Object.keys(GAUGES).join(',');
  const params  = '00060,00010,63680,00300,00095,00065';
  const url     = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${siteIds}&parameterCd=${params}&siteStatus=active`;

  try {
    const r = await timedFetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const series = d.value?.timeSeries || [];

    const readings = {};
    for (const s of series) {
      const siteId = s.sourceInfo?.siteCode?.[0]?.value;
      const param  = s.variable?.variableCode?.[0]?.value;
      const vals   = s.values?.[0]?.value || [];
      const latest = vals.find(v => v.value !== '-999999') || vals[0];
      const raw    = latest ? parseFloat(latest.value) : null;
      const value  = (raw === null || isNaN(raw) || raw === -999999) ? null : raw;
      const dt     = latest?.dateTime || null;

      if (!readings[siteId]) readings[siteId] = {
        siteId,
        name: GAUGES[siteId]?.name || siteId,
        flow: null, temp_c: null, turbidity_fnu: null,
        do_mgl: null, conductance: null, gage: null,
        timestamp: null
      };

      if (param === '00060') { readings[siteId].flow = value; if (dt) readings[siteId].timestamp = dt; }
      if (param === '00010') readings[siteId].temp_c = isFresh(dt) ? value : null;
      if (param === '63680') readings[siteId].turbidity_fnu = isFresh(dt) ? value : null;
      if (param === '00300') readings[siteId].do_mgl = isFresh(dt) ? value : null;
      if (param === '00095') readings[siteId].conductance = isFresh(dt) ? value : null;
      if (param === '00065') readings[siteId].gage = isFresh(dt) ? value : null;
    }

    // Enrich the Holland Ave gauge (richest data)
    const hollandAve = readings['04157005'];
    if (hollandAve) {
      const tempF = cToF(hollandAve.temp_c);
      hollandAve.temp_f = tempF;
      hollandAve.turbidityInterp = interpretTurbidity(hollandAve.turbidity_fnu);
      hollandAve.flowInterp = interpretFlow(hollandAve.flow);
      hollandAve.doInterp = interpretDO(hollandAve.do_mgl);
    }

    return readings;
  } catch(e) {
    console.error('[water] river fetch error:', e.message);
    return {};
  }
}

export async function fetchLakeLevel() {
  const url = `https://tidesandcurrents.noaa.gov/api/prod/datagetter?station=${WATER_LEVEL.station}&product=water_level&datum=IGLD&time_zone=GMT&units=english&range=24&format=json`;
  try {
    const r = await timedFetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const data = d.data || [];
    if (!data.length) return null;
    const latest = data[data.length - 1];
    const levelFt = parseFloat(latest.v);
    const deltaFt = Math.round((levelFt - WATER_LEVEL.normalFt) * 100) / 100;
    return {
      levelFt,
      deltaFt,
      station: WATER_LEVEL.name,
      timestamp: latest.t,
      note: deltaFt > 0.5
        ? `Lake ${deltaFt.toFixed(2)} ft above average — shallow structure more accessible.`
        : deltaFt < -0.5
        ? `Lake ${Math.abs(deltaFt).toFixed(2)} ft below average — some shallow spots may be tighter.`
        : 'Lake level near average.',
    };
  } catch(e) {
    console.error('[water] lake level error:', e.message);
    return null;
  }
}
