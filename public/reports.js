/* Live National Weather Service marine forecast for Saginaw Bay.
   Two zones are issued separately by the Detroit office inside one text
   product: LHZ422 Inner Saginaw Bay and LHZ421 Outer Saginaw Bay.

   This is quoted rather than summarised because it is a US federal government
   work in the public domain, and because a marine forecast is exactly the kind
   of thing that should not be paraphrased. Everything else on the reports page
   is linked, not copied. */
(function () {
  'use strict';

  var ZONES = [
    { code: 'LHZ422', slot: 'inner' },
    { code: 'LHZ421', slot: 'outer' }
  ];

  function set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }

  // The product is fixed width text. Each zone block starts with its code and
  // ends at the next zone code or the end of the product. Inside, forecast
  // periods begin with a dot and a heading in caps.
  function extractZone(text, code) {
    var start = text.indexOf(code + '-');
    if (start < 0) return null;
    var rest = text.slice(start);
    var nextIdx = rest.slice(1).search(/\n(?:LHZ|LMZ|LEZ|LSZ|LOZ)\d{3}-/);
    if (nextIdx > -1) rest = rest.slice(0, nextIdx + 1);

    var lines = rest.split('\n');
    var title = [];
    var i = 1;
    // zone name lines run until the timestamp line
    for (; i < lines.length; i++) {
      var l = lines[i].trim();
      if (!l) continue;
      if (/^\d{3,4}\s+(AM|PM)\s/.test(l)) { break; }
      title.push(l.replace(/-$/, ''));
    }
    var issued = (lines[i] || '').trim();

    var periods = [];
    var current = null;
    for (i = i + 1; i < lines.length; i++) {
      var line = lines[i];
      var m = line.match(/^\.([A-Z0-9 .'/-]+?)\.\.\.(.*)$/);
      if (m) {
        if (current) periods.push(current);
        current = { name: m[1].trim(), text: m[2].trim() };
      } else if (current && line.trim()) {
        current.text += ' ' + line.trim();
      } else if (current && !line.trim()) {
        periods.push(current); current = null;
      }
    }
    if (current) periods.push(current);

    return { title: title.join(' ').replace(/\s+/g, ' ').trim(), issued: issued, periods: periods };
  }

  function titleCase(s) {
    return s.toLowerCase().replace(/\b([a-z])/g, function (m, c) { return c.toUpperCase(); });
  }

  function renderZone(slot, zone) {
    var body = document.getElementById('marine-' + slot + '-body');
    var zlabel = document.getElementById('marine-' + slot + '-zone');
    if (!body) return;
    if (!zone || !zone.periods.length) {
      body.innerHTML = '<p style="margin:0">The marine forecast is not reachable right now. ' +
        '<a href="https://forecast.weather.gov/shmrn.php?mz=lhz422">Read it on weather.gov</a>.</p>';
      return;
    }
    if (zlabel && zone.title) zlabel.textContent = zone.title;
    var html = '';
    zone.periods.slice(0, 4).forEach(function (p) {
      html += '<p style="margin:0 0 8px"><strong>' + titleCase(p.name) + '.</strong> ' + p.text + '</p>';
    });
    body.innerHTML = html;
  }

  function boot() {
    if (!document.getElementById('marine-inner-body')) return;

    fetch('https://api.weather.gov/products?type=NSH&location=DTX&limit=1',
          { headers: { Accept: 'application/ld+json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var list = j && (j['@graph'] || j.graph);
        if (!list || !list.length) throw new Error('no product');
        return fetch(list[0]['@id'], { headers: { Accept: 'application/ld+json' } });
      })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (p) {
        if (!p || !p.productText) throw new Error('no text');
        ZONES.forEach(function (z) {
          renderZone(z.slot, extractZone(p.productText, z.code));
        });
        var stamp = document.getElementById('marine-stamp');
        if (stamp) {
          var t = p.issuanceTime ? new Date(p.issuanceTime) : null;
          stamp.textContent = 'Nearshore Marine Forecast issued by the National Weather Service, Detroit and ' +
            'Pontiac office' +
            (t ? ', ' + t.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '') +
            '. Quoted in full because it is a public domain federal product. Forecasts are reissued through ' +
            'the day, so check weather.gov before relying on it.';
        }
      })
      .catch(function () {
        ZONES.forEach(function (z) { renderZone(z.slot, null); });
        var stamp = document.getElementById('marine-stamp');
        if (stamp) stamp.textContent = 'Could not reach the National Weather Service product feed.';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
