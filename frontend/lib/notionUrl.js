/**
 * Parse a pasted Notion link into the page it points at.
 *
 * Keep in step with the backend's lib/notionUrl.ts, which checks the same
 * links when a ticket is saved. Parsed here as well so a wrong paste is flagged
 * while the person is still looking at it.
 *
 * Notion hands out several shapes of link (the backend file lists them). The
 * one that catches people out is a row opened in peek view and copied from the
 * address bar: its path is the DATABASE, and the row is the `p` parameter.
 */

const NOTION_HOST = /(^|\.)notion\.(so|site|com)$/i;
const TRAILING_ID = /-?(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

function hex32(value) {
  const match = (value || "").replace(/-/g, "").match(/([0-9a-f]{32})$/i);
  return match ? match[1].toLowerCase() : null;
}

function dashed(hex) {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * @param {string} url
 * @returns {{ pageId: string, label: string|null } | null}
 *   `label` is the title as the link's slug spells it ("Cant log in"), when
 *   the link has one — a stand-in until the real title has loaded. null when
 *   the text is not a link to a Notion page.
 */
export function parseNotionPageUrl(url) {
  if (!url || typeof url !== "string") return null;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !NOTION_HOST.test(parsed.hostname)) return null;

  const peek = hex32(parsed.searchParams.get("p"));
  if (peek) return { pageId: dashed(peek), label: null };

  const last = parsed.pathname.split("/").filter(Boolean).pop() || "";
  const id = hex32(last);
  if (!id) return null;

  let slug = last.replace(TRAILING_ID, "");
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // A malformed escape is not worth failing the whole link over.
  }
  const label = slug.replace(/-/g, " ").trim() || null;
  return { pageId: dashed(id), label };
}

/** Whether two links point at the same Notion page. */
export function sameNotionPage(a, b) {
  const pa = parseNotionPageUrl(a);
  const pb = parseNotionPageUrl(b);
  return !!pa && !!pb && pa.pageId === pb.pageId;
}
