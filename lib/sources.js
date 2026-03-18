// Saginaw Bay Report — Data Source Registry
//
// Three bay zones, each with distinct character:
//   INNER BAY  — Bay City to Linwood, 8-17 fow, walleye trolling, protected
//   LOWER BAY  — Thomas/Finn Roads, 18-35 fow, big walleye, open water
//   EASTERN BAY — Sebewaing/Wildfowl Bay, perch, pike, ice fishing access

// NDBC Wind Buoys
export const BUOYS = {
  SBLM4: {
    id: 'SBLM4',
    name: 'Saginaw Bay Light #1',
    lat: 43.810, lon: -83.720,
    location: 'Mid-bay, lower Saginaw Bay',
    dataUrl: 'https://www.ndbc.noaa.gov/data/realtime2/SBLM4.txt',
    zones: ['inner', 'lower'],
  },
  GSLM4: {
    id: 'GSLM4',
    name: 'Gravelly Shoal Light',
    lat: 43.961, lon: -83.565,
    location: 'Inner bay, near mouth',
    dataUrl: 'https://www.ndbc.noaa.gov/data/realtime2/GSLM4.txt',
    zones: ['inner'],
  },
};

// USGS River Gauges — Saginaw River feeds the bay
// Turbidity and flow here = bay clarity in 12-24h
export const GAUGES = {
  '04157005': {
    name: 'Saginaw River at Holland Ave',
    location: 'Saginaw',
    params: ['00060','00010','63680','00300','00095'], // flow, temp, turbidity, DO, conductance
    zone: 'river',
    lagHours: 12, // hours until turbidity reaches inner bay
  },
  '04157060': {
    name: 'Saginaw River at Midland St',
    location: 'Bay City',
    params: ['00060','00065'],
    zone: 'river',
    lagHours: 6,
  },
  '04157063': {
    name: 'Saginaw River at Essexville',
    location: 'Essexville',
    params: ['00060','00065'],
    zone: 'river',
    lagHours: 2, // closest to bay mouth
  },
};

// NOAA CO-OPS water level — Lake Huron
export const WATER_LEVEL = {
  station: '9075014',
  name: 'Harbor Beach',
  normalFt: 577.5,  // approximate IGLD historical mean
};

// NWS Forecast Grids (pre-computed from api.weather.gov/points)
// DTX = Detroit office, handles Lake Huron / Saginaw Bay
export const NWS_GRIDS = {
  bay_city:  { cwa: 'DTX', gridX: 33, gridY: 89,  label: 'Bay City / Inner Bay' },
  mid_bay:   { cwa: 'DTX', gridX: 37, gridY: 96,  label: 'Mid Bay' },
  outer_bay: { cwa: 'DTX', gridX: 41, gridY: 107, label: 'Outer Bay / Au Gres' },
};

// Bay Zones — the three fisheries
export const ZONES = {
  inner: {
    id: 'inner',
    name: 'Inner Bay',
    subtitle: 'Bay City · Linwood · Pinconning',
    description: 'Protected waters, 8-17 feet. Walleye trolling the shipping channel edge and river mouth. Accessible for smaller boats.',
    species: ['walleye', 'perch', 'smallmouth'],
    typicalDepths: '8-17 fow',
    launches: ['Bay City State Park', 'Linwood', 'Pinconning'],
    hotSpots: ['Shipping channel edge', 'River mouth', 'Smith Park shoreline', 'Bay City State Park flats'],
    nwsGrid: 'bay_city',
    color: '#2a5a7a',
  },
  lower: {
    id: 'lower',
    name: 'Lower Bay',
    subtitle: 'Thomas Road · Finn Road · Callahan Reef',
    description: 'Open water fishing 18-35 feet. Trophy walleye territory. Requires larger boat in rough conditions.',
    species: ['walleye', 'lake trout'],
    typicalDepths: '18-35 fow',
    launches: ['Au Gres', 'Omer', 'Standish'],
    hotSpots: ['Thomas Road', 'Finn Road', 'Callahan Reef', 'Vasser Road', 'Buoy 1 & 2'],
    nwsGrid: 'mid_bay',
    color: '#1e3d5c',
  },
  eastern: {
    id: 'eastern',
    name: 'Eastern Bay',
    subtitle: 'Sebewaing · Wildfowl Bay · Fish Point',
    description: 'Shallow eastern shoreline. Yellow perch, northern pike, and walleye along the slot. Ice fishing access in winter.',
    species: ['perch', 'pike', 'walleye'],
    typicalDepths: '8-20 fow',
    launches: ['Sebewaing', 'Bay Port', 'Unionville', 'Caseville'],
    hotSpots: ['Wildfowl Bay', 'Fish Point to Sand Point', 'Spoils Island', 'Quanicassee', 'Callahan Reef east edge'],
    nwsGrid: 'outer_bay',
    color: '#2d4a3e',
  },
};

// Seasonal calendar — Saginaw Bay
export const SEASONS = {
  ice_fishing: { months: [12, 1, 2], label: 'Ice Fishing', species: ['walleye', 'perch', 'pike'] },
  walleye_spawn: { months: [3, 4], label: 'Walleye Spawn Run', tempF: [38, 50], species: ['walleye'] },
  spring_walleye: { months: [4, 5], label: 'Spring Walleye', tempF: [45, 58], species: ['walleye', 'perch'] },
  peak_season: { months: [5, 6, 7, 8], label: 'Peak Season', tempF: [55, 72], species: ['walleye', 'perch', 'pike', 'smallmouth'] },
  fall_walleye: { months: [9, 10], label: 'Fall Walleye', tempF: [48, 62], species: ['walleye', 'perch'] },
  late_fall: { months: [11], label: 'Late Fall / Pre-Ice', species: ['walleye', 'perch'] },
};
