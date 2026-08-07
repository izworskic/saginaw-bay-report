import pathlib
import json, pathlib, sys
sys.path.insert(0, "/home/claude/sbr")
from gen_chrome import head, header, FOOTER, breadcrumb, PERSON_NODE, PERSON_ID, SITE

OUT = pathlib.Path(__file__).resolve().parent / "public"
OUT.mkdir(parents=True, exist_ok=True)


def live_block():
    return (
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
        '<div class="shore" id="shore-lee"><div class="role">Lee shore, calmer water</div>'
        '<h3 id="lee-name">...</h3><p id="lee-text">Loading.</p></div>'
        '<div class="shore" id="shore-wind"><div class="role">Windward shore, stacked water</div>'
        '<h3 id="wind-name">...</h3><p id="wind-text">Loading.</p></div>'
        '</div>'
        '<p class="compass" id="fetch-note"></p>'
    )


# ------------------------------------------------------------------ index
def build_index():
    url = SITE + "/"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebSite", "@id": SITE + "/#website", "name": "Saginaw Bay Report", "url": SITE,
         "description": "Live Saginaw Bay fishing conditions built on wind direction: which shore is in the lee, "
                        "which shore has the stacked water, and whether it is worth launching.",
         "author": {"@id": PERSON_ID}},
        {"@type": "WebPage", "@id": url + "#webpage", "url": url,
         "isPartOf": {"@id": SITE + "/#website"},
         "name": "Saginaw Bay Fishing Report: Live Wind, Lee Shore, and Launch Conditions",
         "description": "Live wind from three Saginaw Bay buoys, a lee shore read for walleye and perch anglers, "
                        "river flow, and launch guidance for both shores.",
         "inLanguage": "en-US", "author": {"@id": PERSON_ID},
         "breadcrumb": {"@id": url + "#breadcrumb"},
         "about": {"@type": "Place", "name": "Saginaw Bay",
                   "geo": {"@type": "GeoCoordinates", "latitude": 43.9, "longitude": -83.65}}},
        breadcrumb([("Saginaw Bay Report", url)]),
        PERSON_NODE,
    ]}
    body = (
        header("/") +
        '<p class="lede">On a bay this shallow the wind decides everything. It decides which shore you can launch '
        'from, which shore the water piles onto, and where the fish end up. This reads live wind from three bay '
        'buoys and tells you both halves of that answer, including the part most tools leave out: the shore holding '
        'the fish is usually the shore you cannot comfortably fish.</p>'
        + live_block() +
        '<div class="card read"><div class="kicker">The read</div>'
        '<p style="margin:0;font-size:16px" id="the-read">Loading live bay conditions.</p>'
        '<p class="note" style="margin-top:10px" id="read-stamp"></p></div>'

        '<h2>Buoys reporting right now</h2>'
        '<div class="tbl-wrap"><table><thead><tr>'
        '<th>Station</th><th>Where</th><th>Wind</th><th>Gust</th><th>Air</th><th>Status</th>'
        '</tr></thead><tbody id="buoys">'
        '<tr id="row-SBLM4"><td class="num">SBLM4</td><td>Saginaw Bay Light, inner bay</td>'
        '<td class="num" data-f="wind">...</td><td class="num" data-f="gust">...</td>'
        '<td class="num" data-f="atmp">...</td><td data-f="status">...</td></tr>'
        '<tr id="row-GSLM4"><td class="num">GSLM4</td><td>Gravelly Shoal Light, north end</td>'
        '<td class="num" data-f="wind">...</td><td class="num" data-f="gust">...</td>'
        '<td class="num" data-f="atmp">...</td><td data-f="status">...</td></tr>'
        '<tr id="row-TAWM4"><td class="num">TAWM4</td><td>Tawas Point, northwest corner</td>'
        '<td class="num" data-f="wind">...</td><td class="num" data-f="gust">...</td>'
        '<td class="num" data-f="atmp">...</td><td data-f="status">...</td></tr>'
        '</tbody></table></div>'
        '<p class="note" id="buoy-stamp">Loading buoy observations.</p>'

        '<h2>Why wind is the whole story here</h2>'
        '<p>Saginaw Bay covers well over a thousand square miles and almost none of it is deep. The inner bay does '
        'not stratify, there is no thermocline to hide behind, and the bottom is sand mixed with clay and muck. Put '
        'fifteen knots across water like that and the whole column stirs. The bay goes from clear to stained in an '
        'afternoon, the wave gets short and steep rather than long and rolling, and a boat that handled it fine at '
        'nine in the morning is taking spray by noon.</p>'
        '<p>That same stirring is what makes the fishing. Walleye on this bay generally prefer stained water over '
        'gin clear, because that is where the baitfish school and where a fish can hunt without being seen. Wind '
        'pushes surface water toward the downwind shore, current follows, bait follows the current, and walleye '
        'follow the bait. Local knowledge on this is old and consistent: a sustained west wind moves fish toward the '
        'east side, from Callahan Reef up toward Sebewaing, Bay Port, and Caseville. A stretch of east and northeast '
        'wind pushes them the other way, toward Linwood and into the shipping channel.</p>'
        '<p>So the honest version of a Saginaw Bay report is two answers, not one. The lee shore is where you can '
        'launch and stay comfortable. The windward shore is where the water is stacking and the fish are likely '
        'concentrating. Those are usually opposite shores, and deciding between them is the actual skill.</p>'
        '<p><a href="/wind-and-fish-location.html">Read the full guide to wind direction and fish location</a>.</p>'

        '<h2>Pick a zone</h2>'
        '<p>This is not one fishery. It is three, with different depths, different species mixes, and different '
        'tolerance for a small boat.</p>'
        '<div class="grid three">'
        + "".join(
            f'<div class="tile"><h3><a href="{z["nav"]}">{z["name"]}</a></h3>'
            f'<p><strong>{z["subtitle"]}</strong>. {z["depths"]}. {z["species"]}. {z["blurb"][:120]}...</p></div>'
            for z in ZONES)
        + '</div>'
        '<div class="grid two">'
        '<div class="tile"><h3><a href="/saginaw-river.html">Saginaw River and the mouth</a></h3>'
        '<p>The spring run, the Dredge Island rip rap, and the gauge chain that tells you what the bay water will '
        'look like tomorrow.</p></div>'
        '<div class="tile"><h3><a href="/launches-and-access.html">Launches and access</a></h3>'
        '<p>Where to put in for today\'s wind, which ramps are usable in a blow, and where to fish from shore.</p></div>'
        '</div>'

        '<h2>What you are actually fishing for</h2>'
        '<div class="grid two">'
        '<div class="tile"><h3><a href="/walleye.html">Walleye</a></h3>'
        '<p>The reason most people are here. Spring run up the rivers, post spawn migration north along the west '
        'shore, summer move toward the cooler outer bay, and a fall trolling bite that produces the biggest fish.</p></div>'
        '<div class="tile"><h3><a href="/perch.html">Yellow perch</a></h3>'
        '<p>The summer and fall fishery, and the one that fills a cooler for a family. Different water, different '
        'wind tolerance, and far more forgiving of a small boat.</p></div>'
        '</div>'

        '<h2>What this does not do</h2>'
        '<ul class="tight">'
        '<li><strong>It does not predict a bite.</strong> The shore reads here are geometry and weather. Wind '
        'direction is a fact, fetch is a fact, where the water piles up is a fact. Whether fish eat is not.</li>'
        '<li><strong>It does not tell you it is safe.</strong> A small boat read is a rough guide from wind speed '
        'and fetch. You know your hull, your motor, and your crew. The bay builds a short steep chop fast and the '
        'ride back is always worse than the ride out.</li>'
        '<li><strong>It does not replace the DNR.</strong> Seasons, size limits, possession limits, and any '
        'emergency orders come from the state and change. Check before you keep anything.</li>'
        '<li><strong>It does not cover ice.</strong> Winter conditions live on the '
        '<a href="https://chrisizworski.com/michigan-ice/regions/saginaw-bay.html">Michigan Ice Report</a>, which tracks '
        'accumulated cold instead of wind.</li>'
        '</ul>'

        '<div class="anchor-list">'
        '<a href="/wind-and-fish-location.html">Wind and fish location</a>'
        '<a href="/walleye.html">Walleye</a>'
        '<a href="/perch.html">Perch</a>'
        '<a href="/inner-bay.html">Inner bay</a>'
        '<a href="/eastern-bay.html">Eastern bay</a>'
        '<a href="/saginaw-river.html">Saginaw River</a>'
        '<a href="/launches-and-access.html">Launches and access</a>'
        '</div>'
        + FOOTER
    )
    (OUT / "index.html").write_text(head(
        "Saginaw Bay Fishing Report: Live Wind, Lee Shore, and Launch Conditions",
        "Live Saginaw Bay wind from three NOAA buoys with a lee shore read for walleye and perch, plus river flow, "
        "water temperature, and launch guidance for the west and east shores.",
        url, ld) + body)


# ------------------------------------------------------------------ cornerstone
def build_wind():
    url = SITE + "/wind-and-fish-location.html"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "@id": url + "#article",
         "headline": "Wind Direction on Saginaw Bay: Which Shore Is Fishable and Where the Fish Stack",
         "description": "How wind direction sets both the lee shore and the shore where walleye concentrate on "
                        "Saginaw Bay, why those are usually opposite, and how to choose between them.",
         "author": {"@id": PERSON_ID}, "publisher": {"@id": PERSON_ID},
         "inLanguage": "en-US", "mainEntityOfPage": url,
         "isPartOf": {"@id": SITE + "/#website"}},
        breadcrumb([("Saginaw Bay Report", SITE + "/"), ("Wind and fish location", url)]),
        PERSON_NODE,
    ]}
    body = (
        header("/wind-and-fish-location.html") +
        '<h1 style="font-size:30px;margin:22px 0 0">Wind direction, the lee shore, and where the fish stack</h1>'
        '<p class="lede">Every experienced Saginaw Bay angler is solving the same problem before they hook up the '
        'trailer. The wind gives you two shores with opposite qualities, and you have to pick one.</p>'
        + live_block() +

        '<h2>What the wind does to the water</h2>'
        '<p>Wind blowing across open water pushes the surface layer downwind. In deep water that barely matters. In '
        'a bay averaging well under twenty feet it matters enormously. Water piles up against the downwind shore, '
        'sometimes by a noticeable amount, and it has to go somewhere, so it sets up a return current along the '
        'bottom. That circulation lifts sediment, and the bay stains.</p>'
        '<p>Three consequences follow, and they all point the same direction.</p>'
        '<p><strong>The downwind shore gets the rough water.</strong> Waves need distance to build, and the distance '
        'the wind has traveled over open water is the fetch. The shore the wind is blowing toward has the whole '
        'fetch behind it. The shore the wind is blowing from has essentially none, which is why it stays flat even '
        'when the forecast sounds ugly.</p>'
        '<p><strong>The downwind shore gets the stained water.</strong> Stirred sediment and pushed surface water '
        'collect there. On most fisheries that would be a negative. On Saginaw Bay it is the opposite, because '
        'walleye here feed better in stained water than in clear.</p>'
        '<p><strong>The downwind shore gets the bait, and then the walleye.</strong> Current concentrates plankton, '
        'plankton concentrates baitfish, baitfish concentrate walleye. That chain is why a steady blow for a day or '
        'two reorganizes the fishery rather than just roughing it up.</p>'

        '<h2>The specific pattern on this bay</h2>'
        '<p>The bay runs roughly southwest to northeast, with the Saginaw River entering at the southwest corner and '
        'the outer bay opening to Lake Huron past Point Lookout and the Charity Islands. That geometry produces a '
        'small number of repeating situations.</p>'
        '<div class="tbl-wrap"><table><thead><tr>'
        '<th>Wind from</th><th>Lee shore, launch here</th><th>Water stacking toward</th><th>Fetch</th>'
        '</tr></thead><tbody>'
        '<tr><td class="num">West and southwest</td><td>West shore: Linwood, Pinconning, Au Gres</td>'
        '<td>East shore: Callahan Reef, Sebewaing, Bay Port, Caseville</td><td>Moderate, across the bay</td></tr>'
        '<tr><td class="num">East and northeast</td><td>East shore: Sebewaing, Bay Port, Quanicassee</td>'
        '<td>West shore: Linwood and the shipping channel</td><td>Moderate to long, open lake behind it</td></tr>'
        '<tr><td class="num">South and southwest</td><td>South end near the river mouth</td>'
        '<td>North, toward the outer bay</td><td>Long, up the bay axis</td></tr>'
        '<tr><td class="num">North and northeast</td><td>Very little shelter anywhere in the inner bay</td>'
        '<td>South, onto the river mouth and Quanicassee flats</td>'
        '<td>Longest, open Lake Huron feeding straight in</td></tr>'
        '</tbody></table></div>'
        '<p class="note">Directions describe where the wind is coming from, which is the convention every marine '
        'forecast and buoy uses.</p>'
        '<p>The north and northeast case deserves its own warning. That wind has the entire length of the bay and '
        'open Lake Huron behind it, and it drives water into the shallow southwest corner where there is nowhere for '
        'it to go. That is the setup that makes the inner bay genuinely unpleasant and the one where small boats '
        'should simply stay home.</p>'

        '<h2>Choosing between the two shores</h2>'
        '<p>Once you know which shore is which, the decision comes down to your boat, your crew, and how long the '
        'wind has been blowing.</p>'
        '<ul class="tight">'
        '<li><strong>Fish the lee shore when the wind is fresh.</strong> A blow that started this morning has not '
        'had time to move much. You get comfort without giving up much.</li>'
        '<li><strong>Consider the windward shore after a day or two of steady wind.</strong> That is when the '
        'stacking has actually happened. It is also when that side is roughest, so it is a bigger boat decision.</li>'
        '<li><strong>Fish the seam rather than the extreme.</strong> The edge where stained water meets clearer '
        'water is often better than sitting in the muddiest part of it.</li>'
        '<li><strong>Respect a wind shift more than a wind speed.</strong> A bay that has been stacking east for two '
        'days and then swings west does not reset instantly, and the first day after a shift is frequently poor.</li>'
        '<li><strong>Remember the ride home.</strong> Running downwind out to the fish in the morning means running '
        'into it on the way back, usually with a tireder crew and a building afternoon breeze.</li>'
        '</ul>'

        '<h2>What the numbers on this site mean</h2>'
        '<p>The buoy reading is wind direction in degrees and speed in knots, converted here to miles per hour '
        'because that is what most people think in. The lee shore and stacking shore are computed from that '
        'direction and the bay geometry, nothing more. They are not a forecast and not a fish finder. If the wind '
        'has just switched, the water has not caught up yet and the read will be ahead of reality.</p>'
        '<p>The launch read is a blunt instrument built from wind speed and fetch direction. It is meant to catch '
        'the obvious cases, a flat morning or a day nobody should be out in the middle of the bay in a sixteen foot '
        'boat. It cannot know your hull or your comfort, and on this bay the correct answer is sometimes to stay in '
        'the river.</p>'
        '<div class="anchor-list">'
        '<a href="/">Live conditions</a><a href="/inner-bay.html">Inner bay in detail</a>'
        '<a href="/lower-bay.html">Lower bay in detail</a><a href="/walleye.html">How this changes by season</a>'
        '<a href="/launches-and-access.html">Which ramp to use</a>'
        '</div>'
        + FOOTER
    )
    (OUT / "wind-and-fish-location.html").write_text(head(
        "Saginaw Bay Wind Direction: Lee Shore and Where Walleye Stack",
        "How wind direction sets both the lee shore and the shore where walleye concentrate on Saginaw Bay, why "
        "those are usually opposite shores, and how to choose between comfort and fish.",
        url, ld) + body)


# ------------------------------------------------------------------ walleye
def build_walleye():
    url = SITE + "/walleye.html"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "@id": url + "#article",
         "headline": "Saginaw Bay Walleye Through the Season",
         "description": "The Saginaw Bay walleye year: the spring river run, the post spawn migration north along "
                        "the west shore, the summer move toward the outer bay, and the fall trolling bite.",
         "author": {"@id": PERSON_ID}, "publisher": {"@id": PERSON_ID},
         "inLanguage": "en-US", "mainEntityOfPage": url,
         "isPartOf": {"@id": SITE + "/#website"}},
        breadcrumb([("Saginaw Bay Report", SITE + "/"), ("Walleye", url)]),
        PERSON_NODE,
    ]}
    body = (
        header("/walleye.html") +
        '<h1 style="font-size:30px;margin:22px 0 0">Saginaw Bay walleye through the season</h1>'
        '<p class="lede">The bay holds one of the densest walleye populations in the Great Lakes, and the fish are '
        'not in the same place twice. The year has a shape, and knowing it saves more time than any lure choice.</p>'
        + live_block() +

        '<h2>Spring: the river run</h2>'
        '<p>Walleye move out of the bay and up the rivers to spawn, and the Saginaw system is the big one. Fish push '
        'up the Saginaw and into the Tittabawassee, with the run generally building through late March and into '
        'April depending on how the ice and the water temperature go. This is the most concentrated the population '
        'ever gets and the most crowded the fishery ever gets.</p>'
        '<p>While that is happening in the rivers, the bay itself is not empty. Pre spawn fish are still staging '
        'near the river mouth, and post spawn fish are already dropping back down. The rip rap edges around the '
        'Dredge Island near the mouth hold baitfish and transient walleye, and pitching jigs there is a reliable way '
        'to intercept fish moving in both directions at once.</p>'

        '<h2>Late spring: the migration north</h2>'
        '<p>After the spawn the fish need to feed hard, and early spring is exactly when the bay has the least bait '
        'in it. So they go looking. The classic pattern is a movement north along the west shoreline toward the '
        'smelt, which stage in the outer bay and run the shoreline streams. The Au Gres to Tawas stretch has a long '
        'reputation for that reason, and April into May is when the average size is at its best.</p>'
        '<p>This is also when the fishing is closest to shore and shallowest, which makes it the friendliest part of '
        'the year for a smaller boat, as long as you pick your day. A moderate south wind putting a walleye chop on '
        'the water is close to ideal, and it is worth planning around.</p>'

        '<h2>Summer: out toward the cooler water</h2>'
        '<p>As the bay warms, the fish spread and move toward the cooler and slightly deeper water of the outer bay. '
        'The inner bay does not stratify, so there is no thermocline to work with; you are reading structure, bait, '
        'and water color instead. Trolling comes into its own here, covering water at speed with crankbaits and '
        'spoons behind boards and divers until a depth and a color pattern emerge, then committing everything to '
        'that pattern.</p>'
        '<p>Summer is also when the wind lesson matters most. The fish are scattered enough that finding the '
        'concentration is the whole job, and the wind driven stacking described on the '
        '<a href="/wind-and-fish-location.html">wind page</a> is the most reliable way to narrow it down.</p>'

        '<h2>Fall: fewer fish, bigger fish</h2>'
        '<p>As water temperatures drop the fish feed hard again and the average size climbs. Fall trolling on this '
        'bay has a reputation for producing the largest walleye of the year, and the crowds are gone. The tradeoff '
        'is weather: this is when a nice morning turns into a bad afternoon quickly, and when the north and '
        'northeast winds that make the inner bay miserable start showing up regularly.</p>'
        '<p>Late in the fall the fish begin drifting back toward the river mouth and the deeper holes, which sets up '
        'the winter fishery. Once the bay locks up, conditions move over to the '
        '<a href="https://chrisizworski.com/michigan-ice/regions/saginaw-bay.html">Michigan Ice Report</a>, which tracks '
        'accumulated cold rather than wind.</p>'

        '<h2>Reading water color</h2>'
        '<p>One habit separates people who do well here from people who do not, and it has nothing to do with tackle. '
        'Watch the water color and be willing to move because of it. Gin clear and cold is usually the wrong place on '
        'this bay. A stained edge, slightly warmer, with some chop on it, is usually the right one. That preference '
        'is why wind is such a strong driver and why a bay that just went flat after a long blow can fish poorly for '
        'a day.</p>'
        '<div class="anchor-list">'
        '<a href="/">Live conditions</a><a href="/wind-and-fish-location.html">Wind and fish location</a>'
        '<a href="/saginaw-river.html">The river and the spring run</a><a href="/inner-bay.html">Inner bay</a>'
        '<a href="https://www.michigan.gov/dnr/things-to-do/fishing">DNR fishing regulations</a>'
        '</div>'
        + FOOTER
    )
    (OUT / "walleye.html").write_text(head(
        "Saginaw Bay Walleye: Spring Run, Summer Trolling, and the Fall Bite",
        "The Saginaw Bay walleye year in order: the spring run up the Saginaw and Tittabawassee, the post spawn "
        "migration north toward Au Gres and Tawas, summer trolling, and the fall bite that produces the biggest fish.",
        url, ld) + body)


# ------------------------------------------------------------------ perch
def build_perch():
    url = SITE + "/perch.html"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "@id": url + "#article",
         "headline": "Saginaw Bay Yellow Perch",
         "description": "The Saginaw Bay perch fishery: when jumbo perch show up, where to find them on each shore, "
                        "and why perch fishing is far friendlier to a small boat than the walleye fishery.",
         "author": {"@id": PERSON_ID}, "publisher": {"@id": PERSON_ID},
         "inLanguage": "en-US", "mainEntityOfPage": url,
         "isPartOf": {"@id": SITE + "/#website"}},
        breadcrumb([("Saginaw Bay Report", SITE + "/"), ("Perch", url)]),
        PERSON_NODE,
    ]}
    body = (
        header("/perch.html") +
        '<h1 style="font-size:30px;margin:22px 0 0">Saginaw Bay yellow perch</h1>'
        '<p class="lede">Perch are the other half of this fishery and the half that suits a small boat, a short '
        'window, and kids. They are also the reason a lot of Bay County families own a boat at all.</p>'
        + live_block() +

        '<h2>When</h2>'
        '<p>Perch are catchable through much of the year, but the fishery people plan around runs from midsummer '
        'through fall. That timing is close to the opposite of the best walleye window, which is useful: when the '
        'spring walleye crowd has gone home and the bay is warm, the perch fishing is coming on.</p>'
        '<p>Fall is when the size is best. As the water cools the fish group up and feed, and that is when the '
        'jumbo class shows up in numbers. Late season perch off this bay have a deserved reputation as some of the '
        'best eating in fresh water.</p>'

        '<h2>Where</h2>'
        '<p>Perch relate to bottom and to structure more tightly than roaming summer walleye do, which means they '
        'reward anchoring and staying put once you find them. Productive water tends to be the moderate depths off '
        'both shores, near weed edges, over hard bottom transitions, and around the reef and shoal structure that '
        'breaks up the otherwise featureless sand and clay.</p>'
        '<p>The east side around Bay Port has an old and well earned reputation for perch. The west side out of '
        'Linwood, Pinconning, and Au Gres produces as well. Because perch hold tighter than walleye, the wind '
        'stacking effect matters less for finding them, which is exactly why they are the better target on a day '
        'when you want to stay on the calm shore.</p>'

        '<h2>Why perch suit a small boat</h2>'
        '<ul class="tight">'
        '<li><strong>You do not need to cross the bay.</strong> Productive perch water sits off both shores, so you '
        'can fish whichever side the wind is favoring instead of committing to a long run.</li>'
        '<li><strong>You can anchor.</strong> Perch fishing is a stationary game, so a day with a light chop is '
        'workable in a way that a trolling program in the same conditions is not.</li>'
        '<li><strong>The gear is simple.</strong> This is a fishery you can do well at with a rod, a small hook, and '
        'minnows, which makes it the right introduction for someone new.</li>'
        '<li><strong>Short trips work.</strong> If they are biting you know quickly, and if they are not you have '
        'not burned a tank of fuel finding out.</li>'
        '</ul>'

        '<h2>Practical notes</h2>'
        '<p>Perch move, and a spot that produced last weekend can be empty. The usual approach is to make short '
        'moves rather than long ones, checking depths within the same general area before giving up on it. When you '
        'find them, mark it, because the school will often be in the neighborhood again.</p>'
        '<p>Water clarity matters less for perch than for walleye, which is another reason they are the sensible '
        'choice after a hard blow has stained the whole bay. If the walleye plan fell apart because the wind went '
        'the wrong way, perch on the lee shore is usually still a real option.</p>'
        '<p>Size limits and daily possession limits for perch are set by the state and are not the same everywhere '
        'in Michigan waters. Check the current regulations rather than relying on what somebody at the ramp '
        'remembers.</p>'
        '<div class="anchor-list">'
        '<a href="/">Live conditions</a><a href="/eastern-bay.html">Eastern bay and Bay Port</a>'
        '<a href="/inner-bay.html">Inner bay</a><a href="/launches-and-access.html">Launches and access</a>'
        '<a href="https://www.michigan.gov/dnr/things-to-do/fishing">DNR fishing regulations</a>'
        '</div>'
        + FOOTER
    )
    (OUT / "perch.html").write_text(head(
        "Saginaw Bay Perch: When and Where to Find Jumbo Yellow Perch",
        "The Saginaw Bay yellow perch fishery, when the jumbo class shows up, where to find them off each shore, "
        "and why perch are the better target for a small boat on a windy day.",
        url, ld) + body)


# ------------------------------------------------------------------ shores
ZONES = [
    dict(
        slug="inner-bay", camera_place="the Kawkawlin, Bay City", camera="kawkawlin-bay-city", name="Inner Bay", nav="/inner-bay.html",
        subtitle="Bay City, Linwood, Pinconning",
        depths="8 to 17 feet",
        launches="Bay City State Park, Linwood, Pinconning",
        spots="the shipping channel edge, the river mouth, the Smith Park shoreline, and the Bay City State Park flats",
        species="walleye, perch, smallmouth",
        lee_when="west and southwest",
        blurb=("The protected end of the bay and the one most people learn on. Eight to seventeen feet of water "
               "from Bay City up past Linwood to Pinconning, with the shipping channel running through it and the "
               "river mouth at the bottom. This is the zone a smaller boat can actually fish."),
        detail=("The inner bay is shallow enough that it warms first in spring and stirs first in wind. The "
                "shipping channel edge is the one piece of real structure, and it holds fish because there is very "
                "little else for them to relate to. The river mouth adds current, warmer water in spring, and the "
                "rip rap around the Dredge Island.\n\nBecause it sits at the southwest end, this zone is in the "
                "lee when the wind is out of the west or southwest, which is the common case. That is why it is the "
                "default choice. It is also the zone that takes the worst of a north or northeast blow, because all "
                "the water the wind pushes down the bay has nowhere to go but the shallow corner these towns sit on."),
        notes=[
            ("Smallest boat friendly", "Eight to seventeen feet of water and the shortest run from the ramp. If you "
             "are unsure about the day, this is the zone to be in."),
            ("The channel edge is the structure", "In a bay this featureless the shipping channel edge does most of "
             "the work. Troll it rather than the open flats."),
            ("Warms first, stirs first", "Early season fish show up here before anywhere else, and a modest wind "
             "stains it before it stains the rest of the bay."),
        ],
    ),
    dict(
        slug="lower-bay", camera_place="the Pine River, Standish", camera="pine-river-standish", name="Lower Bay", nav="/lower-bay.html",
        subtitle="Thomas Road, Finn Road, Callahan Reef",
        depths="18 to 35 feet",
        launches="Au Gres, Omer, Standish",
        spots="Thomas Road, Finn Road, Vasser Road, Callahan Reef, and the Buoy 1 and 2 area",
        species="walleye, lake trout",
        lee_when="no direction reliably, it is open water",
        blurb=("Open water, eighteen to thirty five feet, and where the biggest walleye live. The lower bay is "
               "reached off Au Gres, Omer, and Standish, and the reference points people actually use out here are "
               "road ends and reefs: Thomas Road, Finn Road, Vasser Road, Callahan Reef."),
        detail=("This is the trophy zone and the one that demands the most boat. There is no shoreline close enough "
                "to hide behind, the water is deep enough to hold fish through the summer heat, and the fish out "
                "here run larger than the inner bay average. The naming convention tells you something about how it "
                "gets fished: anglers line up on road ends onshore and run out on those bearings, because in open "
                "water with no structure that is how you keep track of where you were.\n\nThe honest warning is "
                "that this zone has no lee. When the wind comes up there is nowhere close to duck into, and the run "
                "back to Au Gres or Standish is long. A day that is merely uncomfortable in the inner bay can be "
                "genuinely bad out here, and that is the reason to check the wind before hooking up rather than "
                "after."),
        notes=[
            ("Trophy water, bigger boat", "Eighteen to thirty five feet and no shelter. The fish are larger and the "
             "margin for a bad forecast is smaller."),
            ("Road ends are the coordinate system", "Thomas, Finn, and Vasser Roads are how people describe position "
             "out here, because there is nothing else to describe."),
            ("Callahan Reef is the exception", "Hard structure in open water. Fish stack on it, and so do boats."),
        ],
    ),
    dict(
        slug="eastern-bay", camera_place="the Sebewaing River", camera="sebewaing-river", name="Eastern Bay", nav="/eastern-bay.html",
        subtitle="Sebewaing, Wildfowl Bay, Fish Point",
        depths="8 to 20 feet",
        launches="Sebewaing, Bay Port, Unionville, Caseville",
        spots="Wildfowl Bay, the Fish Point to Sand Point run, Spoils Island, Quanicassee, and the east edge of Callahan Reef",
        species="perch, pike, walleye",
        lee_when="east and northeast",
        blurb=("The shallow eastern shoreline, and the most different of the three. Eight to twenty feet from "
               "Quanicassee north through Sebewaing and Bay Port to Caseville, with Wildfowl Bay and Fish Point "
               "behind it. Perch and pike matter here as much as walleye."),
        detail=("The eastern bay is broad, shallow, and weedier than the west side, with extensive reeds and "
                "bulrush in the lower reaches. That habitat is why the species mix widens: yellow perch and "
                "northern pike are genuine targets here, not incidental. Walleye work the slot along this shore, "
                "and the east edge of Callahan Reef is the hard structure at the boundary with the lower bay."
                "\n\nThis zone is in the lee when the wind is out of the east or northeast, and it is the shore "
                "the water stacks onto during the common west wind. That is the trade this whole site is built "
                "around: a sustained westerly makes this the productive shore and the rough one at the same time. "
                "Ramps here are spaced farther apart than on the west side, so committing to this zone on a day "
                "with a wind shift in the forecast is a real decision."),
        notes=[
            ("Where fish stack on a west wind", "Sustained westerlies push current and bait this way, toward "
             "Callahan Reef, Sebewaing, Bay Port, and Caseville. The oldest piece of local knowledge about this bay."),
            ("Perch and pike, not just walleye", "Wildfowl Bay and the shallow weedy water change the species mix. "
             "This is the zone to fish when the walleye plan blows out."),
            ("Ramps are spaced out", "Sebewaing, Bay Port, Unionville, and Caseville cover a lot of shoreline. The "
             "nearest alternative harbor can be a long run if the wind swings."),
        ],
    ),
]



# ---------------------------------------------------------------- cameras
# USGS streamgage cameras, served through the shared camera API on chrisizworski.com so this
# project does not carry a second copy of the registry and proxy. That API sets CORS *, and the
# renderer degrades to a plain line of text if it is unreachable, so a hub outage cannot break
# a zone page.
#
# What these are: a look at the water at a launch or a river mouth, updated hourly in daylight.
# What they are NOT: a view of the open bay. The wind and fetch read above still decides whether
# the bay is fishable. The camera answers the narrower question of what the water looks like where
# you put in, which is the question the gauge numbers alone cannot answer.
CAMERA_API = "https://chrisizworski.com/api/field-camera"

def camera_block(cam_id, heading, intro):
    return (
        f'<h2>{heading}</h2>'
        f'<p>{intro}</p>'
        f'<div class="field-camera" data-field-camera="{cam_id}">'
        '<p class="camera-out">Loading the camera.</p></div>'
    )

def build_zone(s):
    url = SITE + s["nav"]
    others = [x for x in ZONES if x["slug"] != s["slug"]]
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#webpage", "url": url,
         "name": f"Saginaw Bay {s['name']}: {s['subtitle']}",
         "description": f"Live wind and conditions for the Saginaw Bay {s['name'].lower()}: {s['subtitle']}, "
                        f"{s['depths']}, with local fishing notes and when this zone is in the lee.",
         "isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en-US",
         "author": {"@id": PERSON_ID}, "breadcrumb": {"@id": url + "#breadcrumb"}},
        breadcrumb([("Saginaw Bay Report", SITE + "/"), (s["name"], url)]),
        PERSON_NODE,
    ]}
    notes = "".join(f'<div class="tile"><h3>{t}</h3><p>{d}</p></div>' for t, d in s["notes"])
    detail = "".join(f"<p>{para}</p>" for para in s["detail"].split("\n\n"))
    for k in ("extra", "extra2"):
        if s.get(k):
            detail += f"<p>{s[k]}</p>"
    body = (
        header("/") +
        f'<h1 style="font-size:30px;margin:22px 0 0">Saginaw Bay {s["name"].lower()}</h1>'
        f'<p class="lede">{s["blurb"]}</p>'
        f'<p class="note">{s["subtitle"]}. Typical depths {s["depths"]}. Launches at {s["launches"]}. '
        f'Named water: {s["spots"]}. In the lee when the wind is out of the {s["lee_when"]}.</p>'
        + live_block() +
        (camera_block(
            s["camera"],
            f'Camera on the water at {s["camera_place"]}',
            'A USGS camera looking at the water itself, updated through daylight hours. It shows you '
            'colour, level and whether anything is moving, which the gauge numbers cannot. It looks at '
            'the river and the launch, not at the open bay, so read it alongside the wind above rather '
            'than instead of it.') if s.get("camera") else '') +
        '<h2>What this shore is like</h2>' + detail +
        '<h2>Local notes</h2>'
        f'<div class="grid two">{notes}</div>'
        '<h2>The other two zones</h2>'
        '<p>Conditions in one zone only make sense next to the others, because the wind that calms one end of this '
        'bay roughs up the other.</p>'
        '<div class="grid two">'
        + "".join(
            f'<div class="tile"><h3><a href="{o["nav"]}">{o["name"]}</a></h3>'
            f'<p>{o["subtitle"]}. {o["depths"]}. {o["blurb"][:130]}...</p></div>'
            for o in others)
        + f'<div class="tile"><h3><a href="/wind-and-fish-location.html">How to choose</a></h3>'
          f'<p>The lee zone is comfortable, the windward zone is where the water and bait stack. Picking between '
          f'them is the actual decision.</p></div></div>'
        '<h2>Related</h2>'
        '<div class="anchor-list">'
        '<a href="/">Live conditions</a><a href="/walleye.html">Walleye by season</a>'
        '<a href="/perch.html">Perch</a><a href="/launches-and-access.html">Launches and access</a>'
        '<a href="/saginaw-river.html">Saginaw River</a>'
        '</div>'
        + FOOTER
    )
    (OUT / f"{s['slug']}.html").write_text(head(
        f"Saginaw Bay {s['name']}: {s['subtitle']}, Live Wind and Conditions",
        f"Live wind and conditions for the Saginaw Bay {s['name'].lower()} at {s['subtitle']}. Depths {s['depths']}, "
        f"launches at {s['launches']}, and when this zone sits in the lee.",
        url, ld) + body)


# ------------------------------------------------------------------ river
def build_river():
    url = SITE + "/saginaw-river.html"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "@id": url + "#article",
         "headline": "The Saginaw River, the Mouth, and the Spring Walleye Run",
         "description": "The Saginaw River system as it relates to bay fishing: the spring walleye run up the "
                        "Tittabawassee, the Dredge Island rip rap, and why the river gauge can read negative.",
         "author": {"@id": PERSON_ID}, "publisher": {"@id": PERSON_ID},
         "inLanguage": "en-US", "mainEntityOfPage": url,
         "isPartOf": {"@id": SITE + "/#website"}},
        breadcrumb([("Saginaw Bay Report", SITE + "/"), ("Saginaw River", url)]),
        PERSON_NODE,
    ]}
    body = (
        header("/saginaw-river.html") +
        '<h1 style="font-size:30px;margin:22px 0 0">The Saginaw River, the mouth, and the spring run</h1>'
        '<p class="lede">The river is the bay\'s front door. It is where the walleye spawn, where the season starts, '
        'and where you go when the bay itself is unfishable.</p>'
        + live_block() +
        camera_block(
            "saginaw-river-holland",
            "Camera on the river at Holland Avenue",
            'This camera watches the same water as USGS gauge 04157005, the top of the gauge chain below. '
            'The turbidity number tells you how stained the river is running; the picture tells you what that '
            'number actually looks like, about half a day before that water reaches the bay.') +
        

        '<h2>The system above the mouth</h2>'
        '<p>The Saginaw River is short but it drains an enormous watershed. The Tittabawassee, the Cass, the Flint, '
        'and the Shiawassee all feed it, which is why the flow at Saginaw can be large and why it responds to rain '
        'far inland rather than to weather on the bay. For fishing purposes the important tributary is the '
        'Tittabawassee, which carries the best known walleye run in the state.</p>'
        '<p>The run generally builds from late March through mid April, with timing set by water temperature and by '
        'how the ice went out. Fish stack in the river, then drop back toward the bay after spawning, which is why '
        'the mouth stays productive well after the river itself has quieted down.</p>'

        '<h2>The mouth and the Dredge Island</h2>'
        '<p>Where the river meets the bay there is structure worth knowing. The Dredge Island near the mouth has rip '
        'rap edges that hold baitfish, and it is the first real structure post spawn fish encounter coming back out. '
        'Pitching jigs along that rock is a reliable way to catch fish moving in both directions during the '
        'transition, and it is close enough to the ramps to be worth an evening.</p>'
        '<p>The shipping channel runs out from the mouth and is a genuine feature in a bay that is otherwise flat. '
        'Fish use it, and on an east or northeast wind local knowledge puts walleye in and along it. It is also a '
        'working channel with commercial traffic, so it is not a place to anchor casually.</p>'

        '<h2>Why the river gauge can read negative</h2>'
        '<p>The USGS gauge on the Saginaw River sometimes reports a negative discharge, meaning water is moving '
        'upstream rather than down. That is not an error. On a shallow bay with a long axis, a sustained wind pushes '
        'water toward one end and it has to go somewhere. When it piles into the southwest corner, it backs up the '
        'river.</p>'
        '<p>This is a genuinely useful signal. A strongly negative reading means the bay is stacking hard toward the '
        'river mouth, which tells you the wind has been north or northeast for a while, which tells you the inner '
        'bay is rough and the water at the mouth is being pushed rather than flushed. It is one of the few places '
        'where a single number describes the whole bay\'s state.</p>'

        '<h2>The river as a fallback</h2>'
        '<p>The most practical reason to know the river is that it is fishable when the bay is not. On a day the '
        'buoys read twenty plus and every shore is a bad idea, the river is sheltered, has current, has structure, '
        'and holds fish. Plenty of good days on the Saginaw started as cancelled days on the bay.</p>'
        '<p>The tradeoff is that river water and bay water behave differently. The river responds to rain upstream '
        'and can be high and dirty when the bay is fine, or low and clear when the bay is churned. Reading them as '
        'one system is the mistake; they are two, connected at the mouth.</p>'
        '<div class="anchor-list">'
        '<a href="/">Live conditions</a><a href="/walleye.html">Walleye by season</a>'
        '<a href="/wind-and-fish-location.html">Why wind moves the water</a>'
        '<a href="/launches-and-access.html">Ramps on the river</a>'
        '<a href="https://waterdata.usgs.gov/mi/nwis/rt">USGS Michigan real time water data</a>'
        '</div>'
        + FOOTER
    )
    (OUT / "saginaw-river.html").write_text(head(
        "Saginaw River: The Spring Walleye Run, the Mouth, and the Negative Gauge",
        "The Saginaw River and its mouth as they relate to bay fishing: the Tittabawassee spring walleye run, the "
        "Dredge Island rip rap, and why the river gauge can read negative when wind stacks the bay.",
        url, ld) + body)


# ------------------------------------------------------------------ launches
def build_launches():
    url = SITE + "/launches-and-access.html"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "@id": url + "#article",
         "headline": "Saginaw Bay Launches and Shore Access",
         "description": "Where to launch on each Saginaw Bay shore, which ramps are usable in a blow, and where to "
                        "fish from shore without a boat.",
         "author": {"@id": PERSON_ID}, "publisher": {"@id": PERSON_ID},
         "inLanguage": "en-US", "mainEntityOfPage": url,
         "isPartOf": {"@id": SITE + "/#website"}},
        breadcrumb([("Saginaw Bay Report", SITE + "/"), ("Launches and access", url)]),
        PERSON_NODE,
    ]}
    body = (
        header("/launches-and-access.html") +
        '<h1 style="font-size:30px;margin:22px 0 0">Launches and shore access</h1>'
        '<p class="lede">Which side you launch from is the first decision the wind makes for you. This is how to '
        'think about it, plus what to do when you do not have a boat at all.</p>'
        + live_block() +

        '<h2>Choosing a ramp by wind</h2>'
        '<p>The rule is simple even though the bay is not. Launch on the shore the wind is coming from. That shore '
        'has no fetch behind it, so the water at the ramp is flat and loading and unloading is easy. Launching on '
        'the downwind shore in a real blow means a wet, difficult ramp and a beam sea the moment you clear it.</p>'
        '<div class="tbl-wrap"><table><thead><tr><th>Wind from</th><th>Launch side</th><th>Notes</th></tr></thead><tbody>'
        '<tr><td class="num">W, SW</td><td>West shore</td>'
        '<td>Linwood, Pinconning, Au Gres. Flat at the ramp, and a short run to fish the edge of the stain.</td></tr>'
        '<tr><td class="num">E, NE</td><td>East shore</td>'
        '<td>Sebewaing, Bay Port, Quanicassee. The west shore ramps will be taking it.</td></tr>'
        '<tr><td class="num">S, SW</td><td>River mouth and south end</td>'
        '<td>Bay City ramps. Protected, and the river is right there as a fallback.</td></tr>'
        '<tr><td class="num">N, NE strong</td><td>Consider the river instead</td>'
        '<td>Longest fetch in the bay drives straight into the southwest corner. Few good options.</td></tr>'
        '</tbody></table></div>'

        '<h2>The west shore ramps</h2>'
        '<p>Bay City sits at the river mouth and gives access to both the river and the lower bay, which makes it '
        'the most flexible starting point and the right choice when the forecast is uncertain. North of there, '
        'Linwood and Pinconning put you into the middle of the inner bay quickly. Standish and the Pine River area '
        'sit near the top of the inner bay, and Au Gres and Tawas open onto the outer bay and the water that holds '
        'fish through summer.</p>'

        '<h2>The east shore ramps</h2>'
        '<p>Quanicassee sits on the broad shallow flats at the south end of the east side and is the closest east '
        'shore access to Bay City. Sebewaing and Bay Port are the traditional east side jumping off points, with '
        'Bay Port in particular tied to the perch fishery. Caseville sits at the top of the east shore near the '
        'transition to the outer bay and Port Austin beyond it.</p>'
        '<p>Depth at the ramp is worth checking on the east side, because the flats are broad and shallow and a '
        'hard offshore wind can pull water off them. A strong west wind that makes this shore rough also lowers the '
        'water at the west shore ramps, which is the less obvious half of wind stacking.</p>'

        '<h2>Fishing without a boat</h2>'
        '<p>A real share of the fishing on this bay happens from shore, and the season for it is genuinely good. '
        'The Saginaw River through Bay City has public access and holds fish through the spring run and again in '
        'fall. Piers, breakwalls, and river mouths along both shores concentrate fish, particularly when wind is '
        'pushing water and bait against them.</p>'
        '<p>The wind logic inverts for shore anglers in a useful way. A boat wants the lee shore for comfort. From '
        'shore you often want the windward side, because that is where the water is stacking and the bait is being '
        'pushed in, and standing on solid ground means the chop costs you nothing. A blown out day for boats is '
        'frequently a good day on a pier.</p>'

        '<h2>Practical notes</h2>'
        '<ul class="tight">'
        '<li><strong>Check the ramp before the forecast changes.</strong> Wind that swings while you are out can '
        'turn an easy launch into a hard retrieve.</li>'
        '<li><strong>Watch the water level, not just the wind.</strong> Sustained wind moves water off one end of '
        'this bay and onto the other, and shallow ramps feel it.</li>'
        '<li><strong>The river is always an option.</strong> On the worst bay days it is sheltered, has current, '
        'and holds fish.</li>'
        '<li><strong>Facilities and fees vary.</strong> State, county, and municipal ramps have different rules and '
        'seasons. Confirm before you drive.</li>'
        '</ul>'
        '<div class="anchor-list">'
        '<a href="/">Live conditions</a><a href="/inner-bay.html">Inner bay</a>'
        '<a href="/eastern-bay.html">Eastern bay</a><a href="/saginaw-river.html">Saginaw River</a>'
        '<a href="/wind-and-fish-location.html">Wind and fish location</a>'
        '</div>'
        + FOOTER
    )
    (OUT / "launches-and-access.html").write_text(head(
        "Saginaw Bay Launches and Shore Access: Which Ramp for Today's Wind",
        "Where to launch on Saginaw Bay for the current wind, ramps on the west and east shores, why shore anglers "
        "should do the opposite of boaters, and when to fish the river instead.",
        url, ld) + body)


build_index()
build_wind()
build_walleye()
build_perch()
for z in ZONES:
    build_zone(z)
build_river()
build_launches()

print("pages written:")
for p in sorted(OUT.glob("*.html")):
    print(f"  {p.name:34} {p.stat().st_size:,} bytes")
