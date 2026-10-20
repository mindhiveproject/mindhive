import ReactHtmlParser from "react-html-parser";

// Tags that can run script, load active content, or hijack the page layout/forms.
const BLOCKED_TAGS = new Set([
  "script",
  "style",
  "link",
  "meta",
  "base",
  "object",
  "embed",
  "applet",
  "frame",
  "frameset",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "noscript",
  "template",
  "svg",
  "math",
]);

const URL_ATTRS = new Set([
  "href",
  "src",
  "action",
  "formaction",
  "xlink:href",
  "poster",
  "background",
  "srcset",
]);

// Iframes are only kept for well-known video embeds.
const IFRAME_HOSTS = [
  /(^|\.)youtube\.com$/,
  /(^|\.)youtube-nocookie\.com$/,
  /(^|\.)vimeo\.com$/,
  /(^|\.)loom\.com$/,
];

const SAFE_DATA_IMAGE = /^data:image\/(png|gif|jpe?g|webp|avif);/i;

function isSafeUrl(value, attr) {
  // Strip whitespace/control chars browsers ignore when resolving the scheme.
  const normalized = String(value || "")
    .replace(/[\u0000- \u007f-\u009f]/g, "")
    .toLowerCase();
  if (!/^[a-z][a-z0-9+.-]*:/.test(normalized)) return true; // relative URL or anchor
  if (/^(https?|mailto|tel):/.test(normalized)) return true;
  if (attr === "src" && SAFE_DATA_IMAGE.test(normalized)) return true;
  // Any other scheme (javascript:, vbscript:, data:text/html, …) is dropped.
  return false;
}

function isAllowedIframe(src) {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      IFRAME_HOSTS.some((re) => re.test(url.hostname))
    );
  } catch {
    return false;
  }
}

function sanitizeNode(node) {
  if (node.type === "script" || node.type === "style") return null;
  if (node.type !== "tag") return undefined;

  const name = (node.name || "").toLowerCase();
  if (BLOCKED_TAGS.has(name)) return null;
  if (name === "iframe" && !isAllowedIframe(node.attribs?.src)) return null;

  const attribs = node.attribs || {};
  Object.keys(attribs).forEach((key) => {
    const attr = key.toLowerCase();
    if (attr.startsWith("on") || attr === "srcdoc" || attr === "formaction") {
      delete attribs[key];
      return;
    }
    if (URL_ATTRS.has(attr) && !isSafeUrl(attribs[key], attr)) {
      delete attribs[key];
      return;
    }
    if (attr === "style" && /expression\s*\(|url\s*\(\s*['"]?\s*javascript:/i.test(attribs[key])) {
      delete attribs[key];
    }
  });

  if (name === "a" && attribs.target === "_blank") {
    attribs.rel = "noopener noreferrer";
  }

  // undefined -> let react-html-parser convert the (now cleaned) node; the
  // transform is re-applied to every child.
  return undefined;
}

/**
 * Parse user-authored rich text (TipTap/Jodit HTML) into React elements,
 * dropping scripts, active content, event handlers and unsafe URLs.
 */
export function parseSafeHtml(html) {
  if (!html || typeof html !== "string") return null;
  return ReactHtmlParser(html, { transform: sanitizeNode });
}

export default parseSafeHtml;
