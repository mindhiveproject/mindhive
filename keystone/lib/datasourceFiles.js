// The data files a Data Journal dataset (Datasource) points at. A dataset's
// `content` records each file as an address { year, month, day, token }
// (content.uploaded.address, content.modified.address). Only tokens found at
// such an address count: the read and write checks for files
// (mutations/dataFileAccess.ts) and the check on new addresses
// (schemas/Datasource.ts) all use this one reader.

/** `content` as an object: stored as text on SQLite, JSON on Postgres. */
function parseContent(content) {
  if (typeof content !== "string") return content ?? null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/** Every file token at an `address.token` anywhere in `content`. */
function contentFileTokens(content) {
  const tokens = new Set();
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    const token = value.address?.token;
    if (typeof token === "string" && token) tokens.add(token);
    Object.values(value).forEach(walk);
  };
  walk(parseContent(content));
  return tokens;
}

/** Tokens in `next` that `previous` did not already point at. */
function newFileTokens(previous, next) {
  const before = contentFileTokens(previous);
  return [...contentFileTokens(next)].filter((t) => !before.has(t));
}

module.exports = { parseContent, contentFileTokens, newFileTokens };
