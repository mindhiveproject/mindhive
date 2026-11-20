import type { NextApiRequest, NextApiResponse } from "next";

// In-memory fixed-window limiter. Buckets live in this process only, so the
// frontend MUST run as a single instance (pm2 fork mode, instances: 1) — in
// cluster mode each worker gets its own counts and the effective limit
// becomes max × workers.

type Bucket = { count: number; resetAt: number };

function clientKey(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (first) return first.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

// Returns true if the request is allowed. On rejection it writes the 429
// response itself, mirroring express-rate-limit's `message` behavior.
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  // Per-limiter store: each limiter counts independently, like the separate
  // express-rate-limit instances it replaces.
  const buckets = new Map<string, Bucket>();

  return function check(req: NextApiRequest, res: NextApiResponse): boolean {
    const key = clientKey(req);
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil((bucket.resetAt - now) / 1000)));

    if (bucket.count > max) {
      res.status(429).json({ error: "Too many requests, please try again later." });
      return false;
    }

    if (buckets.size > 10000) {
      buckets.forEach((v, k) => {
        if (now > v.resetAt) buckets.delete(k);
      });
    }
    return true;
  };
}

export const generalApiLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 });
// Lab.js posts one incremental save per trial, and a classroom shares one
// address: at 300 a single Gambling Task run could exhaust the window and the
// rest of the session's saves were dropped with 429s. Measured from the raw
// archive (Nov 2026): one study peaked at 605 saves / 15 min, and the studies
// one class ran side by side on 2026-11-04 summed to ~1,260. 3000 leaves ~2x
// headroom over that. Every save is still gated by a server-issued run token,
// so the cap only needs to stop floods.
export const saveDataLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 3000 });
// jsPsych and p5 runs post a batch every few seconds while they run, and a
// classroom shares one address, so this route gets more room than /api/save.
export const runtimeSaveLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 1200 });
