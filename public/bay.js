/* Saginaw Bay Report live engine.
   Buoy wind via /api/bay (NDBC has no CORS). River flow and water temperature
   direct from USGS, and air temperature from the NWS, both of which send
   access-control-allow-origin *.

   Vocabulary rule: the shore reads here are geometry plus weather. Nothing on
   this site claims fish will bite, and nothing declares the bay safe. */
(function () {
  'use strict';

  /* Saginaw Bay geometry.
     The bay's long axis runs roughly southwest to northeast. A shore is in the
     lee when the wind blows FROM it out over the water, because then there is
     no fetch behind it. Each shore below stores the arc of wind directions that
     puts it in the lee, expressed as a center bearing and a half width. */
  var ZONES = [
    {
      key: 'inner', name: 'Inner Bay',
      towns: 'Bay City, Linwood, Pinconning',
      leeCenter: 250, leeHalf: 65,          // wind from W and SW
      href: '/inner-bay.html',
      stacked: 'Linwood and the shipping channel edge'
    },
    {
      key: 'eastern', name: 'Eastern Bay',
      towns: 'Sebewaing, Bay Port, Caseville',
      leeCenter: 85, leeHalf: 60,           // wind from E and NE
      href: '/eastern-bay.html',
      stacked: 'Callahan Reef up toward Sebewaing, Bay Port and Caseville'
    },
    {
      key: 'south', name: 'River mouth and south end',
      towns: 'Bay City, Essexville, Quanicassee',
      leeCenter: 185, leeHalf: 50,          // wind from S
      href: '/saginaw-river.html',
      stacked: 'the river mouth and the Quanicassee flats'
    }
  ];

  // The Lower Bay has no lee by definition: 18 to 35 feet of open water with no
  // shoreline close enough to hide behind. It is never offered as shelter.
  var LOWER = { name: 'Lower Bay', href: '/lower-bay.html' };

  /* Fetch length by wind direction. Wind along the bay axis, roughly from the
     northeast or the southwest, has the most open water behind it; from the
     northeast it also has open Lake Huron feeding straight in. */
  function fetchClass(deg) {
    if (deg === null || deg === undefined) return null;
    var d = ((deg % 360) + 360) % 360;
    if (d >= 15 && d <= 75) return { label: 'longest', factor: 1.35, note: 'Northeast wind has the length of the bay and open Lake Huron behind it, driving water into the shallow southwest corner.' };
    if (d > 75 && d < 115) return { label: 'moderate', factor: 1.0, note: 'East wind crosses the bay, so waves build but stay short.' };
    if (d >= 115 && d <= 245) return { label: 'long', factor: 1.2, note: 'South and southwest wind runs up the bay axis toward the outer bay.' };
    if (d > 245 && d < 295) return { label: 'moderate', factor: 1.0, note: 'West wind crosses the bay toward the east shore.' };
    return { label: 'long', factor: 1.25, note: 'North and northwest wind has a long run down the bay.' };
  }

  // Smallest absolute difference between two bearings, 0 to 180.
  function angDiff(a, b) {
    var d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  }

  function classify(deg) {
    if (deg === null || deg === undefined) return { lee: null, windward: null };
    var lee = null, best = 999;
    ZONES.forEach(function (s) {
      var d = angDiff(deg, s.leeCenter);
      if (d <= s.leeHalf && d < best) { best = d; lee = s; }
    });
    // the windward shore is the one whose lee arc is closest to the opposite bearing
    var opp = (deg + 180) % 360, wind = null, bw = 999;
    ZONES.forEach(function (s) {
      var d = angDiff(opp, s.leeCenter);
      if (d < bw) { bw = d; wind = s; }
    });
    if (lee && wind && lee.key === wind.key) wind = null;
    return { lee: lee, windward: wind };
  }

  function msToMph(ms) { return ms * 2.23694; }
  function cToF(c) { return c * 9 / 5 + 32; }

  function cardinal(deg) {
    if (deg === null || deg === undefined) return '';
    var p = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return p[Math.round(deg / 22.5) % 16];
  }

  /* Launch read. Blunt on purpose: it exists to catch the flat mornings and the
     days nobody should be in the middle of this bay in a small boat. */
  function launchRead(mph, fc) {
    if (mph === null || mph === undefined) return { label: 'No data', cls: 'stale', why: 'No buoy wind right now.' };
    var eff = mph * (fc ? fc.factor : 1);
    if (eff < 8) return { label: 'Calm', cls: 'go', why: 'Light wind and little fetch. Good conditions anywhere on the bay.' };
    if (eff < 15) return { label: 'Workable', cls: 'go', why: 'A walleye chop. Comfortable on the lee shore, manageable elsewhere.' };
    if (eff < 21) return { label: 'Rough', cls: 'caution', why: 'Short steep chop building. Lee shore only for a small boat, and watch the ride home.' };
    if (eff < 28) return { label: 'Small boats in', cls: 'stay', why: 'The open bay is a bad idea in anything small. The river is sheltered.' };
    return { label: 'Stay in', cls: 'stay', why: 'Nobody should be out in the middle of this bay today.' };
  }

  function set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }
  function fmt(n, dp) {
    if (n === null || n === undefined || isNaN(n)) return 'n/a';
    return Number(n).toFixed(dp === undefined ? 0 : dp);
  }
  function stamp(iso) {
    try {
      return new Date(iso).toLocaleString('en-US',
        { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (e) { return iso; }
  }

  /* ------------------------------------------------------------ fetches */
  function getBay() {
    return fetch('/api/bay').then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // Saginaw River at Holland Avenue: discharge, gage height, water temperature.
  // This gauge can read NEGATIVE when wind stacks the bay back up the river,
  // which is a real signal about the whole bay rather than an error.
  // Lake Huron water level at Harbor Beach. Sustained wind moves water along the
  // bay axis, so level against the long term mean is another read on stacking.
  var HURON_MEAN_FT = 577.5;
  function getLevel() {
    var url = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest' +
      '&station=9075014&product=water_level&datum=IGLD&units=english&time_zone=gmt&format=json';
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.data || !j.data.length) return null;
        var v = parseFloat(j.data[j.data.length - 1].v);
        return isFinite(v) ? { ft: v, vsMean: v - HURON_MEAN_FT, at: j.data[j.data.length - 1].t } : null;
      })
      .catch(function () { return null; });
  }

  function getRiver() {
    var url = 'https://waterservices.usgs.gov/nwis/iv/?format=json' +
      '&sites=04157005,04157060&parameterCd=00060,00010,00065,63680&siteStatus=all';
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.value || !j.value.timeSeries) return null;
        var out = { flow: null, tempC: null, stage: null, turbidity: null };
        j.value.timeSeries.forEach(function (ts) {
          var code = ts.variable.variableCode[0].value;
          var vals = ts.values[0] && ts.values[0].value;
          if (!vals || !vals.length) return;
          var v = parseFloat(vals[vals.length - 1].value);
          if (!isFinite(v) || v === -999999) return;
          if (code === '00060') out.flow = v;
          if (code === '00010') out.tempC = v;
          if (code === '00065') out.stage = v;
          if (code === '63680' && out.turbidity === null) out.turbidity = v;
        });
        return out;
      })
      .catch(function () { return null; });
  }

  /* ------------------------------------------------------------ render */
  function render(bay, river, level) {
    var stations = (bay && bay.stations) || [];
    var fresh = stations.filter(function (s) { return s.ok && !s.stale && s.windDirDeg !== null; });
    var primary = fresh.filter(function (s) { return s.id === 'SBLM4'; })[0] || fresh[0] || null;

    // buoy table
    stations.forEach(function (s) {
      var row = document.getElementById('row-' + s.id);
      if (!row) return;
      var cells = row.querySelectorAll('[data-f]');
      var mph = s.windSpeedMs !== null && s.windSpeedMs !== undefined ? msToMph(s.windSpeedMs) : null;
      var gmph = s.gustMs !== null && s.gustMs !== undefined ? msToMph(s.gustMs) : null;
      var vals = {
        wind: s.ok && mph !== null ? fmt(mph) + ' ' + cardinal(s.windDirDeg) : 'n/a',
        gust: s.ok && gmph !== null ? fmt(gmph) : 'n/a',
        atmp: s.ok && s.airTempC !== null ? fmt(cToF(s.airTempC)) : 'n/a'
      };
      for (var i = 0; i < cells.length; i++) {
        var f = cells[i].getAttribute('data-f');
        if (f === 'status') {
          if (!s.ok) cells[i].innerHTML = '<span class="badge stale">offline</span>';
          else if (s.stale) cells[i].innerHTML = '<span class="badge stale">stale ' + fmt(s.ageHours, 0) + 'h</span>';
          else cells[i].innerHTML = '<span class="badge go">live</span>';
        } else if (vals[f] !== undefined) {
          cells[i].textContent = vals[f];
        }
      }
    });

    var bs = document.getElementById('buoy-stamp');
    if (bs) {
      var live = fresh.length;
      bs.textContent = live + ' of ' + stations.length + ' stations reporting fresh wind. Anything older than ' +
        ((bay && bay.staleAfterHours) || 3) + ' hours is marked stale rather than shown as current. ' +
        'The outer bay buoy is frequently offline outside the shipping season.';
    }

    var mph = primary && primary.windSpeedMs !== null ? msToMph(primary.windSpeedMs) : null;
    var gust = primary && primary.gustMs !== null ? msToMph(primary.gustMs) : null;
    var fc = primary ? fetchClass(primary.windDirDeg) : null;
    var lr = launchRead(mph, fc);
    var cls = primary ? classify(primary.windDirDeg) : { lee: null, windward: null };

    set('s-wind', mph === null ? 'n/a' : fmt(mph) + ' ' + cardinal(primary.windDirDeg));
    set('s-winddir', primary ? 'from the ' + cardinal(primary.windDirDeg) + ' at ' + primary.name : 'no station');
    set('s-gust', gust === null ? 'n/a' : fmt(gust));
    set('s-launch', lr.label);
    set('season-stage', lr.label);

    if (river) {
      if (river.flow !== null) {
        set('s-river', fmt(river.flow));
        set('s-river-sub', river.flow < 0 ? 'cfs, running upstream' : 'cfs at Saginaw');
      } else { set('s-river', 'n/a'); }
      set('s-wtmp', river.tempC !== null ? fmt(cToF(river.tempC)) : 'n/a');
    } else {
      set('s-river', 'n/a'); set('s-wtmp', 'n/a');
    }

    // the two shore panel
    var leeEl = document.getElementById('shore-lee');
    var wEl = document.getElementById('shore-wind');
    if (cls.lee) {
      set('lee-name', cls.lee.name);
      set('lee-text', 'Wind is coming off this shore, so there is no fetch behind it. Flat water at the ramp and ' +
        'the most comfortable fishing. Access at ' + cls.lee.towns + '.');
      if (leeEl) leeEl.classList.add('lee');
    } else {
      set('lee-name', primary ? 'No clear lee shore' : 'Waiting on wind data');
      set('lee-text', primary
        ? 'This wind direction does not put any shore of the inner bay in a clean lee. Expect chop most places, and ' +
          'consider the river.'
        : 'No fresh buoy wind, so the shore read is unavailable.');
    }
    if (cls.windward) {
      set('wind-name', cls.windward.name);
      set('wind-text', 'Water and current are pushing this way, which is where bait and walleye tend to concentrate ' +
        'after a day or two of steady wind. Local pattern puts fish around ' + cls.windward.stacked +
        '. This is also the rough shore today.');
      if (wEl) wEl.classList.add('windward');
    } else {
      set('wind-name', primary ? 'Spread out' : 'Waiting on wind data');
      set('wind-text', primary
        ? 'Not enough wind or too variable a direction to stack water on one shore.'
        : 'No fresh buoy wind, so the stacking read is unavailable.');
    }

    var fn = document.getElementById('fetch-note');
    if (fn && fc) fn.textContent = 'Fetch: ' + fc.label + '. ' + fc.note;

    // narrative
    var readEl = document.getElementById('the-read');
    if (readEl) {
      var parts = [];
      if (!primary) {
        parts.push('No fresh wind observation from the bay buoys right now, so the shore read is unavailable. ' +
          'The NWS marine forecast for Saginaw Bay is the fallback.');
      } else {
        parts.push('Wind is ' + fmt(mph) + ' mph from the ' + cardinal(primary.windDirDeg) +
          ' at ' + primary.name + (gust !== null ? ', gusting ' + fmt(gust) : '') + '.');
        parts.push(lr.why);
        if (cls.lee) parts.push('The ' + cls.lee.name.toLowerCase() + ' is in the lee.');
        if (cls.windward) parts.push('Water is stacking toward the ' + cls.windward.name.toLowerCase() + '.');
        if (cls.lee && cls.windward) {
          parts.push('That is the usual trade on this bay: the comfortable shore and the productive shore are ' +
            'opposite each other.');
        }
      }
      if (river && river.flow !== null && river.flow < 0) {
        parts.push('The Saginaw River gauge is reading ' + fmt(river.flow) + ' cfs, which means the bay is being ' +
          'pushed back up the river rather than draining out of it.');
      }
      if (river && river.turbidity !== null) {
        var clarity = river.turbidity < 10 ? 'clear' : (river.turbidity < 25 ? 'lightly stained' : 'dirty');
        parts.push('River turbidity at Saginaw is ' + fmt(river.turbidity, 1) + ' NTU, which is ' + clarity +
          '. What the river carries today generally reaches the inner bay within about half a day, so this is a ' +
          'preview of tomorrow\'s water colour rather than a reading of today\'s.');
      }
      if (level) {
        parts.push('Lake Huron at Harbor Beach is ' + fmt(level.ft, 2) + ' feet, ' +
          (level.vsMean >= 0 ? fmt(level.vsMean, 2) + ' above' : fmt(Math.abs(level.vsMean), 2) + ' below') +
          ' the long term mean.');
      }
      parts.push('Wind and water are measurements. Whether fish bite is not.');
      readEl.textContent = parts.join(' ');
    }

    var rs = document.getElementById('read-stamp');
    if (rs) {
      rs.textContent = 'Buoy wind from NOAA NDBC' +
        (primary ? ', observed ' + stamp(primary.observedAt) : '') +
        '. River flow and water temperature from USGS gauge 04157005 on the Saginaw River at Saginaw. ' +
        'Shore reads are computed from wind direction and bay geometry.';
    }
  }

  function boot() {
    Promise.all([getBay(), getRiver(), getLevel()])
      .then(function (r) { render(r[0], r[1], r[2]); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
