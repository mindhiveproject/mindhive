/**
 * Parse a pasted Figma URL into the parts tooling needs.
 *
 * Tickets store the URL a human pasted, not its pieces — the URL is what someone
 * can click, and storing both would be two copies of one fact, free to drift.
 * This derives the pieces wherever they are actually needed: `get_design_context`
 * and the MCP tools take a file key and a node id, never a URL.
 *
 * Figma writes node ids two ways. In a URL they are hyphenated (`1878-410`);
 * every API takes them colon-separated (`1878:410`). Normalising here is the
 * single most common reason a hand-built call comes back "node not found".
 */

const FIGMA_URL = /^https:\/\/(?:www\.)?figma\.com\/(design|file|board|proto|make)\/([0-9a-zA-Z]{22,128})(?:\/([^?#]*))?/;

/**
 * @param {string} url
 * @returns {{kind: string, fileKey: string, name: string|null, nodeId: string|null}|null}
 *   null when the URL is absent or not a Figma link.
 */
export function parseFigmaUrl(url) {
  if (!url || typeof url !== "string") return null;

  const match = url.trim().match(FIGMA_URL);
  if (!match) return null;

  const [, kind, fileKey, rawName] = match;

  let nodeId = null;
  try {
    const raw = new URL(url).searchParams.get("node-id");
    // `1878-410` in a URL is `1878:410` everywhere else.
    if (raw) nodeId = raw.replace(/-/g, ":");
  } catch {
    // A URL that passed the regex but fails the parser is not worth throwing
    // over — the file key is still useful on its own.
  }

  return {
    kind,
    fileKey,
    name: rawName ? decodeURIComponent(rawName).replace(/-/g, " ") : null,
    nodeId,
  };
}

/** Short human label for a parsed link, e.g. "Design System · node 1878:410". */
export function describeFigmaUrl(url) {
  const parsed = parseFigmaUrl(url);
  if (!parsed) return null;
  const parts = [parsed.name || parsed.fileKey];
  if (parsed.nodeId) parts.push(`node ${parsed.nodeId}`);
  return parts.join(" · ");
}
