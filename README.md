# Saginaw Bay Report

Live Saginaw Bay fishing conditions built on the one variable that governs this bay: wind.

## The premise
Saginaw Bay covers well over a thousand square miles and almost none of it is deep. The inner bay does not
stratify. Put fifteen knots across water like that and the whole column stirs, the bay stains, and the water
piles onto the downwind shore. That produces two answers, not one:

- the **lee shore**, where you can launch and stay comfortable, and
- the **windward shore**, where water and bait stack and walleye tend to concentrate.

They are usually opposite shores. Choosing between them is the actual decision, and no generic solunar "bite
score" can tell you which is which. The geometry in `public/bay.js` was validated against documented local
knowledge: a sustained west wind moves fish to the east side toward Sebewaing, Bay Port and Caseville, while
east and northeast wind pushes them toward Linwood and the shipping channel.

## Data
- **NOAA NDBC** buoys SBLM4 (Saginaw Bay Light, inner bay), GSLM4 (Gravelly Shoal Light), TAWM4 (Tawas Point).
  NDBC sends no CORS headers, so these are proxied through `/api/bay`, which also flags any observation older
  than three hours as stale rather than rendering it as live. The outer bay buoy 45163 is frequently offline
  and is deliberately not relied on.
- **USGS** gauge 04157005, Saginaw River at Saginaw: discharge, stage, water temperature. CORS open, fetched
  client side. This gauge can read negative when wind stacks the bay back up the river, which is a real signal
  about the whole bay rather than an error.
- **NWS API** for air temperature and forecasts. CORS open.
- **Michigan DNR** for seasons and limits, which are linked and never restated here because they change.

## Structure
Eight pages, every one of them a single click from the front page. No second level, no orphans.

## Rules baked in
- Shore reads are geometry plus weather. Nothing claims fish will bite.
- The launch read is blunt by design and cannot know your hull. It never says the bay is safe.
- Ice is out of scope and lives at the Michigan Ice Report.

## Build
`python3 gen_site.py` regenerates all pages into `public/`.
