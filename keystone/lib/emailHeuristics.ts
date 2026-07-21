// Signup-time bot heuristics.
//
// Background: from ~2026-06-22 onward we saw a sustained run of scripted
// signups using Gmail addresses with dots scattered through the local part —
// e.g. "u.w.i.r.a.kok.5.36@gmail.com", "i.z.ow.iv.it.ez7.5@gmail.com".
//
// Gmail ignores dots when routing, so the dots are pure randomisation: each
// address still reaches whatever mailbox the operator harvested, while looking
// unique to us. Note they mostly do NOT collide with each other after
// canonicalisation, so deduplication does not catch them — the dot density
// itself is the signal.
//
// A prod audit of 4,615 profiles found 153 matches at a >= 3 dot threshold.
// Exactly one was a real user (initials "a.r.m.", registered months before the
// campaign began). We accept that false-positive rate because the remedy is
// painless: since Gmail ignores dots, a genuine user can simply re-enter their
// address without them and mail still arrives in the same inbox. REJECTION_HINT
// is worded to tell them so.

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

// Tuned against the prod audit; raising this lets more bots through, lowering
// it starts catching real people who use initials.
const MAX_GMAIL_DOTS = 2;

export const REJECTION_HINT =
  "This email address was rejected by our automated signup checks. " +
  "If you use Gmail, please re-enter your address without the dots in it " +
  "(Gmail ignores them, so your mail will still arrive normally).";

/**
 * Returns true when the address looks machine-generated.
 * Currently: Gmail addresses carrying an implausible number of dots.
 */
export function isSuspiciousEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const normalized = email.toLowerCase().trim();
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex < 1) return false;

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  if (!GMAIL_DOMAINS.has(domain)) return false;

  // "+tag" suffixes are legitimate and shouldn't count toward dot density.
  const withoutTag = localPart.split("+")[0];
  const dotCount = withoutTag.split(".").length - 1;

  return dotCount > MAX_GMAIL_DOTS;
}
