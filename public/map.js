/* Saginaw Bay map.
   Renders public launches, live NOAA buoys, and named water on an OpenStreetMap
   base. Everything drawn here is also present as HTML tables further down the
   page, so the locations remain readable with JavaScript disabled and remain
   crawlable. This file only adds the interactive layer. */
(function () {
  'use strict';

  function boot() {
    var host = document.getElementById('baymap');
    var raw = document.getElementById('baydata');
    if (!host || !raw || typeof L === 'undefined') return;

    var data;
    try { data = JSON.parse(raw.textContent); } catch (e) { return; }

    var map = L.map('baymap', { scrollWheelZoom: false }).setView([43.85, -83.65], 9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    function dot(colour, r) {
      return { radius: r, color: '#ffffff', weight: 2, fillColor: colour, fillOpacity: 0.95 };
    }

    var bounds = [];

    // launches, coloured by zone
    (data.launches || []).forEach(function (l) {
      var z = data.zones[l.zone] || {};
      var m = L.circleMarker([l.lat, l.lon], dot(z.colour || '#1d6b4f', 7)).addTo(map);
      m.bindPopup(
        '<strong>' + l.name + '</strong><br>' + l.town + '<br>' +
        '<span style="font-size:12px">' + l.note + '</span><br>' +
        '<a href="' + (z.href || '/') + '">' + (z.name || 'Zone') + ' detail</a> &middot; ' +
        '<a href="/launches-and-access.html">Which ramp today</a>'
      );
      bounds.push([l.lat, l.lon]);
    });

    // named water, hollow markers so they read as orientation rather than access
    (data.spots || []).forEach(function (s) {
      var z = data.zones[s.zone] || {};
      var m = L.circleMarker([s.lat, s.lon], {
        radius: 6, color: z.colour || '#5d6b63', weight: 2,
        fillColor: '#ffffff', fillOpacity: 0.85, dashArray: '3,3'
      }).addTo(map);
      m.bindPopup(
        '<strong>' + s.name + '</strong><br><span style="font-size:12px">' + s.note + '</span><br>' +
        '<a href="' + (z.href || '/') + '">' + (z.name || 'Zone') + ' detail</a>'
      );
      bounds.push([s.lat, s.lon]);
    });

    // buoys, filled in once the live observation arrives
    var buoyMarkers = {};
    (data.buoys || []).forEach(function (b) {
      var m = L.circleMarker([b.lat, b.lon], dot('#a8541f', 9)).addTo(map);
      m.bindPopup('<strong>' + b.id + '</strong> ' + b.name + '<br>' + b.where +
        '<br><span style="font-size:12px">Loading wind.</span>');
      buoyMarkers[b.id] = m;
      bounds.push([b.lat, b.lon]);
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [28, 28] });

    // click to enable wheel zoom, so the page still scrolls normally on mobile
    map.on('click', function () { map.scrollWheelZoom.enable(); });

    function cardinal(deg) {
      var p = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      return p[Math.round(deg / 22.5) % 16];
    }

    fetch('/api/bay')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.stations) return;
        j.stations.forEach(function (s) {
          var m = buoyMarkers[s.id];
          if (!m) return;
          var body;
          if (!s.ok) {
            body = 'Station offline.';
          } else if (s.windSpeedMs === null || s.windSpeedMs === undefined) {
            body = 'Reporting, but no wind value.';
          } else {
            var mph = (s.windSpeedMs * 2.23694).toFixed(0);
            body = mph + ' mph from the ' + cardinal(s.windDirDeg) +
              (s.stale ? '<br><em>Stale, observed ' + s.ageHours + ' hours ago.</em>'
                       : '<br>Observed within the last few hours.');
          }
          m.setPopupContent('<strong>' + s.id + '</strong> ' + s.name + '<br>' + s.where +
            '<br><span style="font-size:12px">' + body + '</span><br>' +
            '<a href="/wind-and-fish-location.html">What this wind means</a>');
          if (s.ok && !s.stale) m.setStyle({ fillColor: '#1d6b4f' });
          else m.setStyle({ fillColor: '#9a9a9a' });
        });
      })
      .catch(function () { /* map still works without live wind */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
