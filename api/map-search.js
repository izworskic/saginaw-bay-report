import { readFile } from 'node:fs/promises';

const sourcePath = new URL('../public/map.html', import.meta.url);

const replacements = [
  [
    '<title>Saginaw Bay Map: Boat Launches, Live Buoys, and Named Water</title>',
    '<title>Saginaw Bay Fishing Map: Launches, Buoys & Callahan Reef</title>',
  ],
  [
    '<meta name="description" content="Interactive Saginaw Bay map with ten public boat launches, three live NOAA buoys, and the named water anglers use, across the Inner, Lower, and Eastern Bay.">',
    '<meta name="description" content="Interactive Saginaw Bay fishing map with 10 public launches, live NOAA buoys, Callahan Reef, shipping channel, Spoils Island and other named water.">',
  ],
  [
    '<meta property="og:title" content="Saginaw Bay Map: Boat Launches, Live Buoys, and Named Water">',
    '<meta property="og:title" content="Saginaw Bay Fishing Map: Launches, Buoys & Callahan Reef">',
  ],
  [
    '<meta property="og:description" content="Interactive Saginaw Bay map with ten public boat launches, three live NOAA buoys, and the named water anglers use, across the Inner, Lower, and Eastern Bay.">',
    '<meta property="og:description" content="Interactive Saginaw Bay fishing map with 10 public launches, live NOAA buoys, Callahan Reef, shipping channel, Spoils Island and other named water.">',
  ],
  [
    '"name":"Saginaw Bay Map: Launches, Buoys, and Named Water"',
    '"name":"Saginaw Bay Fishing Map: Launches, Buoys, and Named Water"',
  ],
  [
    '"description":"Interactive Saginaw Bay map showing public boat launches, live NOAA buoys, and the named water anglers actually use, split across the Inner, Lower, and Eastern Bay."',
    '"description":"Interactive Saginaw Bay fishing map showing 10 public boat launches, live NOAA buoys, Callahan Reef, the shipping channel, Spoils Island, Wildfowl Bay, and other named water."',
  ],
  [
    '"inLanguage":"en-US","author"',
    '"inLanguage":"en-US","dateModified":"2026-08-23","author"',
  ],
  [
    '<h1 style="font-size:30px;margin:22px 0 0">Saginaw Bay map</h1>',
    '<h1 style="font-size:30px;margin:22px 0 0">Saginaw Bay Fishing Map</h1>',
  ],
  [
    '<p class="lede">Every public launch, every live buoy, and the named water people actually give each other directions by. Click any marker for detail and a link through to the zone it sits in.</p>',
    '<p class="lede">Use this Saginaw Bay fishing map to locate 10 public launches, three live NOAA wind stations, Callahan Reef, the shipping channel, Spoils Island, Wildfowl Bay, and other named water across the Inner, Lower, and Eastern Bay.</p>',
  ],
];

export default async function handler(req, res) {
  let html = await readFile(sourcePath, 'utf8');

  for (const [from, to] of replacements) {
    if (!html.includes(from)) {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end('Search treatment source assertion failed.');
      return;
    }
    html = html.replace(from, to);
  }

  const required = [
    '<link rel="canonical" href="https://saginawbay.chrisizworski.com/map.html">',
    'Saginaw Bay Fishing Map: Launches, Buoys & Callahan Reef',
    'Saginaw Bay Fishing Map</h1>',
    '"dateModified":"2026-08-23"',
    'Callahan Reef',
    'Lake Huron DNR Launch, Patterson Road',
    'Saginaw Bay Light #1',
    'Named water markers are approximate centres for orientation and are not navigation marks.',
  ];

  if (required.some((needle) => !html.includes(needle))) {
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Search treatment verification failed.');
    return;
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', 'public, s-maxage=300, stale-while-revalidate=900');
  res.end(html);
}
