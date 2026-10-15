import type { IncomingMessage, ServerResponse } from 'http';

interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  integrations: {
    ltaDataMall: {
      accountKeyConfigured: boolean;
      status: string;
      endpoint: string;
    };
    oneMap: {
      apiKeyConfigured: boolean;
      status: string;
      endpoint: string;
    };
  };
}

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string>; method?: string },
  res: ServerResponse & {
    status?: (code: number) => any;
    json?: (body: any) => any;
    setHeader?: (name: string, value: string) => any;
  }
) {
  // Support CORS
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
  }

  if (req.method === 'OPTIONS') {
    if (res.status) res.status(204).end();
    else {
      res.statusCode = 204;
      res.end();
    }
    return;
  }

  const apiKey = process.env.LTA_DATAMALL_API_KEY || process.env.LTA_API_KEY;
  const isLtaConfigured = Boolean(apiKey && apiKey !== 'YOUR_LTA_DATAMALL_API_KEY');

  const onemapApiKey = process.env.ONEMAP_API_KEY || process.env.ONEMAP_TOKEN;
  const isOneMapConfigured = Boolean(onemapApiKey && onemapApiKey !== 'YOUR_ONEMAP_API_KEY');

  const payload: HealthResponse = {
    status: 'ok',
    service: 'Fare Wise - Singapore Mobility Serverless Gateway (LTA & OneMap)',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: process.env.NODE_ENV || 'production',
    integrations: {
      ltaDataMall: {
        accountKeyConfigured: isLtaConfigured,
        status: isLtaConfigured ? 'ready' : 'key_missing_will_use_fallback',
        endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/Taxi-Availability',
      },
      oneMap: {
        apiKeyConfigured: isOneMapConfigured,
        status: isOneMapConfigured ? 'ready' : 'public_search_active_routing_ready',
        endpoint: 'https://www.onemap.gov.sg/api',
      },
    },
  };

  if (res.status && res.json) {
    return res.status(200).json(payload);
  }

  res.statusCode = 200;
  res.end(JSON.stringify(payload, null, 2));
}
