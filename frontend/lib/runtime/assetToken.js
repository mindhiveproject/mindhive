// Checks the asset tokens Keystone signs (signAssetToken in
// keystone/lib/runtime/runtimeCore.js) with the shared run-token secret. The
// frontend only verifies; assetToken.test.js checks the two stay compatible.

const crypto = require('crypto');

let warnedMissingSecret = false;

function assetTokenSecret() {
  const secret =
    process.env.RUNTIME_RUN_TOKEN_SECRET || process.env.SESSION_SECRET;
  // Without it every jsPsych and p5 task answers "invalid link", which looks
  // like a participant problem; say what is actually wrong, once.
  if (!secret && !warnedMissingSecret) {
    warnedMissingSecret = true;
    console.error(
      'RUNTIME_RUN_TOKEN_SECRET is not set: jsPsych and p5 task files cannot be served. Set it to the same value as in Keystone.'
    );
  }
  return secret;
}

function assetSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`asset.${payload}`)
    .digest('base64url');
}

/** Returns the token's claims (`assetId`, `exp`), or throws. */
function verifyAssetToken(
  token,
  secret = assetTokenSecret(),
  now = Date.now()
) {
  if (!secret || typeof token !== 'string') {
    throw new Error('Invalid asset token');
  }
  const [payload, supplied, extra] = token.split('.');
  if (!payload || !supplied || extra) throw new Error('Invalid asset token');
  const expected = Buffer.from(assetSignature(payload, secret), 'utf8');
  const given = Buffer.from(supplied, 'utf8');
  if (
    given.length !== expected.length ||
    !crypto.timingSafeEqual(given, expected)
  ) {
    throw new Error('Invalid asset token');
  }
  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Invalid asset token');
  }
  if (
    claims?.typ !== 'asset' ||
    typeof claims.assetId !== 'string' ||
    !claims.assetId ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= now
  ) {
    throw new Error('Expired or incomplete asset token');
  }
  return claims;
}

module.exports = { assetTokenSecret, verifyAssetToken };
