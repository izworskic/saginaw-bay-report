"use strict";
const {STATIONS,assemble} = require("./_lib/spring-walleye");
const {fetchSpringRiverSamples} = require("./_lib/spring-walleye-usgs");

module.exports = async function handler(req,res) {
  res.setHeader("X-Robots-Tag","noindex, nofollow");
  res.setHeader("Cache-Control","public, s-maxage=600, stale-while-revalidate=300");
  res.setHeader("Content-Type","application/json; charset=utf-8");
  if(req.method!=="GET"&&req.method!=="HEAD"){
    res.setHeader("Allow","GET, HEAD");
    return res.status(405).json({error:"GET only"});
  }
  let samples={}, error=null;
  try { samples=await fetchSpringRiverSamples(); }
  catch(e) { error="One or more official gauge observations could not be refreshed"; }
  const data=assemble(samples);
  data.sources=STATIONS.map(station=>({
    id:station.id,name:"USGS "+station.name,
    url:"https://waterdata.usgs.gov/monitoring-location/"+station.id+"/",
    status:data.stations.find(s=>s.id===station.id)?.waterTempF===null?"missing-or-stale":"current"
  }));
  if(error) data.sourceStatus=error;
  if(req.method==="HEAD") return res.status(200).end();
  return res.status(200).json(data);
};
