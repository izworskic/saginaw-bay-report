SITE = "https://saginawbay.chrisizworski.com"
PERSON_ID = "https://chrisizworski.com/#person"

PERSON_NODE = {
    "@type": "Person",
    "@id": PERSON_ID,
    "name": "Chris Izworski",
    "url": "https://chrisizworski.com",
    "sameAs": [
        "https://chrisizworski.com",
        "https://michigantroutreport.com/chris-izworski/",
        "https://michiganbirdingreport.com/chris-izworski",
        "https://greatlakeslevels.org",
        "https://github.com/izworskic",
        "https://www.youtube.com/@izworskic",
        "https://www.wikidata.org/wiki/Q138283432",
    ],
}

# Palette taken from the bay itself: stained green water over a sand and clay
# bottom, big flat sky, and the green of a channel can. Deliberately different
# from the ice property's cold pewter and from the network's warm cream.
CSS = """
*{box-sizing:border-box}
html,body{margin:0;padding:0}
html{overflow-x:hidden}
body{font-family:"Newsreader",Georgia,"Iowan Old Style",serif;background:#e8eae2;color:#222a26;line-height:1.62}
.mono,.val,td.num,.rdg{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}
.wrap{max-width:1060px;margin:0 auto;padding:0 20px}
.page{min-height:100vh;background:linear-gradient(180deg,#f2f4ec 0%,#eceee5 44%,#e8eae2 100%);padding-bottom:48px}
h1,h2,h3{font-family:"Fraunces",Georgia,serif;line-height:1.24;letter-spacing:-.004em}
a{color:#1d6b4f}
a:hover{color:#258763}
.site-header{padding-top:30px;padding-bottom:14px;border-bottom:2px solid #1d6b4f}
.site-header .brandrow{display:flex;align-items:baseline;flex-wrap:wrap;gap:12px}
.site-header .brand{font-family:"Fraunces",Georgia,serif;font-size:30px;font-weight:600}
.site-header .tag{font-size:13px;color:#5d6b63;letter-spacing:.03em}
.site-header .stage{margin-left:auto;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:#1d6b4f;text-transform:uppercase;letter-spacing:.11em;border:1px solid #1d6b4f;border-radius:7px;padding:3px 10px}
.nav{margin-top:12px;display:flex;flex-wrap:wrap;gap:6px}
.nav a{display:inline-block;border:1px solid #c4d0c6;border-radius:999px;padding:5px 13px;font-size:12.5px;font-weight:600;text-decoration:none;color:#3f5148;background:rgba(255,255,255,.55)}
.nav a:hover{border-color:#1d6b4f;color:#1d6b4f}
.nav a[aria-current="page"]{background:#1d6b4f;border-color:#1d6b4f;color:#fff}
.lede{font-size:17px;color:#31403a;margin:18px 0 0}
.card{background:rgba(255,255,255,.66);border:1px solid #d3ddd4;border-radius:13px;padding:16px 20px;margin-top:18px}
.card.read{border-left:4px solid #1d6b4f}
.card.warn{border-left:4px solid #a8541f;background:rgba(255,250,245,.82)}
.kicker{font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:#5d6b63;margin-bottom:6px}
.stat-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.stat{flex:1 1 auto;min-width:120px;border:1px solid #d3ddd4;border-radius:11px;padding:9px 12px;background:rgba(255,255,255,.76);text-align:center}
.stat .lbl{font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:#5d6b63}
.stat .val{font-size:21px;line-height:1.22;color:#1d6b4f}
.stat .sub{font-size:10.5px;color:#5d6b63}
/* signature: the two shore panel */
.shores{display:grid;grid-template-columns:1fr;gap:12px;margin-top:16px}
@media(min-width:720px){.shores{grid-template-columns:1fr 1fr}}
.shore{border:1px solid #d3ddd4;border-radius:13px;padding:15px 17px;background:rgba(255,255,255,.7)}
.shore h3{margin:0 0 4px;font-size:17px}
.shore .role{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;margin-bottom:8px}
.shore.lee{border-color:#9dc4ad;background:rgba(233,245,237,.8)}
.shore.lee .role{color:#1d6b4f}
.shore.windward{border-color:#dcbfa4;background:rgba(252,244,236,.85)}
.shore.windward .role{color:#a8541f}
.shore p{margin:0;font-size:14px;color:#3f5148}
.compass{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#5d6b63;margin-top:6px}
table{width:100%;border-collapse:collapse;margin-top:14px;font-size:14.5px;background:rgba(255,255,255,.58)}
th,td{text-align:left;padding:9px 11px;border-bottom:1px solid #dde5de;vertical-align:top}
th{font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#5d6b63;font-weight:600}
td.num{white-space:nowrap}
.tbl-wrap{overflow-x:auto}
.badge{display:inline-block;font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;border-radius:5px;padding:2px 7px;white-space:nowrap;border:1px solid #c4d0c6;color:#3f5148;background:rgba(255,255,255,.72)}
.badge.go{color:#1d6b4f;border-color:#9dc4ad;background:rgba(230,244,235,.85)}
.badge.caution{color:#8a5a12;border-color:#ddc794;background:rgba(252,246,230,.9)}
.badge.stay{color:#8f3a1c;border-color:#dcb1a2;background:rgba(250,236,230,.9)}
.badge.stale{color:#6b6b6b;border-color:#cfcfcf;background:rgba(244,244,244,.9)}
.grid{display:grid;grid-template-columns:1fr;gap:14px;margin-top:16px}
@media(min-width:730px){.grid.two{grid-template-columns:1fr 1fr}.grid.three{grid-template-columns:repeat(3,1fr)}}
.tile{border:1px solid #d3ddd4;border-radius:13px;padding:15px 17px;background:rgba(255,255,255,.62)}
.tile h3{margin:0 0 6px;font-size:16.5px}
.tile p{margin:0;font-size:14px;color:#3f5148}
.note{font-size:13px;color:#5d6b63;font-style:italic}
.site-footer{margin-top:34px;padding-top:16px;border-top:1px solid #d3ddd4;font-size:12.5px;color:#5d6b63}
.site-footer a{color:#1d6b4f}
ul.tight li{margin-bottom:7px}
h2{margin-top:30px;font-size:22px}
h3{font-size:17px}
p{margin:12px 0}
.anchor-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.anchor-list a{font-size:13px;border:1px solid #c4d0c6;border-radius:999px;padding:4px 12px;text-decoration:none;background:rgba(255,255,255,.62)}
a:focus-visible{outline:3px solid #1d6b4f;outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
"""

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&'
         'family=Newsreader:ital,opsz@0,6..72;1,6..72&display=swap">')

# Every page sits one click from the front page. There is no second level.
NAV = [
    ("/", "Live conditions"),
    ("/wind-and-fish-location.html", "Wind and fish"),
    ("/walleye.html", "Walleye"),
    ("/perch.html", "Perch"),
    ("/inner-bay.html", "Inner bay"),
    ("/lower-bay.html", "Lower bay"),
    ("/eastern-bay.html", "Eastern bay"),
    ("/saginaw-river.html", "Saginaw River"),
    ("/launches-and-access.html", "Launches"),
    ("/map.html", "Map"),
    ("/reports.html", "Reports"),
]


def head(title, desc, canonical, ld_json):
    import json as _j
    return (
        '<!DOCTYPE html><html lang="en"><head>'
        '<meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        f'<title>{title}</title>'
        f'<meta name="description" content="{desc}">'
        f'<link rel="canonical" href="{canonical}">'
        f'<meta property="og:title" content="{title}">'
        f'<meta property="og:description" content="{desc}">'
        f'<meta property="og:url" content="{canonical}">'
        '<meta property="og:type" content="website">'
        '<meta property="og:site_name" content="Saginaw Bay Report">'
        '<meta name="twitter:card" content="summary">'
        '<meta name="geo.region" content="US-MI">'
        '<meta name="geo.placename" content="Saginaw Bay, Michigan">'
        f'{FONTS}<style>{CSS}</style>'
        f'<script type="application/ld+json">{_j.dumps(ld_json, separators=(",", ":"))}</script>'
        '</head>'
    )


def header(current):
    navhtml = "".join(
        f'<a href="{h}"{" aria-current=\"page\"" if h == current else ""}>{t}</a>'
        for h, t in NAV)
    return (
        '<body><div class="page"><div class="wrap">'
        '<header class="site-header"><div class="brandrow">'
        '<span class="brand">Saginaw Bay Report</span>'
        '<span class="tag">Wind, water, and which shore is fishable</span>'
        '<span class="stage" id="season-stage">Loading</span>'
        '</div>'
        f'<nav class="nav">{navhtml}</nav>'
        '</header>'
    )


FOOTER = (
    '<footer class="site-footer">'
    'Wind and wave observations from <a href="https://www.ndbc.noaa.gov/">NOAA National Data Buoy Center</a> '
    'stations SBLM4 at Saginaw Bay Light, GSLM4 at Gravelly Shoal, and TAWM4 at Tawas Point. River flow and water '
    'temperature from the <a href="https://waterdata.usgs.gov/mi/nwis/rt">USGS National Water Information System</a>. '
    'Forecasts and air temperature from the '
    '<a href="https://www.weather.gov/documentation/services-web-api">National Weather Service API</a>. '
    'Seasons, limits, and regulations from the '
    '<a href="https://www.michigan.gov/dnr/things-to-do/fishing">Michigan DNR</a>, which is always the authority. '
    'Ice conditions are tracked separately at '
    '<a href="https://ice.chrisizworski.com">the Michigan Ice Report</a>. '
    'Part of a Michigan outdoor network that includes the '
    '<a href="https://michigantroutreport.com">Michigan Trout Report</a>, '
    '<a href="https://greatlakeslevels.org">Great Lakes Levels</a>, and '
    '<a href="https://weekend.chrisizworski.com">Michigan Outdoor Weekend</a>. '
    'Built and maintained by <a href="https://chrisizworski.com">Chris Izworski</a> in Bay City. '
    'Wind reads on this site are geometry and weather, not a prediction that fish will bite. '
    'Nothing here is a substitute for your own judgment about whether it is safe to launch.'
    '</footer>'
    '</div></div><script src="/bay.js"></script></body></html>'
)


def breadcrumb(items):
    return {
        "@type": "BreadcrumbList",
        "@id": items[-1][1] + "#breadcrumb",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u}
            for i, (n, u) in enumerate(items)],
    }
