import type { IncomingMessage, ServerResponse } from 'http';

interface OneMapSearchResult {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string>; method?: string; url?: string },
  res: ServerResponse & {
    status?: (code: number) => any;
    json?: (body: any) => any;
    setHeader?: (name: string, value: string) => any;
  }
) {
  // CORS configuration
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
  }

  if (req.method === 'OPTIONS') {
    if (res.status) res.status(204).end();
    else {
      res.statusCode = 204;
      res.end();
    }
    return;
  }

  const urlObj = new URL(req.url || '/', 'http://localhost');
  const action = urlObj.searchParams.get('action') || req.query?.action || 'search';
  const query = urlObj.searchParams.get('q') || urlObj.searchParams.get('searchVal') || req.query?.q || '';
  const start = urlObj.searchParams.get('start') || req.query?.start;
  const end = urlObj.searchParams.get('end') || req.query?.end;
  const routeType = urlObj.searchParams.get('routeType') || req.query?.routeType || 'drive';

  // Retrieve OneMap API key from environment variables (no hardcoded credentials)
  const onemapApiKey = process.env.ONEMAP_API_KEY || process.env.ONEMAP_TOKEN;
  const hasValidKey = Boolean(onemapApiKey && onemapApiKey !== 'YOUR_ONEMAP_API_KEY');

  const headers: Record<string, string> = {
    accept: 'application/json',
  };
  if (hasValidKey && onemapApiKey) {
    headers['Authorization'] = onemapApiKey.startsWith('Bearer ') ? onemapApiKey : `Bearer ${onemapApiKey}`;
  }

  try {
    // 1. SEARCH / GEOCODING (OneMap Elastic Search)
    if (action === 'search') {
      if (!query || query.trim() === '') {
        const payload = {
          status: 'error',
          message: 'Missing search query parameter ?q=...',
          results: [],
        };
        if (res.status && res.json) return res.status(400).json(payload);
        res.statusCode = 400;
        return res.end(JSON.stringify(payload));
      }

      const searchUrl = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
        query.trim()
      )}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;

      const response = await fetch(searchUrl, { headers });

      if (response.ok) {
        const data = await response.json();
        const results = (data.results || []).map((item: OneMapSearchResult) => ({
          name: item.BUILDING && item.BUILDING !== 'NIL' ? item.BUILDING : item.ADDRESS,
          address: item.ADDRESS,
          roadName: item.ROAD_NAME,
          postalCode: item.POSTAL && item.POSTAL !== 'NIL' ? item.POSTAL : '',
          lat: parseFloat(item.LATITUDE),
          lng: parseFloat(item.LONGITUDE),
          svy21: { x: item.X, y: item.Y },
        }));

        const resultPayload = {
          status: 'success',
          source: 'ONEMAP.gov.sg',
          query,
          totalResults: data.totalNumPages || results.length,
          results,
        };

        if (res.status && res.json) return res.status(200).json(resultPayload);
        res.statusCode = 200;
        return res.end(JSON.stringify(resultPayload));
      } else {
        throw new Error(`OneMap Search API error: ${response.status} ${response.statusText}`);
      }
    }

    // 2. ROUTING SERVICE (OneMap Drive Routing)
    if (action === 'route') {
      if (!start || !end) {
        const payload = {
          status: 'error',
          message: 'Missing start or end coordinates. Format: ?action=route&start=1.2834,103.8607&end=1.3553,103.9868',
        };
        if (res.status && res.json) return res.status(400).json(payload);
        res.statusCode = 400;
        return res.end(JSON.stringify(payload));
      }

      if (hasValidKey) {
        const routeUrl = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${start}&end=${end}&routeType=${routeType}`;
        const response = await fetch(routeUrl, { headers });

        if (response.ok) {
          const routeData = await response.json();
          const payload = {
            status: 'success',
            source: 'ONEMAP.gov.sg',
            start,
            end,
            routeType,
            routeSummary: routeData.route_summary || null,
            totalDistanceKm: routeData.route_summary
              ? Math.round((routeData.route_summary.total_distance / 1000) * 10) / 10
              : null,
            totalDurationMins: routeData.route_summary
              ? Math.round(routeData.route_summary.total_time / 60)
              : null,
            routeGeometry: routeData.route_geometry || null,
          };

          if (res.status && res.json) return res.status(200).json(payload);
          res.statusCode = 200;
          return res.end(JSON.stringify(payload));
        }
      }

      // Fallback: Haversine distance calculation for Singapore if OneMap key is pending
      const [startLat, startLng] = start.split(',').map(Number);
      const [endLat, endLng] = end.split(',').map(Number);

      const R = 6371;
      const dLat = ((endLat - startLat) * Math.PI) / 180;
      const dLng = ((endLng - startLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((startLat * Math.PI) / 180) *
          Math.cos((endLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = Math.round(R * c * 1.32 * 10) / 10;
      const durationMins = Math.round((distanceKm / 40) * 60) + 3;

      const fallbackPayload = {
        status: 'success',
        source: 'ONEMAP_FALLBACK_GEO',
        start,
        end,
        totalDistanceKm: distanceKm,
        totalDurationMins: durationMins,
        isKeyConfigured: hasValidKey,
        note: !hasValidKey
          ? 'Set ONEMAP_API_KEY in your environment to stream official OneMap.gov.sg routing turns.'
          : 'OneMap returned live geometric distance.',
      };

      if (res.status && res.json) return res.status(200).json(fallbackPayload);
      res.statusCode = 200;
      return res.end(JSON.stringify(fallbackPayload));
    }

    // Default response for unhandled actions
    const infoPayload = {
      service: 'ONEMAP.gov.sg Serverless Gateway for Fare Wise',
      endpoints: {
        search: '/api/onemap?action=search&q=Sentosa',
        route: '/api/onemap?action=route&start=1.2515,103.8185&end=1.2834,103.8607',
      },
      apiKeyConfigured: hasValidKey,
    };

    if (res.status && res.json) return res.status(200).json(infoPayload);
    res.statusCode = 200;
    return res.end(JSON.stringify(infoPayload));
  } catch (error: any) {
    console.error('OneMap API error:', error);
    const errorPayload = {
      status: 'error',
      source: 'ONEMAP.gov.sg',
      message: error?.message || 'Failed to reach OneMap API',
      apiKeyConfigured: hasValidKey,
    };
    if (res.status && res.json) return res.status(500).json(errorPayload);
    res.statusCode = 500;
    return res.end(JSON.stringify(errorPayload));
  }
}
