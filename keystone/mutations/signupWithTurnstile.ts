import { verifyTurnstile } from "../lib/turnstile";
import { isSuspiciousEmail, REJECTION_HINT } from "../lib/emailHeuristics";

// Roles a visitor is allowed to self-assign at signup. ADMIN and RESEARCHER
// are deliberately absent — this mutation creates the profile with sudo, so
// the whitelist is the only thing standing between an anonymous caller and an
// arbitrary permission grant. Never widen this without thinking that through.
const SELF_ASSIGNABLE_ROLES = new Set([
  "STUDENT",
  "MENTOR",
  "TEACHER",
  "SCIENTIST",
  "SPONSOR",
  "PARTICIPANT",
]);

function clientIp(context: any): string | undefined {
  const req = context?.req;
  if (!req) return undefined;
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || undefined;
}

async function signupWithTurnstile(
  root: any,
  {
    username,
    email,
    password,
    role,
    classCode,
    info,
    turnstileToken,
  }: {
    username: string;
    email: string;
    password: string;
    role?: string;
    classCode?: string;
    info?: any;
    turnstileToken?: string;
  },
  context: any
): Promise<any> {
  const normalizedEmail = email?.toLowerCase().trim();

  if (!normalizedEmail || !password || !username) {
    throw new Error("Username, email and password are required.");
  }

  // 1. Proof of humanity. Skipped when TURNSTILE_SECRET_KEY is unset (dev).
  const human = await verifyTurnstile(turnstileToken, clientIp(context));
  if (!human) {
    throw new Error(
      "Human verification failed. Please complete the challenge and try again."
    );
  }

  // 2. Cheap heuristic for the scripted-signup pattern. Deliberately runs even
  // when Turnstile is disabled, so dev and any future token-replay still get it.
  if (isSuspiciousEmail(normalizedEmail)) {
    throw new Error(REJECTION_HINT);
  }

  const requestedRole = role?.toUpperCase();
  if (requestedRole && !SELF_ASSIGNABLE_ROLES.has(requestedRole)) {
    throw new Error("Invalid role.");
  }

  const existing = await context.sudo().db.Profile.findOne({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  // Created with sudo because Profile.create is now closed to anonymous
  // callers — this mutation is the only public way in, and the checks above
  // are what earn it.
  return context.sudo().db.Profile.createOne({
    data: {
      username,
      email: normalizedEmail,
      password,
      info: info ?? {},
      permissions: requestedRole ? { connect: { name: requestedRole } } : null,
      studentIn:
        requestedRole === "STUDENT" && classCode
          ? { connect: { code: classCode } }
          : null,
      mentorIn:
        requestedRole === "MENTOR" && classCode
          ? { connect: { code: classCode } }
          : null,
    },
  });
}

export default signupWithTurnstile;
