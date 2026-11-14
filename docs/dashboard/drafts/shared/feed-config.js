/* Deploy-time settings for the live dashboard. The only file to edit when the feed URL changes. */
window.FEED_CONFIG = {
  url: 'https://fnbnhvgrnkrbsrwhgcgc.supabase.co/functions/v1/healthapp-dashboard-feed',   // live feed (MIN-4456). Dev files: ?feed=../dev/fresh.json (same origin only)
  keyHeader: 'x-dashboard-key',  // the view key (#k=) and the gateway key (#a=) are stored from the address bar once and sent only to the origin of `url`; neither is ever written in a file
  pollMs: 60000,
  timeoutMs: 15000
};
