export const config = { runtime: "edge" };

// Escapes the seed for safe interpolation into HTML attributes/text. Seeds
// are user-editable (max 9 chars, see Input maxLength in App.tsx) so this
// must not be skipped even though the charset is small in practice.
const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export default function handler(req: Request) {
  const url = new URL(req.url);
  const seed = (url.searchParams.get("s") || "hmla").slice(0, 9);
  const e = url.searchParams.get("e");

  const ogImage = new URL("/api/og", url.origin);
  ogImage.searchParams.set("s", seed);

  const pageUrl = new URL("/", url.origin);
  pageUrl.searchParams.set("s", seed);
  if (e) pageUrl.searchParams.set("e", e);

  const title = `hmla — ${escapeHtml(seed)}`;
  const description = "generative ambient — seeded, ever-evolving. open this patch in hmla.";

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
