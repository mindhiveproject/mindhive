// Post-login return path carried as `/login?next=…`. Only same-origin paths
// are honoured — anything else (absolute URLs, protocol-relative `//host`,
// backslash tricks) would turn the login page into an open redirect.
export function safeNextPath(next) {
  if (typeof next !== "string" || !next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//") || next.startsWith("/\\")) return null;
  // Sending someone back to the login page after logging in loops.
  if (next === "/login" || next.startsWith("/login?") || next.startsWith("/login/")) {
    return null;
  }
  return next;
}

export function loginHrefWithNext(asPath) {
  const next = safeNextPath(asPath);
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}
