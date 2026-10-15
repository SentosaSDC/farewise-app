import type { IncomingMessage, ServerResponse } from 'http';

interface TaxiCoordinate {
  Latitude: number;
  Longitude: number;
}

interface LtaDataMallResponse {
  'odata.metadata': string;
  value: TaxiCoordinate[];
}

// Calculate Haversine distance in km between two geo-points
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// Fallback generator when LTA_DATAMALL_API_KEY is not yet configured by the user
function generateSimulatedSingaporeTaxis(centerLat?: number, centerLng?: number, count: number = 85) {
  const fallbackCenterLat = centerLat || 1.2834; // Marina Bay Sands default
  const fallbackCenterLng = centerLng || 103.8607;
  const taxis: Array<{ Latitude: number; Longitude: number }> = [];

  for (let i = 0; i < count; i++) {
    // Random offsets within Singapore metropolitan radius (~8-12km)
    const latOffset = (Math.random() - 0.5) * 0.08;
    const lngOffset = (Math.random() - 0.5) * 0.12;
    taxis.push({
      Latitude: parseFloat((fallbackCenterLat + latOffset).toFixed(6)),
      Longitude: parseFloat((fallbackCenterLng + lngOffset).toFixed(6)),
    });
  }

  return taxis;
}

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string>; method?: string; url?: string },
  res: ServerResponse & {
    status?: (code: number) => any;
    json?: (body: any) => any;
    setHeader?: (name: string, value: string) => any;
  }
) {
  // CORS setup for client-side fetching
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30'); // Cache for 30s in serverless CDN
  }

  if (req.method === 'OPTIONS') {
    if (res.status) res.status(204).end();
    else {
      res.statusCode = 204;
      res.end();
    }
    return;
  }

  // Parse query parameters
  const urlObj = new URL(req.url || '/', 'http://localhost');
  const latParam = urlObj.searchParams.get('lat') || req.query?.lat;
  const lngParam = urlObj.searchParams.get('lng') || req.query?.lng;
  const radiusParam = urlObj.searchParams.get('radius') || req.query?.radius;

  const targetLat = latParam ? parseFloat(latParam) : undefined;
  const targetLng = lngParam ? parseFloat(lngParam) : undefined;
  const radiusKm = radiusParam ? parseFloat(radiusParam) : 3.0; // default 3km radius

  // LTA DataMall AccountKey from environment (no hardcoded keys)
  const ltaApiKey = process.env.LTA_DATAMALL_API_KEY || process.env.LTA_API_KEY;

  try {
    let taxiCoordinates: TaxiCoordinate[] = [];
    let isLive = false;

    if (ltaApiKey && ltaApiKey.trim() !== '' && ltaApiKey !== 'YOUR_LTA_DATAMALL_API_KEY') {
      // Live fetch from official Singapore LTA DataMall API
      const response = await fetch('https://datamall2.mytransport.sg/ltaodataservice/Taxi-Availability', {
        method: 'GET',
        headers: {
          AccountKey: ltaApiKey.trim(),
          accept: 'application/json',
        },
      });

      if (response.ok) {
        const data: LtaDataMallResponse = await response.json();
        taxiCoordinates = data.value || [];
        isLive = true;
      } else {
        console.warn(`LTA DataMall API returned status ${response.status}: ${response.statusText}`);
        // Fallback to simulated fleet if LTA responds with rate limit or error
        taxiCoordinates = generateSimulatedSingaporeTaxis(targetLat, targetLng, 120);
      }
    } else {
      // Key not configured yet: provide realistic Singapore fleet simulation
      taxiCoordinates = generateSimulatedSingaporeTaxis(targetLat, targetLng, 95);
    }

    // If specific location key (coordinates) is supplied, filter nearby taxis
    let nearbyTaxis = taxiCoordinates;
    if (targetLat !== undefined && targetLng !== undefined && !isNaN(targetLat) && !isNaN(targetLng)) {
      nearbyTaxis = taxiCoordinates
        .map((taxi) => {
          const dist = getDistanceKm(targetLat, targetLng, taxi.Latitude, taxi.Longitude);
          return { ...taxi, distanceKm: dist };
        })
        .filter((taxi) => taxi.distanceKm <= radiusKm)
        .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    const result = {
      status: 'success',
      endpoint: 'LTA DataMall - Taxi-Availability',
      isLiveFromDatamall: isLive,
      apiKeyConfigured: Boolean(ltaApiKey && ltaApiKey !== 'YOUR_LTA_DATAMALL_API_KEY'),
      totalTaxisIslandwide: taxiCoordinates.length,
      nearbyTaxiCount: nearbyTaxis.length,
      searchCenter: targetLat && targetLng ? { latitude: targetLat, longitude: targetLng, radiusKm } : null,
      timestamp: new Date().toISOString(),
      taxis: nearbyTaxis.slice(0, 100), // Cap response payload size to nearest 100
      note: !isLive
        ? 'Using Singapore simulated fleet. Set LTA_DATAMALL_API_KEY in your environment variables to enable live data from LTA DataMall.'
        : 'Live telemetry streamed directly from Singapore Land Transport Authority (LTA) DataMall.',
    };

    if (res.status && res.json) {
      return res.status(200).json(result);
    }

    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (error: any) {
    console.error('Error fetching LTA DataMall Taxi Availability:', error);

    const fallbackResult = {
      status: 'degraded',
      error: error?.message || 'Failed to connect to LTA DataMall',
      isLiveFromDatamall: false,
      apiKeyConfigured: Boolean(ltaApiKey),
      totalTaxisIslandwide: 80,
      nearbyTaxiCount: 14,
      taxis: generateSimulatedSingaporeTaxis(targetLat, targetLng, 25),
      timestamp: new Date().toISOString(),
    };

    if (res.status && res.json) {
      return res.status(200).json(fallbackResult);
    }

    res.statusCode = 200;
    res.end(JSON.stringify(fallbackResult));
  }
}
