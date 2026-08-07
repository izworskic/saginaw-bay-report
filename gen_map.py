import pathlib
import json, pathlib, sys
sys.path.insert(0, "/home/claude/sbr")
from gen_chrome import head, header, FOOTER, breadcrumb, PERSON_NODE, PERSON_ID, SITE

OUT = pathlib.Path(__file__).resolve().parent / "public"

# Coordinates resolved from a places lookup rather than estimated. Each of these
# is a real, named public access point.
LAUNCHES = [
    dict(name="Lake Huron DNR Launch, Patterson Road", lat=43.6405, lon=-83.8506,
         zone="inner", town="Bay City",
         note="At the mouth of the Saginaw River. Paved ramps with three docks, busy on weekends, "
              "no wake zone up and down the river. The most flexible starting point because the river "
              "is right there when the bay is unfishable."),
    dict(name="Linwood Beach Marina", lat=43.7332, lon=-83.9466,
         zone="inner", town="Linwood",
         note="Well kept and efficient even on holiday weekends. The classic west side jumping off "
              "point into the middle of the inner bay."),
    dict(name="Bay County Pinconning Park", lat=43.8532, lon=-83.9244,
         zone="inner", town="Pinconning",
         note="County park with a launch, beach, and boardwalk. Day use fee. Good option when you "
              "want the north end of the inner bay."),
    dict(name="Pine River Access", lat=43.9766, lon=-83.8564,
         zone="lower", town="Standish",
         note="Small boat ramp near the top of the inner bay. Narrow road, limited parking, five to "
              "seven feet of water off the ramp."),
    dict(name="Au Gres Public Access, Point Lookout Harbor", lat=44.0270, lon=-83.6793,
         zone="lower", town="Au Gres",
         note="Harbor of refuge with well maintained ramps and plenty of parking. Access east to open "
              "Lake Huron or west up the river. The main gateway to the lower bay."),
    dict(name="Quanicassee area ramp, Barney Drive", lat=43.5847, lon=-83.6809,
         zone="eastern", town="Fairgrove",
         note="Two ramps with docks on the shallow south end of the east side. Quiet, and the closest "
              "east shore access to Bay City."),
    dict(name="Fish Point Wildlife Refuge", lat=43.6966, lon=-83.5266,
         zone="eastern", town="Unionville",
         note="State wildlife area with marsh, an observation tower, and ditch fishing. The bay itself "
              "is not reachable by car here, so treat it as shore access and birding rather than a launch."),
    dict(name="Sebewaing Harbor Marina", lat=43.7344, lon=-83.4586,
         zone="eastern", town="Sebewaing",
         note="Two docks, four unloading spots, bait shop on site. The traditional east side launch and "
              "the one that clears quickly even when busy."),
    dict(name="Bay Port Public Boating Access", lat=43.8542, lon=-83.3743,
         zone="eastern", town="Bay Port",
         note="Launch plus extensive shore fishing off the docks. Long standing perch reputation, and a "
              "fish company in town."),
    dict(name="Caseville Harbor", lat=43.9428, lon=-83.2749,
         zone="eastern", town="Caseville",
         note="Full harbor at the top of the east shore near the transition to the outer bay. Everything "
              "within walking distance."),
]

# NDBC stations, coordinates from the NDBC station table.
BUOYS = [
    dict(id="SBLM4", name="Saginaw Bay Light #1", lat=43.810, lon=-83.720, where="inner bay"),
    dict(id="GSLM4", name="Gravelly Shoal Light", lat=44.018, lon=-83.537, where="north end"),
    dict(id="TAWM4", name="Tawas Point", lat=44.254, lon=-83.449, where="northwest corner"),
]

# Named water. These are approximate centres for orientation, not navigation marks.
SPOTS = [
    dict(name="Callahan Reef", lat=43.86, lon=-83.62, zone="lower",
         note="Hard structure in open water, at the boundary between the lower and eastern bay. Fish "
              "relate to it and so does everybody else."),
    dict(name="Spoils Island", lat=43.68, lon=-83.78, zone="eastern",
         note="Dredge spoil island off the south east shore. Named repeatedly in state fishing reports "
              "for walleye in about ten feet."),
    dict(name="Wildfowl Bay", lat=43.79, lon=-83.42, zone="eastern",
         note="Shallow protected water behind the islands on the east side. Perch, pike, and extensive "
              "reeds and bulrush."),
    dict(name="Shipping channel, outer reach", lat=43.72, lon=-83.79, zone="inner",
         note="The dredged channel running out from the river mouth. The one piece of real structure in "
              "the inner bay, and a working channel with commercial traffic."),
    dict(name="Dredge Island, river mouth", lat=43.65, lon=-83.85, zone="inner",
         note="Rip rap edges near the mouth that hold baitfish. First structure post spawn fish meet on "
              "the way back out."),
]

ZONE_META = {
    "inner": dict(name="Inner Bay", colour="#2a5a7a", href="/inner-bay.html"),
    "lower": dict(name="Lower Bay", colour="#1e3d5c", href="/lower-bay.html"),
    "eastern": dict(name="Eastern Bay", colour="#2d4a3e", href="/eastern-bay.html"),
}

LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"
LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"


def build_map():
    url = SITE + "/map.html"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#webpage", "url": url,
         "name": "Saginaw Bay Map: Launches, Buoys, and Named Water",
         "description": "Interactive Saginaw Bay map showing public boat launches, live NOAA buoys, and the "
                        "named water anglers actually use, split across the Inner, Lower, and Eastern Bay.",
         "isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en-US",
         "author": {"@id": PERSON_ID}, "breadcrumb": {"@id": url + "#breadcrumb"}},
        breadcrumb([("Saginaw Bay Report", SITE + "/"), ("Map", url)]),
        {"@type": "ItemList", "@id": url + "#launches", "name": "Saginaw Bay public boat launches",
         "numberOfItems": len(LAUNCHES),
         "itemListElement": [
             {"@type": "ListItem", "position": i + 1,
              "item": {"@type": "Place", "name": l["name"],
                       "address": {"@type": "PostalAddress", "addressLocality": l["town"],
                                   "addressRegion": "MI", "addressCountry": "US"},
                       "geo": {"@type": "GeoCoordinates", "latitude": l["lat"], "longitude": l["lon"]}}}
             for i, l in enumerate(LAUNCHES)]},
        PERSON_NODE,
    ]}

    payload = json.dumps({"launches": LAUNCHES, "buoys": BUOYS, "spots": SPOTS,
                          "zones": ZONE_META}, separators=(",", ":"))

    def rows(items, kind):
        out = []
        for it in items:
            z = ZONE_META.get(it.get("zone"), {})
            zlink = (f'<a href="{z["href"]}">{z["name"]}</a>' if z else "all zones")
            extra = f'{it["town"]}. ' if kind == "launch" else ""
            desc = it.get("note") or it.get("where", "")
            label = f'{it["id"]} {it["name"]}' if kind == "buoy" else it["name"]
            out.append(
                f'<tr><td><strong>{label}</strong><div style="font-size:12.5px;color:#5d6b63">'
                f'{extra}{desc}</div></td>'
                f'<td class="num">{zlink}</td>'
                f'<td class="num">{it["lat"]:.4f}, {it["lon"]:.4f}</td></tr>')
        return "".join(out)

    body = (
        header("/map.html") +
        '<h1 style="font-size:30px;margin:22px 0 0">Saginaw Bay map</h1>'
        '<p class="lede">Every public launch, every live buoy, and the named water people actually give each '
        'other directions by. Click any marker for detail and a link through to the zone it sits in.</p>'

        '<div class="card" style="padding:0;overflow:hidden">'
        '<div id="baymap" style="height:520px;width:100%;background:#dfe6df"></div>'
        '</div>'
        '<p class="note" id="map-note">Buoy markers carry live wind once the observation loads. Launch positions '
        'are real coordinates. Named water markers are approximate centres for orientation and are not navigation '
        'marks.</p>'

        '<div class="stat-row" style="margin-top:12px">'
        '<div class="stat"><div class="lbl">Launches</div><div class="val mono">' + str(len(LAUNCHES)) + '</div>'
        '<div class="sub">public access</div></div>'
        '<div class="stat"><div class="lbl">Buoys</div><div class="val mono">' + str(len(BUOYS)) + '</div>'
        '<div class="sub">live wind</div></div>'
        '<div class="stat"><div class="lbl">Named water</div><div class="val mono">' + str(len(SPOTS)) + '</div>'
        '<div class="sub">orientation</div></div>'
        '<div class="stat"><div class="lbl">Zones</div><div class="val mono">3</div>'
        '<div class="sub">inner, lower, eastern</div></div>'
        '</div>'

        '<h2>Public launches</h2>'
        '<p>Ten public access points around the bay. Which one you should use today is a wind question, and the '
        '<a href="/launches-and-access.html">launches page</a> works through it: put in on the shore the wind is '
        'coming from, because that shore has no fetch behind it.</p>'
        '<div class="tbl-wrap"><table><thead><tr><th>Launch</th><th>Zone</th><th>Position</th></tr></thead>'
        '<tbody>' + rows(LAUNCHES, "launch") + '</tbody></table></div>'

        '<h2>Live buoys</h2>'
        '<p>Three NOAA stations report wind from inside the bay. The outer bay buoy has been offline since mid '
        'July, which is normal for it, and the site marks any observation over three hours old as stale rather '
        'than showing it as current.</p>'
        '<div class="tbl-wrap"><table><thead><tr><th>Station</th><th>Zone</th><th>Position</th></tr></thead>'
        '<tbody>' + rows(BUOYS, "buoy") + '</tbody></table></div>'

        '<h2>Named water</h2>'
        '<p>In a bay with very little structure, people navigate by names. Some are real features, some are road '
        'ends projected out onto open water. Either way these are the words used at the ramp and in the state '
        'fishing reports.</p>'
        '<div class="tbl-wrap"><table><thead><tr><th>Place</th><th>Zone</th><th>Approximate position</th></tr>'
        '</thead><tbody>' + rows(SPOTS, "spot") + '</tbody></table></div>'
        '<p class="note">The lower bay is also described by road ends carried straight out from shore, Thomas '
        'Road, Finn Road, and Vasser Road among them. Those are bearings people run rather than fixed points, so '
        'they are named on the <a href="/lower-bay.html">lower bay page</a> rather than pinned here.</p>'

        '<h2>Related</h2>'
        '<div class="anchor-list">'
        '<a href="/">Live conditions</a><a href="/launches-and-access.html">Which ramp for today\'s wind</a>'
        '<a href="/inner-bay.html">Inner bay</a><a href="/lower-bay.html">Lower bay</a>'
        '<a href="/eastern-bay.html">Eastern bay</a><a href="/wind-and-fish-location.html">Wind and fish location</a>'
        '</div>'
        + FOOTER.replace('<script src="/bay.js"></script>',
                         f'<script src="{LEAFLET_JS}" defer></script>'
                         f'<script id="baydata" type="application/json">{payload}</script>'
                         '<script src="/bay.js"></script><script src="/map.js" defer></script>')
    )
    html = head(
        "Saginaw Bay Map: Boat Launches, Live Buoys, and Named Water",
        "Interactive Saginaw Bay map with ten public boat launches, three live NOAA buoys, and the named water "
        "anglers use, across the Inner, Lower, and Eastern Bay.",
        url, ld)
    html = html.replace("</head>", f'<link rel="stylesheet" href="{LEAFLET_CSS}"></head>')
    (OUT / "map.html").write_text(html + body)
    print(f"  map.html written  {(OUT / 'map.html').stat().st_size:,} bytes")


build_map()
