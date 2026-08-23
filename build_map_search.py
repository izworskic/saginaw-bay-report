#!/usr/bin/env python3
"""Build the measured 2026-08-23 Saginaw Bay map search treatment.

The base generator remains the source of truth. During the 28-day experiment this
script applies only the search-facing map treatment, runs the generator, and then
asserts the resulting production HTML still owns the same canonical and utility.
"""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "gen_map.py"
TEMP = ROOT / ".gen_map_search_treatment.py"
OUTPUT = ROOT / "public" / "map.html"

TITLE = "Saginaw Bay Fishing Map: Launches, Buoys & Callahan Reef"
META = (
    "Interactive Saginaw Bay fishing map with 10 public launches, live NOAA buoys, "
    "Callahan Reef, shipping channel, Spoils Island and other named water."
)
SCHEMA_NAME = "Saginaw Bay Fishing Map: Launches, Buoys, and Named Water"
SCHEMA_DESC = (
    "Interactive Saginaw Bay fishing map showing 10 public boat launches, live NOAA buoys, "
    "Callahan Reef, the shipping channel, Spoils Island, Wildfowl Bay, and other named water."
)
H1 = "Saginaw Bay Fishing Map"
LEDE = (
    "Use this Saginaw Bay fishing map to locate 10 public launches, three live NOAA wind stations, "
    "Callahan Reef, the shipping channel, Spoils Island, Wildfowl Bay, and other named water across "
    "the Inner, Lower, and Eastern Bay."
)

replacements = [
    (
        '"name": "Saginaw Bay Map: Launches, Buoys, and Named Water",',
        f'"name": "{SCHEMA_NAME}",',
        "schema name",
    ),
    (
        '"description": "Interactive Saginaw Bay map showing public boat launches, live NOAA buoys, and the "\n                        "named water anglers actually use, split across the Inner, Lower, and Eastern Bay.",',
        f'"description": "{SCHEMA_DESC}",',
        "schema description",
    ),
    (
        '"isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en-US",',
        '"isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en-US", "dateModified": "2026-08-23",',
        "schema freshness",
    ),
    (
        "'<h1 style=\"font-size:30px;margin:22px 0 0\">Saginaw Bay map</h1>'",
        f"'<h1 style=\"font-size:30px;margin:22px 0 0\">{H1}</h1>'",
        "H1",
    ),
    (
        "'<p class=\"lede\">Every public launch, every live buoy, and the named water people actually give each '\n        'other directions by. Click any marker for detail and a link through to the zone it sits in.</p>'",
        f"'<p class=\"lede\">{LEDE}</p>'",
        "first answer",
    ),
    (
        '"Saginaw Bay Map: Boat Launches, Live Buoys, and Named Water",',
        f'"{TITLE}",',
        "document title",
    ),
    (
        '"Interactive Saginaw Bay map with ten public boat launches, three live NOAA buoys, and the named water "\n        "anglers use, across the Inner, Lower, and Eastern Bay.",',
        f'"{META}",',
        "meta description",
    ),
]

source = SOURCE.read_text()
for old, new, label in replacements:
    if old not in source:
        raise SystemExit(f"Search treatment refused: expected {label} source fragment is missing")
    source = source.replace(old, new, 1)

TEMP.write_text(source)
try:
    subprocess.run([sys.executable, str(TEMP)], cwd=ROOT, check=True)
finally:
    TEMP.unlink(missing_ok=True)

html = OUTPUT.read_text()
checks = {
    "title": f"<title>{TITLE}</title>",
    "meta": f'<meta name="description" content="{META}">',
    "canonical": '<link rel="canonical" href="https://saginawbay.chrisizworski.com/map.html">',
    "H1": f">{H1}</h1>",
    "first answer": LEDE,
    "schema freshness": '"dateModified":"2026-08-23"',
    "Callahan Reef": "Callahan Reef",
    "launch utility": "Lake Huron DNR Launch, Patterson Road",
    "live buoy utility": "Saginaw Bay Light #1",
}
missing = [name for name, needle in checks.items() if needle not in html]
if missing:
    raise SystemExit("Search treatment build failed checks: " + ", ".join(missing))

print("Saginaw Bay map search treatment PASS")
print("Baseline: 90 impressions / 2 clicks / 2.22% CTR / average position 10.37")
print("Target: >=3% CTR and average position <=10; stretch >=4% CTR / position <=8.5")
