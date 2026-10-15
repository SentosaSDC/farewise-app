import handler from './onemap';

export default async function onemapRouteHandler(req: any, res: any) {
  if (req.url && !req.url.includes('action=')) {
    req.url = req.url.includes('?') ? `${req.url}&action=route` : `${req.url}?action=route`;
  }
  return handler(req, res);
}
