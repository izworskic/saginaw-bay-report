// Saginaw Bay Report — Conditions Rater
//
// Unlike river trout fishing (flow-driven), bay fishing is wind-driven.
// Rating logic: wind first, then turbidity, then temperature.

export const RATINGS = {
  FLAT_CALM:  { key: 'FLAT_CALM',  label: 'Flat Calm',    emoji: '🟢', color: '#1a7a3a', bg: '#e6f5eb', tagline: 'Perfect conditions. Get out there.' },
  GOOD_CHOP:  { key: 'GOOD_CHOP', label: 'Good Chop',    emoji: '✅', color: '#2e7d32', bg: '#e8f5e9', tagline: 'Fishing well. Worth the drive.' },
  MODERATE:   { key: 'MODERATE',  label: 'Moderate',      emoji: '🟡', color: '#b08000', bg: '#fffde7', tagline: 'Fishable. Know your boat.' },
  ROUGH:      { key: 'ROUGH',     label: 'Rough',         emoji: '🟠', color: '#cc5500', bg: '#fff3e0', tagline: 'Small boats stay in. Use caution.' },
  DANGEROUS:  { key: 'DANGEROUS', label: 'Dangerous',     emoji: '🔴', color: '#b71c1c', bg: '#ffebee', tagline: 'No recreational fishing. Stay home.' },
  POOR_WATER: { key: 'POOR_WATER',label: 'Poor Clarity',  emoji: '🟤', color: '#795548', bg: '#efebe9', tagline: 'Water conditions poor. Fish outer bay.' },
};

// Wind is the primary rating driver for bay fishing
function rateByWind(wspd_mph) {
  if (wspd_mph === null || wspd_mph === undefined) return null;
  if (wspd_mph < 5)   return 'FLAT_CALM';
  if (wspd_mph < 10)  return 'GOOD_CHOP';
  if (wspd_mph < 15)  return 'MODERATE';
  if (wspd_mph < 22)  return 'ROUGH';
  return 'DANGEROUS';
}

// Turbidity modifies the rating for inner bay zones
function rateByTurbidity(fnu) {
  if (fnu === null) return null;
  if (fnu < 15) return null;     // no modification
  if (fnu < 40) return 'MODERATE';   // off-color but fishable
  return 'POOR_WATER';            // seriously muddy
}

export function rateZone(zoneId, windData, waterData) {
  const wspd = windData?.wind?.wspd_mph ?? null;
  const turb  = waterData?.['04157005']?.turbidity_fnu ?? null;

  const windRating = rateByWind(wspd);
  const turbRating = rateByTurbidity(turb);

  // For inner bay, turbidity matters a lot (it's getting river water directly)
  // For lower and eastern bay, wind dominates more
  let finalKey;
  if (zoneId === 'inner') {
    // Inner bay: worst of wind or turbidity
    const ratings = [windRating, turbRating].filter(Boolean);
    const order = ['FLAT_CALM','GOOD_CHOP','MODERATE','ROUGH','DANGEROUS','POOR_WATER'];
    finalKey = ratings.sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] || 'MODERATE';
  } else if (zoneId === 'lower') {
    // Lower bay: wind-driven, less turbidity impact (cleaner water)
    finalKey = windRating || 'MODERATE';
  } else {
    // Eastern bay: wind with some turbidity concern
    const order = ['FLAT_CALM','GOOD_CHOP','MODERATE','ROUGH','DANGEROUS','POOR_WATER'];
    const ratings = [windRating, turbRating && turb > 60 ? turbRating : null].filter(Boolean);
    finalKey = ratings.sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] || 'MODERATE';
  }

  return RATINGS[finalKey] || RATINGS.MODERATE;
}

// Season and conditions context
export function getSeasonContext(month, waterTempF) {
  if ([12, 1, 2].includes(month)) {
    return {
      season: 'ice_fishing',
      label: 'Ice Fishing Season',
      primarySpecies: 'Yellow Perch, Walleye (ice)',
      note: 'Check ice thickness and conditions before venturing out. Fish Point, Wildfowl Bay, Sebewaing.',
    };
  }
  if (month === 3 || (month === 4 && (waterTempF === null || waterTempF < 45))) {
    return {
      season: 'pre_spawn',
      label: 'Pre-Season / Spawn Run',
      primarySpecies: 'Walleye',
      note: 'Walleye staging for spawn run. Saginaw River mouth and inner bay edges. Slot regulations apply.',
    };
  }
  if (month === 4 || (month === 5 && (waterTempF === null || waterTempF < 55))) {
    return {
      season: 'spring_walleye',
      label: 'Spring Walleye',
      primarySpecies: 'Walleye, Yellow Perch',
      note: 'Peak spring walleye trolling. Thomas Road and Finn Road zones. Crawlers and blade baits.',
    };
  }
  if ([5, 6, 7, 8].includes(month)) {
    return {
      season: 'peak',
      label: 'Peak Season',
      primarySpecies: 'Walleye, Yellow Perch, Smallmouth, Northern Pike',
      note: 'Full season underway. Walleye trolling in deeper water. Perch on the reefs. Charter captains running daily.',
    };
  }
  if ([9, 10].includes(month)) {
    return {
      season: 'fall',
      label: 'Fall Walleye',
      primarySpecies: 'Walleye, Perch',
      note: 'Fall bite can be excellent. Walleye move shallower as water cools. Perch active on structure.',
    };
  }
  return {
    season: 'late_fall',
    label: 'Late Fall',
    primarySpecies: 'Walleye, Perch',
    note: 'Season winding down. Fish moving to winter locations. Watch for ice forming on east side.',
  };
}
