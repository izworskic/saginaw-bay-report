// Saginaw Bay Report — Weekly Fishing Report Scraper
//
// Sources (all confirmed accessible):
//   1. saginawbay.com        — weekly HTML posts, zone-by-zone breakdown
//   2. upnorthvoice.com      — DNR weekly report republisher
//   3. bluewaterhealthyliving.com — DNR report republisher
//   4. greatlakesfishermansdigest.com — charter captain reports
//   5. govdelivery.com       — actual Michigan DNR bulletin archive

const UA = 'SaginawBayFishing/1.0 (freighterviewfarms.com)';
const STALE_DAYS = 14; // ignore reports older than 2 weeks

async function timedFetch(url, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': UA }
    });
    clearTimeout(t);
    return r;
  } catch(e) { clearTimeout(t); throw e; }
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRecent(dateStr) {
  if (!dateStr) return true; // assume recent if unknown
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  return (Date.now() - d.getTime()) < STALE_DAYS * 24 * 60 * 60 * 1000;
}

// Extract zone-specific text from a full report
function extractZones(text) {
  const zones = {};
  const patterns = [
    { key: 'inner',   regex: /(?:inner saginaw bay|bay city area|linwood)([\s\S]{0,600}?)(?=\n\n|\w+ saginaw bay|\w+ bay:|$)/i },
    { key: 'lower',   regex: /(?:lower saginaw bay|thomas road|finn road)([\s\S]{0,600}?)(?=\n\n|\w+ saginaw bay|\w+ bay:|$)/i },
    { key: 'eastern', regex: /(?:eastern saginaw bay|east.*?bay|sebewaing|wildfowl bay)([\s\S]{0,600}?)(?=\n\n|\w+ saginaw bay|\w+ bay:|$)/i },
    { key: 'river',   regex: /(?:saginaw river|tittabawassee)([\s\S]{0,400}?)(?=\n\n|\w+ saginaw|$)/i },
  ];
  for (const { key, regex } of patterns) {
    const m = text.match(regex);
    if (m) zones[key] = m[0].slice(0, 500).trim();
  }
  return zones;
}

// Score a report for walleye/perch/pike relevance
function scoreReport(text) {
  const t = text.toLowerCase();
  let score = 0;
  const keywords = ['walleye','perch','pike','saginaw bay','crawler','trolling','fow','feet of water','blade','jigging'];
  for (const kw of keywords) {
    if (t.includes(kw)) score++;
  }
  return score;
}

// Source 1: saginawbay.com — most focused, zone-by-zone
async function fetchSaginawBayCom() {
  try {
    const listR = await timedFetch('https://saginawbay.com/weekly-fishing-reports.html');
    if (!listR.ok) throw new Error(`HTTP ${listR.status}`);
    const listHtml = await listR.text();

    // Extract first article URL
    const linkMatch = listHtml.match(/href="(https:\/\/saginawbay\.com\/[^"]+\.html)"/);
    if (!linkMatch) return null;

    const articleR = await timedFetch(linkMatch[1]);
    if (!articleR.ok) return null;
    const articleHtml = await articleR.text();

    // Date
    const dateMatch = articleHtml.match(/datetime="([^"]+)"/);
    const date = dateMatch ? dateMatch[1].slice(0, 10) : null;
    if (!isRecent(date)) return null;

    // Content
    const contentStart = articleHtml.indexOf('class="entry-content"');
    const contentEnd   = articleHtml.indexOf('</article>', contentStart);
    const content = stripHtml(articleHtml.slice(contentStart, contentEnd));

    return {
      source: 'saginawbay.com',
      url: linkMatch[1],
      date,
      content: content.slice(0, 1500),
      zones: extractZones(content),
      score: scoreReport(content),
    };
  } catch(e) {
    console.error('[reports] saginawbay.com:', e.message);
    return null;
  }
}

// Source 2: upnorthvoice.com — DNR weekly republisher
async function fetchUpNorthVoice() {
  try {
    // Search for most recent fishing report
    const searchR = await timedFetch('https://www.upnorthvoice.com/outdoors/?s=weekly+fishing+report');
    if (!searchR.ok) throw new Error(`HTTP ${searchR.status}`);
    const searchHtml = await searchR.text();

    // Find most recent article link
    const linkMatch = searchHtml.match(/href="(https:\/\/www\.upnorthvoice\.com\/outdoors\/\d{4}\/\d{2}\/weekly-fishing-report[^"]*?)"/);
    if (!linkMatch) return null;

    const articleR = await timedFetch(linkMatch[1]);
    if (!articleR.ok) return null;
    const articleHtml = await articleR.text();

    const dateMatch = articleHtml.match(/"datePublished":"([^"]+)"/);
    const date = dateMatch ? dateMatch[1].slice(0, 10) : null;
    if (!isRecent(date)) return null;

    const contentStart = articleHtml.indexOf('<article');
    const contentEnd   = articleHtml.indexOf('</article>');
    const content = stripHtml(articleHtml.slice(contentStart, contentEnd));

    // Find just the Saginaw Bay section
    const sagIdx = content.indexOf('Saginaw Bay');
    if (sagIdx === -1) return null;
    const sagContent = content.slice(sagIdx, sagIdx + 1200);

    return {
      source: 'Michigan DNR / Up North Voice',
      url: linkMatch[1],
      date,
      content: sagContent,
      zones: extractZones(sagContent),
      score: scoreReport(sagContent),
    };
  } catch(e) {
    console.error('[reports] upnorthvoice:', e.message);
    return null;
  }
}

// Source 3: Great Lakes Fisherman's Digest — charter captain reports
async function fetchFishermansDigest() {
  try {
    const r = await timedFetch('https://www.greatlakesfishermansdigest.com/index.php?page=Great_Lakes_Bay_Region&report=true');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    const content = stripHtml(html);

    const sagIdx = content.toLowerCase().indexOf('saginaw');
    if (sagIdx === -1) return null;
    const sagContent = content.slice(Math.max(0, sagIdx - 50), sagIdx + 800);

    return {
      source: "Great Lakes Fisherman's Digest",
      url: 'https://www.greatlakesfishermansdigest.com',
      date: null,
      content: sagContent.slice(0, 800),
      zones: extractZones(sagContent),
      score: scoreReport(sagContent),
    };
  } catch(e) {
    console.error('[reports] fishermansdigest:', e.message);
    return null;
  }
}

// Source 4: bluewaterhealthyliving.com — DNR report republisher, Bay City local
async function fetchBluewater() {
  try {
    // Recent reports index
    const searchR = await timedFetch('https://bluewaterhealthyliving.com/?s=weekly+fishing+report');
    if (!searchR.ok) throw new Error(`HTTP ${searchR.status}`);
    const searchHtml = await searchR.text();

    const linkMatch = searchHtml.match(/href="(https:\/\/bluewaterhealthyliving\.com\/[^"]+weekly-fishing-report[^"]+)"/);
    if (!linkMatch) return null;

    const articleR = await timedFetch(linkMatch[1]);
    if (!articleR.ok) return null;
    const html = await articleR.text();

    const dateMatch = html.match(/"datePublished":"([^"]+)"/);
    const date = dateMatch ? dateMatch[1].slice(0, 10) : null;
    if (!isRecent(date)) return null;

    const content = stripHtml(html);
    const sagIdx = content.indexOf('Saginaw');
    if (sagIdx === -1) return null;
    const sagContent = content.slice(sagIdx, sagIdx + 1000);

    return {
      source: 'Bluewater Healthy Living / Michigan DNR',
      url: linkMatch[1],
      date,
      content: sagContent,
      zones: extractZones(sagContent),
      score: scoreReport(sagContent),
    };
  } catch(e) {
    console.error('[reports] bluewater:', e.message);
    return null;
  }
}

export async function fetchAllReports() {
  const [sbc, unv, gfd, bw] = await Promise.allSettled([
    fetchSaginawBayCom(),
    fetchUpNorthVoice(),
    fetchFishermansDigest(),
    fetchBluewater(),
  ]);

  const reports = [sbc, unv, gfd, bw]
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(r => r !== null && r.score > 0)
    .sort((a, b) => b.score - a.score);

  // Merge zone intel across all sources
  const mergedZones = { inner: [], lower: [], eastern: [], river: [] };
  for (const report of reports) {
    for (const [zone, text] of Object.entries(report.zones || {})) {
      if (text && mergedZones[zone] !== undefined) {
        mergedZones[zone].push({ source: report.source, text, date: report.date });
      }
    }
  }

  return {
    reports: reports.slice(0, 4),
    zones:   mergedZones,
    fetchedAt: new Date().toISOString(),
  };
}
