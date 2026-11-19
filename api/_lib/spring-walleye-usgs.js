"use strict";

const { STATIONS } = require("./spring-walleye");

// One USGS instantaneous-values request for all five official gauges.
// Observations and reporting times remain raw; downstream logic checks freshness.
const URL = "https://waterservices.usgs.gov/nwis/iv/";
function normalizeSamples(payload) {
  const samples = Object.fromEntries(STATIONS.map(station=>[station.id,{}]));
  for (const row of payload?.value?.timeSeries || []) {
    const id = row?.sourceInfo?.siteCode?.[0]?.value;
    if (!Object.hasOwn(samples,id)) continue;
    const parameter = row?.variable?.variableCode?.[0]?.value;
    if (parameter !== "00010" && parameter !== "00060") continue;
    const candidates = (row?.values || []).flatMap(group=>group?.value || [])
      .filter(point=>point && Number.isFinite(Number(point.value)) && Number.isFinite(Date.parse(point.dateTime)));
    candidates.sort((a,b)=>Date.parse(b.dateTime)-Date.parse(a.dateTime));
    if (!candidates.length) continue;
    const sample = candidates[0];
    const value = Number(sample.value);
    if (parameter === "00010") {
      if (value < -5 || value > 40) continue;
      samples[id].waterTempF = Math.round((value*9/5+32)*10)/10;
      samples[id].tempObservedAt = sample.dateTime;
    } else {
      if (Math.abs(value) > 300000) continue;
      samples[id].flowCfs = value;
      samples[id].flowObservedAt = sample.dateTime;
    }
  }
  return samples;
}
async function fetchSpringRiverSamples(fetcher=fetch) {
  const query = new URLSearchParams({
    format:"json",
    sites:STATIONS.map(s=>s.id).join(","),
    period:"PT12H",
    parameterCd:"00010,00060",
    siteStatus:"all",
  });
  const response = await fetcher(URL+"?"+query,{
    headers:{Accept:"application/json","User-Agent":"SaginawBayReport-SpringFieldDesk/1.0"},
    signal:AbortSignal.timeout(11000)
  });
  if(!response.ok) throw new Error("USGS observation source unavailable: "+response.status);
  const payload = await response.json();
  if (!Array.isArray(payload?.value?.timeSeries)) throw new Error("USGS observations malformed");
  return normalizeSamples(payload);
}
module.exports={fetchSpringRiverSamples,normalizeSamples};
