export type PlatformId = 'grab' | 'gojek' | 'tada' | 'taxi_cdg';

export type RideTier = 'standard' | 'economy' | 'large' | 'premium';

export interface LocationItem {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  district: string;
  category: 'transit' | 'airport' | 'attraction' | 'business' | 'residential' | 'shopping';
  lat: number;
  lng: number;
  erpZone?: string;
  specialSurcharge?: {
    name: string;
    amount: number;
  };
}

export interface RideOption {
  id: string;
  platform: PlatformId;
  platformName: string;
  serviceName: string;
  tier: RideTier;
  capacity: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  surgeAmount: number;
  erpFee: number;
  specialSurcharge: number;
  specialSurchargeLabel?: string;
  estimatedTotal: number;
  originalFare: number; // before promo/cashback
  shopbackCashback: number;
  finalEffectiveFare: number;
  etaMinutes: number;
  durationMinutes: number;
  driverCountNearby: number;
  cancellationFreeMins: number;
  highlightTag?: 'cheapest' | 'fastest' | 'best_value' | 'recommended';
  color: string;
  badgeBg: string;
}

export interface FarePredictionHour {
  hour: string; // e.g. "08:00"
  timestamp: number;
  grabFare: number;
  gojekFare: number;
  tadaFare: number;
  taxiFare: number;
  predictedSurge: number;
  trafficLevel: 'Low' | 'Moderate' | 'Heavy' | 'Gridlock';
  recommendedAction: 'Book' | 'Wait' | 'Peak';
}

export interface RideHistoryEntry {
  id: string;
  timestamp: string;
  fromName: string;
  toName: string;
  platform: PlatformId;
  serviceName: string;
  paidFare: number;
  savedAmount: number;
  shopbackEarned: number;
  date: string;
}

export interface PromoCode {
  id: string;
  code: string;
  platform: PlatformId;
  discountDesc: string;
  minSpend: number;
  expires: string;
  verifiedToday: boolean;
}
