import { next, rewrite } from "@vercel/edge";

export const config = { matcher: "/" };

// Link-preview crawlers don't run JS, so the SPA's client-set <meta> tags are
// invisible to them — they'd read the static index.html and get the generic
// card. Route them to /api/share, which renders per-seed OG meta for the
// requested ?s=<seed>.
//
// This must be Edge Middleware, not a vercel.json rewrite: vercel.json
// `rewrites` are evaluated *after* the filesystem, and "/" is already served by
// the static index.html, so a rewrite for "/" never fires. Middleware runs
// before static file serving.
const CRAWLER =
  /bot|crawler|spider|facebookexternalhit|Bluesky Cardyb|Twitterbot|Slackbot|Discordbot|TelegramBot|WhatsApp|LinkedInBot|Mastodon|Pinterest|Embedly|Iframely|redditbot/i;

export default function middleware(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!CRAWLER.test(ua)) return next();
  const url = new URL(request.url);
  return rewrite(new URL(`/api/share${url.search}`, url));
}
