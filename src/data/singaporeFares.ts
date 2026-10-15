import { LocationItem, PlatformId, RideOption, FarePredictionHour, PromoCode } from '../types';

// Haversine distance in km
export function calculateDistanceKm(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
  const R = 6371; // Earth radius in km
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Singapore road routing winding factor is ~1.32x
  return Math.max(1.8, Math.round(straightLine * 1.32 * 10) / 10);
}

// Estimate duration based on distance, time of day, and weather
export function estimateDurationMinutes(
  distanceKm: number,
  isPeakHour: boolean,
  weatherCondition: 'clear' | 'cloudy' | 'rain' | 'heavy_rain'
): number {
  let avgSpeedKmh = 42; // standard Singapore city/expressway mix
  if (isPeakHour) avgSpeedKmh -= 12; // 30 kmh in peak
  if (weatherCondition === 'rain') avgSpeedKmh -= 6;
  if (weatherCondition === 'heavy_rain') avgSpeedKmh -= 14;

  const hours = distanceKm / Math.max(18, avgSpeedKmh);
  const baseMinutes = Math.round(hours * 60);
  return Math.max(8, baseMinutes + 3); // add 3 mins for traffic lights/boarding
}

// Calculate Singapore ERP (Electronic Road Pricing) fee
export function calculateErpFee(origin: LocationItem, destination: LocationItem, hourDecimal: number): number {
  const isMorningPeak = hourDecimal >= 7.5 && hourDecimal <= 9.5;
  const isEveningPeak = hourDecimal >= 17.5 && hourDecimal <= 19.5;

  const hitsCbd =
    origin.erpZone?.includes('CBD') ||
    destination.erpZone?.includes('CBD') ||
    origin.district.includes('D01') ||
    destination.district.includes('D01');

  if (hitsCbd) {
    if (isMorningPeak) return 3.00;
    if (isEveningPeak) return 2.50;
    return 1.00;
  }

  // Sentosa island entry gantry
  if (origin.id.includes('sentosa') || destination.id.includes('sentosa')) {
    // If destination is Sentosa, entry fee applies (standard taxi/private hire S$3)
    if (destination.id.includes('sentosa')) {
      return 3.00;
    }
  }

  if (isMorningPeak || isEveningPeak) {
    return 1.50;
  }
  return 0.00;
}

// Special location surcharges (e.g. Changi Airport S$6/S$8, Sentosa S$3)
export function calculateSpecialSurcharges(origin: LocationItem, destination: LocationItem, hourDecimal: number): { amount: number; label?: string } {
  if (origin.id.startsWith('changi') || origin.id.startsWith('jewel')) {
    const isEveningAirportPeak = hourDecimal >= 17.0 && hourDecimal <= 23.9;
    const amount = isEveningAirportPeak ? 8.00 : 6.00;
    return { amount, label: `Changi Airport Pick-up Levy (S$${amount.toFixed(2)})` };
  }

  if (origin.id.includes('sentosa')) {
    return { amount: 3.00, label: 'Sentosa Island Island Pick-up Surcharge (S$3.00)' };
  }

  if (origin.id === 'woodlands_checkpoint') {
    return { amount: 2.00, label: 'Woodlands Border Area Queue Surcharge (S$2.00)' };
  }

  return { amount: 0 };
}

export function computePlatformSurgeMultiplier(
  platform: PlatformId,
  hourDecimal: number,
  weatherCondition: 'clear' | 'cloudy' | 'rain' | 'heavy_rain',
  demandHotspot: boolean
): number {
  let baseSurge = 1.0;

  // Time based surges in Singapore
  // 7:30 - 9:30 AM (CBD morning commute)
  if (hourDecimal >= 7.5 && hourDecimal <= 9.5) {
    baseSurge += 0.35;
  }
  // 17:30 - 20:30 PM (Evening commute & dinner rush)
  else if (hourDecimal >= 17.5 && hourDecimal <= 20.5) {
    baseSurge += 0.45;
  }
  // Midnight 00:00 - 05:00 (Night life)
  else if (hourDecimal >= 0.0 && hourDecimal <= 5.0) {
    baseSurge += 0.20;
  }

  // Weather impact (Singapore downpours drastically increase private-hire surge)
  if (weatherCondition === 'rain') {
    baseSurge += 0.25;
  } else if (weatherCondition === 'heavy_rain') {
    baseSurge += 0.65;
  }

  if (demandHotspot) {
    baseSurge += 0.20;
  }

  // Platform specific algorithmic variation
  switch (platform) {
    case 'grab':
      // Grab tends to have highest dynamic surge elasticity in heavy rain/peak
      return Math.round((baseSurge * 1.08) * 10) / 10;
    case 'gojek':
      // Gojek dynamic surge slightly lower, competitive discounts
      return Math.round((baseSurge * 1.02) * 10) / 10;
    case 'tada':
      // TADA has 0% commission on drivers, smaller surge spikes (capped at reasonable rates)
      return Math.round((Math.min(baseSurge * 0.92, 1.45)) * 10) / 10;
    case 'taxi_cdg':
      // Taxi metered fare: peak hour has regulated 25% surcharge (1.25x) and midnight has 50% surcharge (1.50x), no arbitrary algorithmic dynamic surge!
      if (hourDecimal >= 0.0 && hourDecimal <= 5.99) {
        return 1.50; // Midnight 50%
      }
      if ((hourDecimal >= 6.0 && hourDecimal <= 9.5) || (hourDecimal >= 17.0 && hourDecimal <= 23.9)) {
        return 1.25; // Regulated Peak 25%
      }
      return 1.0;
    default:
      return baseSurge;
  }
}

// Generate all live comparison options for a selected pair of locations
export function generateRideComparisons(
  origin: LocationItem,
  destination: LocationItem,
  customHour?: number,
  weatherCondition: 'clear' | 'cloudy' | 'rain' | 'heavy_rain' = 'clear'
): RideOption[] {
  const distanceKm = calculateDistanceKm(origin, destination);
  const now = new Date();
  const currentHourDecimal = customHour !== undefined ? customHour : now.getHours() + now.getMinutes() / 60;
  const isPeak =
    (currentHourDecimal >= 7.5 && currentHourDecimal <= 9.5) ||
    (currentHourDecimal >= 17.5 && currentHourDecimal <= 20.5);

  const durationMins = estimateDurationMinutes(distanceKm, isPeak, weatherCondition);
  const erpFee = calculateErpFee(origin, destination, currentHourDecimal);
  const specialSurchargeData = calculateSpecialSurcharges(origin, destination, currentHourDecimal);

  const isHotspot =
    origin.category === 'attraction' ||
    origin.category === 'airport' ||
    destination.category === 'attraction';

  // 1. GRAB OPTIONS
  const grabSurge = computePlatformSurgeMultiplier('grab', currentHourDecimal, weatherCondition, isHotspot);
  
  // JustGrab (Base S$3.60 + S$0.55/km + S$0.18/min) * surge + erp + surcharge
  const justGrabBase = 3.60;
  const justGrabDist = distanceKm * 0.58;
  const justGrabTime = durationMins * 0.19;
  const justGrabRaw = (justGrabBase + justGrabDist + justGrabTime) * grabSurge;
  const justGrabSurgeAmount = justGrabRaw - (justGrabBase + justGrabDist + justGrabTime);
  const justGrabTotal = Math.round((justGrabRaw + erpFee + specialSurchargeData.amount) * 10) / 10;
  const justGrabShopback = Math.round(justGrabTotal * 0.035 * 10) / 10; // 3.5% cashback

  // GrabCar Premium
  const grabPremTotal = Math.round((justGrabTotal * 1.55) * 10) / 10;
  const grabPremShopback = Math.round(grabPremTotal * 0.035 * 10) / 10;

  // GrabCar 6-Seater
  const grab6Total = Math.round((justGrabTotal * 1.42) * 10) / 10;
  const grab6Shopback = Math.round(grab6Total * 0.035 * 10) / 10;

  // GrabHitch (Scheduled carpool, up to 40% cheaper)
  const grabHitchTotal = Math.max(9.00, Math.round((justGrabTotal * 0.62) * 10) / 10);
  const grabHitchShopback = Math.round(grabHitchTotal * 0.02 * 10) / 10;

  // 2. GOJEK OPTIONS
  const gojekSurge = computePlatformSurgeMultiplier('gojek', currentHourDecimal, weatherCondition, isHotspot);
  const gojekBase = 3.40;
  const gojekDist = distanceKm * 0.56;
  const gojekTime = durationMins * 0.18;
  const gojekRaw = (gojekBase + gojekDist + gojekTime) * gojekSurge;
  const gojekSurgeAmount = gojekRaw - (gojekBase + gojekDist + gojekTime);
  const gojekTotal = Math.round((gojekRaw + erpFee + specialSurchargeData.amount) * 10) / 10;
  const gojekShopback = Math.round(gojekTotal * 0.04 * 10) / 10; // 4.0% cashback partner

  const gojekXLTotal = Math.round((gojekTotal * 1.38) * 10) / 10;
  const gojekXLShopback = Math.round(gojekXLTotal * 0.04 * 10) / 10;

  // 3. TADA OPTIONS (Zero driver commission = competitive fares)
  const tadaSurge = computePlatformSurgeMultiplier('tada', currentHourDecimal, weatherCondition, isHotspot);
  const tadaBase = 3.20;
  const tadaDist = distanceKm * 0.54;
  const tadaTime = durationMins * 0.17;
  const tadaRaw = (tadaBase + tadaDist + tadaTime) * tadaSurge;
  const tadaSurgeAmount = tadaRaw - (tadaBase + tadaDist + tadaTime);
  const tadaTotal = Math.round((tadaRaw + erpFee + specialSurchargeData.amount) * 10) / 10;
  const tadaShopback = Math.round(tadaTotal * 0.03 * 10) / 10;

  const tadaTaxiTotal = Math.round((tadaTotal * 1.08) * 10) / 10;
  const tadaTaxiShopback = Math.round(tadaTaxiTotal * 0.03 * 10) / 10;

  // 4. TAXI HIRES (ComfortDelGro Zig / Standard Metered & Flat)
  // Flag-down S$4.40, then S$0.26 per 400m up to 10km, S$0.26 per 350m after 10km + waiting time
  const taxiFlagDown = 4.40;
  let taxiDistFee = 0;
  if (distanceKm <= 10) {
    taxiDistFee = (distanceKm / 0.4) * 0.26;
  } else {
    taxiDistFee = (10 / 0.4) * 0.26 + ((distanceKm - 10) / 0.35) * 0.26;
  }
  const taxiTimeFee = (durationMins * 0.3) * 0.26; // standing traffic / waiting
  const taxiSurge = computePlatformSurgeMultiplier('taxi_cdg', currentHourDecimal, weatherCondition, isHotspot);
  const taxiMeteredRaw = (taxiFlagDown + taxiDistFee + taxiTimeFee) * taxiSurge;
  const taxiSurgeAmount = taxiMeteredRaw - (taxiFlagDown + taxiDistFee + taxiTimeFee);
  const cdgMeteredTotal = Math.round((taxiMeteredRaw + erpFee + specialSurchargeData.amount) * 10) / 10;
  const cdgShopback = Math.round(cdgMeteredTotal * 0.02 * 10) / 10;

  // CDG Zig Fixed Fare
  const cdgFlatTotal = Math.round((cdgMeteredTotal * 1.04) * 10) / 10;
  const cdgFlatShopback = Math.round(cdgFlatTotal * 0.025 * 10) / 10;

  const rawOptions: RideOption[] = [
    {
      id: 'grab_justgrab',
      platform: 'grab',
      platformName: 'Grab',
      serviceName: 'JustGrab (Nearest Car/Taxi)',
      tier: 'standard',
      capacity: 4,
      baseFare: justGrabBase,
      distanceFare: Math.round(justGrabDist * 10) / 10,
      timeFare: Math.round(justGrabTime * 10) / 10,
      surgeMultiplier: grabSurge,
      surgeAmount: Math.round(justGrabSurgeAmount * 10) / 10,
      erpFee,
      specialSurcharge: specialSurchargeData.amount,
      specialSurchargeLabel: specialSurchargeData.label,
      estimatedTotal: justGrabTotal,
      originalFare: justGrabTotal,
      shopbackCashback: justGrabShopback,
      finalEffectiveFare: Math.round((justGrabTotal - justGrabShopback) * 10) / 10,
      etaMinutes: 3,
      durationMinutes: durationMins,
      driverCountNearby: 14,
      cancellationFreeMins: 3,
      color: '#00B14F',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'gojek_gocar',
      platform: 'gojek',
      platformName: 'Gojek',
      serviceName: 'GoCar Standard',
      tier: 'standard',
      capacity: 4,
      baseFare: gojekBase,
      distanceFare: Math.round(gojekDist * 10) / 10,
      timeFare: Math.round(gojekTime * 10) / 10,
      surgeMultiplier: gojekSurge,
      surgeAmount: Math.round(gojekSurgeAmount * 10) / 10,
      erpFee,
      specialSurcharge: specialSurchargeData.amount,
      specialSurchargeLabel: specialSurchargeData.label,
      estimatedTotal: gojekTotal,
      originalFare: gojekTotal,
      shopbackCashback: gojekShopback,
      finalEffectiveFare: Math.round((gojekTotal - gojekShopback) * 10) / 10,
      etaMinutes: 4,
      durationMinutes: durationMins,
      driverCountNearby: 9,
      cancellationFreeMins: 4,
      color: '#00AA13',
      badgeBg: 'bg-green-50 text-green-800 border-green-200',
    },
    {
      id: 'tada_anytada',
      platform: 'tada',
      platformName: 'TADA',
      serviceName: 'AnyTADA (Zero Driver Fee)',
      tier: 'standard',
      capacity: 4,
      baseFare: tadaBase,
      distanceFare: Math.round(tadaDist * 10) / 10,
      timeFare: Math.round(tadaTime * 10) / 10,
      surgeMultiplier: tadaSurge,
      surgeAmount: Math.round(tadaSurgeAmount * 10) / 10,
      erpFee,
      specialSurcharge: specialSurchargeData.amount,
      specialSurchargeLabel: specialSurchargeData.label,
      estimatedTotal: tadaTotal,
      originalFare: tadaTotal,
      shopbackCashback: tadaShopback,
      finalEffectiveFare: Math.round((tadaTotal - tadaShopback) * 10) / 10,
      etaMinutes: 5,
      durationMinutes: durationMins,
      driverCountNearby: 7,
      cancellationFreeMins: 5,
      color: '#FA6400',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
    },
    {
      id: 'cdg_metered',
      platform: 'taxi_cdg',
      platformName: 'ComfortDelGro',
      serviceName: 'CDG Standard Taxi (Metered)',
      tier: 'standard',
      capacity: 4,
      baseFare: taxiFlagDown,
      distanceFare: Math.round(taxiDistFee * 10) / 10,
      timeFare: Math.round(taxiTimeFee * 10) / 10,
      surgeMultiplier: taxiSurge,
      surgeAmount: Math.round(taxiSurgeAmount * 10) / 10,
      erpFee,
      specialSurcharge: specialSurchargeData.amount,
      specialSurchargeLabel: specialSurchargeData.label,
      estimatedTotal: cdgMeteredTotal,
      originalFare: cdgMeteredTotal,
      shopbackCashback: cdgShopback,
      finalEffectiveFare: Math.round((cdgMeteredTotal - cdgShopback) * 10) / 10,
      etaMinutes: 2,
      durationMinutes: durationMins,
      driverCountNearby: 18,
      cancellationFreeMins: 2,
      color: '#004B9B',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 'cdg_flat',
      platform: 'taxi_cdg',
      platformName: 'ComfortDelGro',
      serviceName: 'CDG Zig Flat Fare',
      tier: 'standard',
      capacity: 4,
      baseFare: taxiFlagDown + 1.5,
      distanceFare: Math.round(taxiDistFee * 10) / 10,
      timeFare: Math.round(taxiTimeFee * 10) / 10,
      surgeMultiplier: 1.0,
      surgeAmount: 0,
      erpFee,
      specialSurcharge: specialSurchargeData.amount,
      specialSurchargeLabel: specialSurchargeData.label,
      estimatedTotal: cdgFlatTotal,
      originalFare: cdgFlatTotal,
      shopbackCashback: cdgFlatShopback,
      finalEffectiveFare: Math.round((cdgFlatTotal - cdgFlatShopback) * 10) / 10,
      etaMinutes: 3,
      durationMinutes: durationMins,
      driverCountNearby: 18,
      cancellationFreeMins: 3,
      color: '#004B9B',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 'grab_6seater',
      platform: 'grab',
      platformName: 'Grab',
      serviceName: 'GrabCar 6-Seater',
      tier: 'large',
      capacity: 6,
      baseFare: 5.50,
      distanceFare: Math.round(justGrabDist * 1.35 * 10) / 10,
      timeFare: Math.round(justGrabTime * 1.3 * 10) / 10,
      surgeMultiplier: grabSurge,
      surgeAmount: Math.round((grab6Total - (5.50 + justGrabDist * 1.35 + justGrabTime * 1.3)) * 10) / 10,
      erpFee,
      specialSurcharge: specialSurchargeData.amount,
      specialSurchargeLabel: specialSurchargeData.label,
      estimatedTotal: grab6Total,
      originalFare: grab6Total,
      shopbackCashback: grab6Shopback,
      finalEffectiveFare: Math.round((grab6Total - grab6Shopback) * 10) / 10,
      etaMinutes: 6,
      durationMinutes: durationMins,
      driverCountNearby: 5,
      cancellationFreeMins: 3,
      color: '#00B14F',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'gojek_xl',
      platform: 'gojek',
      platformName: 'Gojek',
      serviceName: 'GoCar XL (6-Seater)',
      tier: 'large',
      capacity: 6,
      baseFare: 5.20,
      distanceFare: Math.round(gojekDist * 1.3 * 10) / 10,
      timeFare: Math.round(gojekTime * 1.25 * 10) / 10,
      surgeMultiplier: gojekSurge,
      surgeAmount: Math.round((gojekXLTotal - (5.20 + gojekDist * 1.3 + gojekTime * 1.25)) * 10) / 10,
      erpFee,
      specialSurcharge: specialSurchargeData.amount,
      specialSurchargeLabel: specialSurchargeData.label,
      estimatedTotal: gojekXLTotal,
      originalFare: gojekXLTotal,
      shopbackCashback: gojekXLShopback,
      finalEffectiveFare: Math.round((gojekXLTotal - gojekXLShopback) * 10) / 10,
      etaMinutes: 7,
      durationMinutes: durationMins,
      driverCountNearby: 4,
      cancellationFreeMins: 4,
      color: '#00AA13',
      badgeBg: 'bg-green-50 text-green-800 border-green-200',
    },
    {
      id: 'grab_premium',
      platform: 'grab',
      platformName: 'Grab',
      serviceName: 'GrabCar Premium (Mercedes/Lexus)',
      tier: 'premium',
      capacity: 4,
      baseFare: 7.00,
      distanceFare: Math.round(justGrabDist * 1.5 * 10) / 10,
      timeFare: Math.round(justGrabTime * 1.4 * 10) / 10,
      surgeMultiplier: grabSurge,
      surgeAmount: Math.round((grabPremTotal - (7.00 + justGrabDist * 1.5 + justGrabTime * 1.4)) * 10) / 10,
      erpFee,
      specialSurcharge: specialSurchargeData.amount,
      specialSurchargeLabel: specialSurchargeData.label,
      estimatedTotal: grabPremTotal,
      originalFare: grabPremTotal,
      shopbackCashback: grabPremShopback,
      finalEffectiveFare: Math.round((grabPremTotal - grabPremShopback) * 10) / 10,
      etaMinutes: 5,
      durationMinutes: durationMins,
      driverCountNearby: 6,
      cancellationFreeMins: 5,
      color: '#00B14F',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 'grab_hitch',
      platform: 'grab',
      platformName: 'Grab',
      serviceName: 'GrabHitch (Social Carpool)',
      tier: 'economy',
      capacity: 2,
      baseFare: 4.00,
      distanceFare: Math.round(justGrabDist * 0.45 * 10) / 10,
      timeFare: 0,
      surgeMultiplier: 1.0,
      surgeAmount: 0,
      erpFee: 0, // Hitch drivers absorb ERP
      specialSurcharge: 0,
      estimatedTotal: grabHitchTotal,
      originalFare: grabHitchTotal,
      shopbackCashback: grabHitchShopback,
      finalEffectiveFare: Math.round((grabHitchTotal - grabHitchShopback) * 10) / 10,
      etaMinutes: 15,
      durationMinutes: durationMins + 8,
      driverCountNearby: 3,
      cancellationFreeMins: 15,
      color: '#00B14F',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  // Assign smart highlight badges:
  // Find cheapest standard ride
  const standardRides = rawOptions.filter((r) => r.tier === 'standard');
  const cheapestStandard = [...standardRides].sort((a, b) => a.finalEffectiveFare - b.finalEffectiveFare)[0];
  const fastestStandard = [...standardRides].sort((a, b) => a.etaMinutes - b.etaMinutes)[0];

  return rawOptions.map((opt) => {
    if (opt.id === cheapestStandard?.id) {
      return { ...opt, highlightTag: 'cheapest' };
    }
    if (opt.id === fastestStandard?.id && opt.id !== cheapestStandard?.id) {
      return { ...opt, highlightTag: 'fastest' };
    }
    if (opt.platform === 'tada' && !opt.highlightTag) {
      return { ...opt, highlightTag: 'best_value' };
    }
    return opt;
  });
}

// Generate 24-hour predictive curve for the route
export function generate24HourPredictions(
  origin: LocationItem,
  destination: LocationItem,
  weatherForecast: 'clear' | 'rain' = 'clear'
): FarePredictionHour[] {
  const distanceKm = calculateDistanceKm(origin, destination);
  const hours: FarePredictionHour[] = [];

  const timeSlots = [
    { hour: '00:00', val: 0.0, traffic: 'Low' as const },
    { hour: '02:00', val: 2.0, traffic: 'Low' as const },
    { hour: '05:00', val: 5.0, traffic: 'Low' as const },
    { hour: '07:00', val: 7.0, traffic: 'Moderate' as const },
    { hour: '08:00', val: 8.0, traffic: 'Gridlock' as const },
    { hour: '09:00', val: 9.0, traffic: 'Heavy' as const },
    { hour: '11:00', val: 11.0, traffic: 'Moderate' as const },
    { hour: '12:30', val: 12.5, traffic: 'Moderate' as const },
    { hour: '14:30', val: 14.5, traffic: 'Low' as const },
    { hour: '16:30', val: 16.5, traffic: 'Moderate' as const },
    { hour: '18:00', val: 18.0, traffic: 'Gridlock' as const },
    { hour: '19:00', val: 19.0, traffic: 'Heavy' as const },
    { hour: '20:30', val: 20.5, traffic: 'Moderate' as const },
    { hour: '22:00', val: 22.0, traffic: 'Low' as const },
    { hour: '23:30', val: 23.5, traffic: 'Moderate' as const },
  ];

  timeSlots.forEach((slot) => {
    const surge = computePlatformSurgeMultiplier('grab', slot.val, weatherForecast === 'rain' ? 'rain' : 'clear', false);
    const erp = calculateErpFee(origin, destination, slot.val);

    const baseFare = 3.60 + distanceKm * 0.58 + 15 * 0.19;
    const grabFare = Math.round((baseFare * surge + erp) * 10) / 10;
    const gojekFare = Math.round((baseFare * Math.min(surge, 1.4) * 0.96 + erp) * 10) / 10;
    const tadaFare = Math.round((baseFare * Math.min(surge * 0.9, 1.35) * 0.93 + erp) * 10) / 10;
    
    // Taxi regulated surge
    let taxiMultiplier = 1.0;
    if (slot.val >= 0 && slot.val <= 5.5) taxiMultiplier = 1.5;
    else if ((slot.val >= 6 && slot.val <= 9.5) || (slot.val >= 17 && slot.val <= 23.5)) taxiMultiplier = 1.25;
    const taxiFare = Math.round(((4.40 + distanceKm * 0.7) * taxiMultiplier + erp) * 10) / 10;

    let action: 'Book' | 'Wait' | 'Peak' = 'Book';
    if (surge >= 1.4) action = 'Peak';
    else if (surge >= 1.25) action = 'Wait';

    hours.push({
      hour: slot.hour,
      timestamp: slot.val,
      grabFare,
      gojekFare,
      tadaFare,
      taxiFare,
      predictedSurge: surge,
      trafficLevel: slot.traffic,
      recommendedAction: action,
    });
  });

  return hours;
}

// Active Promo Codes in Singapore
export const ACTIVE_PROMOS: PromoCode[] = [
  {
    id: 'p_tada1',
    code: 'TADAVALUE',
    platform: 'tada',
    discountDesc: 'S$3.00 OFF first 2 rides',
    minSpend: 12,
    expires: '31 Oct 2026',
    verifiedToday: true,
  },
  {
    id: 'p_grab1',
    code: 'GRABCOMMUTE',
    platform: 'grab',
    discountDesc: '15% OFF capped at S$4.00 (GrabPay / PayLah!)',
    minSpend: 15,
    expires: 'Ongoing',
    verifiedToday: true,
  },
  {
    id: 'p_gojek1',
    code: 'GOSMART26',
    platform: 'gojek',
    discountDesc: 'S$2.50 OFF DBS/POSB Cards',
    minSpend: 10,
    expires: '28 Oct 2026',
    verifiedToday: true,
  },
  {
    id: 'p_cdg1',
    code: 'ZIGSAVE5',
    platform: 'taxi_cdg',
    discountDesc: 'S$5.00 OFF off-peak taxi booking',
    minSpend: 18,
    expires: '15 Nov 2026',
    verifiedToday: true,
  },
];

// Initial default ride history
export const DEFAULT_RIDE_HISTORY = [
  {
    id: 'hist_1',
    timestamp: 'Yesterday, 6:45 PM',
    fromName: 'Sentosa Beach Station',
    toName: 'ION Orchard',
    platform: 'tada' as PlatformId,
    serviceName: 'AnyTADA',
    paidFare: 18.40,
    savedAmount: 6.80, // Saved vs Grab surge of S$25.20
    shopbackEarned: 0.65,
    date: '2026-10-14',
  },
  {
    id: 'hist_2',
    timestamp: '12 Oct 2026, 8:20 AM',
    fromName: 'Tampines 1',
    toName: 'Raffles Place (CBD)',
    platform: 'taxi_cdg' as PlatformId,
    serviceName: 'CDG Standard Taxi',
    paidFare: 22.80,
    savedAmount: 8.40, // Avoided 1.7x Grab surge
    shopbackEarned: 0.50,
    date: '2026-10-12',
  },
  {
    id: 'hist_3',
    timestamp: '10 Oct 2026, 11:15 PM',
    fromName: 'Clarke Quay',
    toName: 'Ang Mo Kio Hub',
    platform: 'gojek' as PlatformId,
    serviceName: 'GoCar Standard',
    paidFare: 21.30,
    savedAmount: 4.20,
    shopbackEarned: 0.85,
    date: '2026-10-10',
  },
];
