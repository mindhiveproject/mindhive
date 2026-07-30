import path from "path";

// Allowed: alphanumeric, hyphens, underscores, dots (no leading dot).
// Length cap is 254 (filesystem filename limit), not the old server.js cap of
// 64: template slugs come from slugify(title) with no length limit, so legacy
// slugs longer than 64 chars must still validate for reads.
const SAFE_SEGMENT_RE = /^[a-zA-Z0-9][a-zA-Z0-9_\-.]{0,253}$/;

export function validatePathSegment(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !SAFE_SEGMENT_RE.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
}

export function assertWithinBase(resolvedPath: string, basePath: string): void {
  if (!resolvedPath.startsWith(basePath + path.sep) && resolvedPath !== basePath) {
    throw new Error("Path traversal detected");
  }
}
