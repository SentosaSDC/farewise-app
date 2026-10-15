import handler from './onemap';

export default async function onemapSearchHandler(req: any, res: any) {
  if (req.url && !req.url.includes('action=')) {
    req.url = req.url.includes('?') ? `${req.url}&action=search` : `${req.url}?action=search`;
  }
  return handler(req, res);
}
