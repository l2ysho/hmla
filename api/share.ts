import { canonSeed } from "../src/engine/seed";

export const config = { runtime: "edge" };

// Escapes the seed for safe interpolation into HTML attributes/text. The seed
// is already canonicalised to `hmla-<digits>` (see canonSeed), but escaping is
// kept as defence-in-depth for the interpolation.
const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export default function handler(req: Request) {
  const url = new URL(req.url);
  const seed = canonSeed(url.searchParams.get("s") || "hmla-0000");
  const e = url.searchParams.get("e");

  const ogImage = new URL("/api/og", url.origin);
  ogImage.searchParams.set("s", seed);

  const pageUrl = new URL("/", url.origin);
  pageUrl.searchParams.set("s", seed);
  if (e) pageUrl.searchParams.set("e", e);

  const title = `hmla — ${escapeHtml(seed)}`;
  const description = `Listen to ${escapeHtml(seed)} — a unique generative ambient patch on hmla. Browser-based, no downloads needed.`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage.toString()}" />
    <meta property="og:url" content="${pageUrl.toString()}" />
    <link rel="canonical" href="${pageUrl.toString()}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage.toString()}" />
  </head>
  <body></body>
</html>
`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
