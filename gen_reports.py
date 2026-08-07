import pathlib, sys
sys.path.insert(0, "/home/claude/sbr")
from gen_chrome import head, header, FOOTER, breadcrumb, PERSON_NODE, PERSON_ID, SITE

OUT = pathlib.Path(__file__).resolve().parent / "public"

# Sources are linked and attributed, never reproduced. The one exception is the
# National Weather Service marine forecast, which is a US federal government
# work in the public domain and is quoted in full with attribution.
SOURCES = [
    dict(name="Michigan DNR Weekly Fishing Report",
         url="https://www.michigan.gov/dnr/things-to-do/fishing/weekly",
         kind="Official", cadence="Weekly, Thursday afternoon",
         what="The authoritative report. Compiled from creel clerks and DNR staff, and it covers Saginaw Bay, "
              "the Saginaw River, and the Tittabawassee by name.",
         honest="The DNR states plainly that Great Lakes conditions can change daily, if not hourly, based on "
                "wind and rain. Anglers routinely note the report runs several days to a week behind. Read it "
                "for the pattern, not for today."),
    dict(name="Michigan DNR fishing home",
         url="https://www.michigan.gov/dnr/things-to-do/fishing",
         kind="Official", cadence="Continuous",
         what="Seasons, size and possession limits, licences, stocking records, and fish identification.",
         honest="This is the only place regulations should come from. Nothing on this site restates a limit, "
                "because limits change and a stale number in a blog post is how people end up with a ticket."),
    dict(name="NWS Nearshore Marine Forecast, Detroit office",
         url="https://forecast.weather.gov/shmrn.php?mz=lhz422",
         kind="Official", cadence="Several times daily",
         what="Wind, wave, and weather forecast written specifically for Inner Saginaw Bay and Outer Saginaw "
              "Bay as separate marine zones.",
         honest="This is the forecast quoted at the top of this page. It is the single most useful free "
                "product for deciding whether tomorrow is worth taking off work."),
    dict(name="NOAA NDBC station SBLM4",
         url="https://www.ndbc.noaa.gov/station_page.php?station=sblm4",
         kind="Observation", cadence="Roughly every 10 to 20 minutes",
         what="Raw observations from Saginaw Bay Light, including the full history rather than just the "
              "latest reading.",
         honest="Observations, not forecasts. Also the station that most often goes quiet in winter, along "
                "with the outer bay buoy that has been offline since mid July."),
    dict(name="USGS Saginaw River gauge",
         url="https://waterdata.usgs.gov/monitoring-location/USGS-04157005/",
         kind="Observation", cadence="Every 15 to 30 minutes",
         what="Discharge, stage, water temperature, and turbidity on the Saginaw River, with full plotting "
              "and download.",
         honest="The discharge here reads negative when wind pushes the bay back up the river, which is a "
                "real measurement and not a fault."),
    dict(name="NOAA water levels, Harbor Beach",
         url="https://tidesandcurrents.noaa.gov/stationhome.html?id=9075014",
         kind="Observation", cadence="Every 6 minutes",
         what="Lake Huron water level, which sustained wind moves along the bay axis.",
         honest="Harbor Beach is outside the bay on the Lake Huron shore, so it reads the lake rather than "
                "the stacking inside Saginaw Bay itself."),
    dict(name="OldAuSable, DNR statewide report mirror",
         url="https://www.oldausable.com/dnr-statewide-fishing-reports",
         kind="Community", cadence="Follows the DNR",
         what="A long running mirror of the DNR statewide report, often easier to read and to search back "
              "through than the state site.",
         honest="A mirror, so it inherits the same lag as the source it copies."),
    dict(name="Michigan Sportsman, Saginaw Bay forum",
         url="https://www.michigan-sportsman.com/forums/saginaw-bay.51/",
         kind="Community", cadence="Continuous",
         what="Where people actually post what happened yesterday, which ramp was busy, and where the water "
              "was dirty.",
         honest="Unverified and anecdotal by nature, and a single good day gets repeated for a week. Useful "
                "for texture, not for planning."),
]


def build_reports():
    url = SITE + "/reports.html"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#webpage", "url": url,
         "name": "Saginaw Bay Fishing Reports: Live Marine Forecast and Where to Read the Rest",
         "description": "The live National Weather Service marine forecast for Inner and Outer Saginaw Bay, "
                        "plus every fishing report source worth reading and how current each one actually is.",
         "isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en-US",
         "author": {"@id": PERSON_ID}, "breadcrumb": {"@id": url + "#breadcrumb"}},
        breadcrumb([("Saginaw Bay Report", SITE + "/"), ("Reports", url)]),
        {"@type": "ItemList", "@id": url + "#sources", "name": "Saginaw Bay fishing report sources",
         "numberOfItems": len(SOURCES),
         "itemListElement": [
             {"@type": "ListItem", "position": i + 1, "name": s["name"], "url": s["url"]}
             for i, s in enumerate(SOURCES)]},
        PERSON_NODE,
    ]}

    def source_rows():
        out = []
        for s in SOURCES:
            badge = {"Official": "go", "Observation": "cold", "Community": "caution"}.get(s["kind"], "")
            out.append(
                f'<tr><td><a href="{s["url"]}" target="_blank" rel="noopener"><strong>{s["name"]}</strong></a>'
                f'<div style="font-size:12.5px;color:#5d6b63;margin-top:3px">{s["what"]}</div>'
                f'<div style="font-size:12.5px;color:#5d6b63;margin-top:4px"><em>{s["honest"]}</em></div></td>'
                f'<td class="num"><span class="badge {badge}">{s["kind"]}</span></td>'
                f'<td class="num" style="font-size:12.5px">{s["cadence"]}</td></tr>')
        return "".join(out)

    body = (
        header("/reports.html") +
        '<h1 style="font-size:30px;margin:22px 0 0">Saginaw Bay fishing reports</h1>'
        '<p class="lede">Every fishing report about this bay is old by the time you read it. The National '
        'Weather Service marine forecast is not, so it leads. Everything else is linked below with an honest '
        'note about how current it actually is.</p>'

        '<div class="card read"><div class="kicker">Live marine forecast '
        '<span class="badge go">National Weather Service</span></div>'
        '<div id="marine-inner" style="margin-top:10px">'
        '<h3 style="margin:0 0 4px;font-size:16px">Inner Saginaw Bay</h3>'
        '<p class="note" style="margin:0 0 6px" id="marine-inner-zone">Point Au Gres to Bay Port</p>'
        '<div id="marine-inner-body"><p style="margin:0">Loading the current forecast.</p></div>'
        '</div>'
        '<div id="marine-outer" style="margin-top:18px">'
        '<h3 style="margin:0 0 4px;font-size:16px">Outer Saginaw Bay</h3>'
        '<p class="note" style="margin:0 0 6px" id="marine-outer-zone">Alabaster to Port Austin</p>'
        '<div id="marine-outer-body"><p style="margin:0">Loading the current forecast.</p></div>'
        '</div>'
        '<p class="note" style="margin-top:12px">Forecast text is issued by the National Weather Service, '
        'Detroit and Pontiac office, as the Nearshore Marine Forecast for zones LHZ422 and LHZ421. It is a work '
        'of the United States government and therefore in the public domain, which is why it is quoted here in '
        'full rather than paraphrased. Every other source on this page is linked, not reproduced.</p>'
        '<p class="note" id="marine-stamp"></p></div>'

        '<h2>What the bay is doing right now</h2>'
        '<p>The forecast above is what is coming. The numbers below are what is happening, straight off the '
        'buoys and the river gauge. When those two disagree, believe the buoys and check the forecast again in '
        'an hour.</p>'
        '<div class="stat-row">'
        '<div class="stat"><div class="lbl">Wind</div><div class="val mono" id="s-wind">...</div>'
        '<div class="sub" id="s-winddir">at Saginaw Bay Light</div></div>'
        '<div class="stat"><div class="lbl">Gust</div><div class="val mono" id="s-gust">...</div>'
        '<div class="sub">mph</div></div>'
        '<div class="stat"><div class="lbl">Launch read</div><div class="val mono" id="s-launch">...</div>'
        '<div class="sub">small boat</div></div>'
        '<div class="stat"><div class="lbl">Saginaw River</div><div class="val mono" id="s-river">...</div>'
        '<div class="sub" id="s-river-sub">flow</div></div>'
        '<div class="stat"><div class="lbl">Water temp</div><div class="val mono" id="s-wtmp">...</div>'
        '<div class="sub">river gauge</div></div>'
        '</div>'
        '<div class="shores">'
        '<div class="shore" id="shore-lee"><div class="role">Lee zone, calmer water</div>'
        '<h3 id="lee-name">...</h3><p id="lee-text">Loading.</p></div>'
        '<div class="shore" id="shore-wind"><div class="role">Windward zone, stacked water</div>'
        '<h3 id="wind-name">...</h3><p id="wind-text">Loading.</p></div>'
        '</div>'
        '<p class="compass" id="fetch-note"></p>'
        '<div class="card read" style="margin-top:14px"><div class="kicker">The read</div>'
        '<p style="margin:0;font-size:16px" id="the-read">Loading.</p>'
        '<p class="note" style="margin-top:10px" id="read-stamp"></p></div>'

        '<h2>Where to read the rest</h2>'
        '<p>These are the sources worth your time, what each one is good for, and where each one falls down. '
        'They are linked rather than copied, because a fishing report is somebody else\'s work and reprinting '
        'it here would help nobody.</p>'
        '<div class="tbl-wrap"><table><thead><tr>'
        '<th>Source</th><th>Type</th><th>Updated</th></tr></thead><tbody>'
        + source_rows() +
        '</tbody></table></div>'

        '<h2>How to actually use them together</h2>'
        '<p>The three kinds of source answer three different questions, and the mistake is asking one of them '
        'the wrong question.</p>'
        '<ul class="tight">'
        '<li><strong>Official reports tell you the pattern.</strong> The DNR report is compiled from creel '
        'clerks who spoke to real anglers, so it is the most trustworthy account of what has been happening. It '
        'is also days old. Use it to answer where the fish have been and what they have been caught on.</li>'
        '<li><strong>Observations tell you the present.</strong> Buoys, the river gauge, and the water level '
        'are measurements taken minutes ago. Use them to answer whether you can get out there safely today and '
        'which zone is in the lee.</li>'
        '<li><strong>Forecasts tell you tomorrow.</strong> The marine forecast is the only one of the three '
        'that lets you plan rather than react. Use it to decide which day of the weekend to take.</li>'
        '<li><strong>Community posts tell you the texture.</strong> Which ramp was jammed, where the water was '
        'chocolate, whether the perch were small. Useful colour, and worth exactly what you paid for it.</li>'
        '</ul>'
        '<p>The combination that works: read the DNR report for the pattern, check the marine forecast to pick '
        'a day, then check the buoys the morning of to decide which side of the bay to launch from. That last '
        'step is what the rest of this site is for.</p>'

        '<h2>Why the reports lag, and why it matters here more than most places</h2>'
        '<p>A weekly report is fine on a river that changes slowly. Saginaw Bay is not that. It is over a '
        'thousand square miles of shallow water, and a single day of wind reorganises where the fish are, which '
        'shore is fishable, and how stained the water is. A report describing last Tuesday can be describing a '
        'different bay.</p>'
        '<p>The state says as much itself, noting that Great Lakes fishing conditions can change daily, if not '
        'hourly, on wind and rain. That is not a criticism of the report. It is the reason a live wind layer '
        'exists on this site at all, and the reason the two belong together rather than in competition.</p>'
        '<div class="anchor-list">'
        '<a href="/">Live conditions</a><a href="/wind-and-fish-location.html">Wind and fish location</a>'
        '<a href="/map.html">Map</a><a href="/walleye.html">Walleye</a>'
        '<a href="/launches-and-access.html">Launches</a>'
        '</div>'
        + FOOTER.replace('<script src="/bay.js"></script>',
                         '<script src="/bay.js"></script><script src="/reports.js" defer></script>')
    )
    (OUT / "reports.html").write_text(head(
        "Saginaw Bay Fishing Reports: Live Marine Forecast and Every Source Worth Reading",
        "The live National Weather Service marine forecast for Inner and Outer Saginaw Bay, live buoy and river "
        "readings, and every fishing report source worth reading with an honest note on how current each is.",
        url, ld) + body)
    print(f"  reports.html written  {(OUT / 'reports.html').stat().st_size:,} bytes")


build_reports()
