// CORS allow-list: the Pages production origin, its preview subdomains, localhost.
const PROD = "https://healthapp-8ui.pages.dev";
const PREVIEW = /^https:\/\/[a-z0-9-]+\.healthapp-8ui\.pages\.dev$/;
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  return origin === PROD || PREVIEW.test(origin) || LOCAL.test(origin) ? origin : null;
}

export function corsHeaders(req: Request): Record<string, string> {
  const h: Record<string, string> = { "Vary": "Origin" };
  const o = allowedOrigin(req.headers.get("origin"));
  if (o) {
    h["Access-Control-Allow-Origin"] = o;
    h["Access-Control-Allow-Headers"] =
      "authorization, apikey, content-type, x-client-info, x-healthapp-env";
    h["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    h["Access-Control-Max-Age"] = "600";
  }
  return h;
}
