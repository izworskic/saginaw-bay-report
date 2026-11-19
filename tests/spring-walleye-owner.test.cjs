'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {STATIONS,assemble,stationSnapshot}=require('../api/_lib/spring-walleye');
const {normalizeSamples}=require('../api/_lib/spring-walleye-usgs');
const {FISHERY_REPORTS}=require('../api/_lib/spring-walleye-evidence');
const when=Date.parse('2027-04-14T12:00:00Z');
const sample=(overrides={})=>({waterTempF:45,tempObservedAt:'2027-04-14T11:00:00Z',flowCfs:1500,flowObservedAt:'2027-04-14T11:00:00Z',...overrides});
test('five official gauges feed four non-invented fishery regions',()=>{
 assert.deepEqual(STATIONS.map(s=>s.id),['04157005','04156000','04165710','04193500','04198000']);
 const x=assemble({'04157005':sample(),'04156000':sample({waterTempF:52})},when);
 assert.equal(x.fishPresence,'unverified');
 assert.equal(x.status,'TEMPERATURE_CONTEXT');
 assert.equal(x.regions.length,4);
 assert.deepEqual(x.regions.map(r=>r.id),['saginaw','detroit','maumee','sandusky']);
 assert.equal(x.stations[0].code,'SPRING_WARMING');
 assert.equal(x.stations[1].code,'MILD_SPRING_WATER');
 assert.ok(x.regions.every(r=>r.fishPresence==='unverified'));
});
test('old and future readings are refused; reversed Saginaw flow is retained as measurement',()=>{
 const stale=assemble({'04157005':sample({tempObservedAt:'2027-04-13T00:00:00Z'})},when);
 assert.equal(stale.stations[0].waterTempF,null);
 const future=stationSnapshot(STATIONS[0],sample({tempObservedAt:'2027-04-16T11:00:00Z'}),when);
 assert.equal(future.waterTempF,null);
 const reversed=stationSnapshot(STATIONS[0],sample({flowCfs:-314,waterTempF:38}),when);
 assert.equal(reversed.flowCfs,-314,'USGS negative discharge can be legitimate bay-induced backwater');
 const winter=assemble({'04157005':sample()},Date.parse('2027-01-14T12:00:00Z'));
 assert.equal(winter.status,'OFF_SEASON');
});
test('USGS source parser preserves observed dates and never fills missing sensors with forecasts',()=>{
 const raw={value:{timeSeries:[
  {sourceInfo:{siteCode:[{value:'04157005'}]},variable:{variableCode:[{value:'00010'}]},values:[{value:[{value:'7.1',dateTime:'2027-04-14T11:00:00Z'}]}]},
  {sourceInfo:{siteCode:[{value:'04157005'}]},variable:{variableCode:[{value:'00060'}]},values:[{value:[{value:'-314',dateTime:'2027-04-14T11:10:00Z'}]}]},
  {sourceInfo:{siteCode:[{value:'99999999'}]},variable:{variableCode:[{value:'00010'}]},values:[{value:[{value:'8',dateTime:'2027-04-14T11:00:00Z'}]}]}
 ]}};
 const x=normalizeSamples(raw);
 assert.equal(x['04157005'].flowCfs,-314);
 assert.equal(x['04157005'].flowObservedAt,'2027-04-14T11:10:00Z');
 assert.ok(Math.abs(x['04157005'].waterTempF-44.78)<0.1);
 assert.deepEqual(x['04156000'],{});
 assert.ok(!Object.hasOwn(x,'99999999'));
});
test('reports remain historical even when source was refreshed recently',()=>{
 const x=assemble({},Date.parse('2027-04-14T12:00:00Z'));
 assert.ok(FISHERY_REPORTS.some(r=>r.issuedAt==='2026-06-05'));
 assert.ok(x.regions.every(r=>r.seasonEvidence==='NO_CURRENT_REPORT'));
 assert.ok(x.regions.every(r=>r.reports.every(r=>!r.currentSeason)));
});
test('canonical published HTML and source generator both contain spring desk, not a duplicate page',()=>{
 const html=fs.readFileSync('public/walleye.html','utf8');
 const py=fs.readFileSync('gen_site.py','utf8');
 const partial=fs.readFileSync('spring-walleye-widget.html','utf8');
 assert.match(html,/rel="canonical" href="https:\/\/saginawbay\.chrisizworski\.com\/walleye\.html"/);
 assert.ok(html.includes(partial),'published HTML must include the exact preserved generated fragment');
 assert.ok(html.includes('href="/spring-walleye.css"'));
 assert.ok(html.includes('src="/spring-walleye.js"'));
 assert.ok(py.includes('spring-walleye-widget.html')&&py.includes('spring-walleye.css')&&py.includes('spring-walleye.js'),'generator must retain changes');
 assert.equal((html.match(/id="spring-run"/g)||[]).length,1);
 assert.ok(html.includes('Saginaw Bay walleye through the season'),'keep preexisting intent, article and indexed copy');
 assert.match(html,/id="spring-official-report"/);
 const api=fs.readFileSync('api/spring-walleye.js','utf8');
 assert.match(api,/X-Robots-Tag/);
 assert.match(api,/missing-or-stale/);
});
