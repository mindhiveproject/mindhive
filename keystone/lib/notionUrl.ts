/**
 * The Notion page a pasted link points at.
 *
 * Keep in step with the frontend's lib/notionUrl.js, which parses the same
 * links in the browser so a wrong paste is flagged before anything is saved.
 *
 * Notion hands out links in several shapes, and all of them get pasted:
 *   https://www.notion.so/mindhive/Cant-log-in-153d80abf4c48093b13cc8d50807c7b8
 *   https://www.notion.so/153d80abf4c48093b13cc8d50807c7b8?pvs=4
 *   https://app.notion.com/p/mindhive/Cant-log-in-153d80abf4c48093b13cc8d50807c7b8
 *   https://mindhive.notion.site/153d80abf4c48093b13cc8d50807c7b8
 *   https://www.notion.so/mindhive/<database id>?v=<view>&p=<page id>&pm=s
 * The last is a row opened in peek view, copied from the address bar: its path
 * is the DATABASE, and the row is the `p` parameter. Any of them may carry a
 * dashed uuid instead of 32 bare hex characters.
 */

const NOTION_HOST = /(^|\.)notion\.(so|site|com)$/i;

/** The last 32 hex characters of a slug or id, ignoring dashes. */
function hex32(value: string | null | undefined): string | null {
  const match = (value ?? "").replace(/-/g, "").match(/([0-9a-f]{32})$/i);
  return match ? match[1].toLowerCase() : null;
}

/** 32 hex characters as the dashed uuid the Notion API returns. */
function dashed(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** The page id (dashed, lowercase) a Notion link points at, or null. */
export function notionPageIdFromUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || !NOTION_HOST.test(parsed.hostname)) return null;
  const peek = hex32(parsed.searchParams.get("p"));
  if (peek) return dashed(peek);
  const last = parsed.pathname.split("/").filter(Boolean).pop();
  const id = hex32(last);
  return id ? dashed(id) : null;
}

/** Same id either way round — Notion mixes dashed and bare forms. */
export function sameNotionId(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.replace(/-/g, "").toLowerCase() === b.replace(/-/g, "").toLowerCase();
}

/**
 * Check a ticket's support-ticket links as they arrive. Throws on anything but
 * a list of distinct Notion page links; null and [] both mean "none".
 */
export function assertSupportTicketLinks(value: unknown): void {
  if (value === null || value === undefined) return;
  if (!Array.isArray(value)) {
    throw new Error("supportTickets must be a list of Notion links.");
  }
  const seen = new Set<string>();
  for (const entry of value) {
    const id = notionPageIdFromUrl(entry);
    if (!id) {
      throw new Error(
        `supportTickets: "${String(entry).slice(0, 80)}" is not a link to a Notion page. ` +
          "Open the support ticket in Notion and copy its link."
      );
    }
    if (seen.has(id)) {
      throw new Error("supportTickets: the same support ticket is linked twice.");
    }
    seen.add(id);
  }
}
