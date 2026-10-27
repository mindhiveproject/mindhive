/**
 * Teacher review of a consent protocol linked to a class.
 *
 * - submitConsentForReview: the author or a collaborator marks the protocol
 *   ready; the class teacher and teaching team get an Update.
 * - reviewConsent: a member of that teaching team approves it or reopens it
 *   with a note; the author and collaborators get an Update.
 *
 * The state lives in Consent.settings.review. Writes use sudo because
 * teachers are not collaborators on the protocol (list update is
 * author/collaborator only); permission is checked here instead.
 */

const CONSENT_QUERY = `
  id
  code
  title
  settings
  author { id username }
  collaborators { id }
  class { id creator { id } teachingTeam { id } }
`;

// Update messages are rendered as HTML
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadConsent(context: any, consentId: string) {
  const consent = await context.sudo().query.Consent.findOne({
    where: { id: consentId },
    query: CONSENT_QUERY,
  });
  if (!consent) throw new Error("This consent protocol could not be found.");
  return consent;
}

function teachingTeamIds(consent: any): string[] {
  return [
    consent.class?.creator?.id,
    ...(consent.class?.teachingTeam || []).map((p: any) => p?.id),
  ].filter(Boolean);
}

async function notify(
  context: any,
  userIds: string[],
  link: string,
  content: Record<string, string>
) {
  for (const userId of [...new Set(userIds)]) {
    try {
      await context.sudo().db.Update.createOne({
        data: {
          user: { connect: { id: userId } },
          updateArea: "CONSENT",
          link,
          content,
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed to create consent review Update for ${userId}:`, e);
    }
  }
}

export async function submitConsentForReview(
  _root: unknown,
  { consentId, info }: { consentId: string; info?: unknown },
  context: any
) {
  const sessionId = context.session?.itemId;
  if (!sessionId) throw new Error("You must be signed in.");

  const consent = await loadConsent(context, consentId);
  const isOwner =
    consent.author?.id === sessionId ||
    (consent.collaborators || []).some((c: any) => c?.id === sessionId);
  if (!isOwner) throw new Error("Only the protocol's authors can submit it.");

  const reviewers = teachingTeamIds(consent);
  if (!consent.class?.id || reviewers.length === 0) {
    throw new Error("Connect this protocol to your class before submitting it.");
  }

  const submitter = await context.sudo().query.Profile.findOne({
    where: { id: sessionId },
    query: "username",
  });

  await context.sudo().db.Consent.updateOne({
    where: { id: consentId },
    data: {
      ...(info !== undefined ? { info } : {}),
      settings: {
        ...(consent.settings || {}),
        review: {
          status: "submitted",
          submittedAt: new Date().toISOString(),
          submittedBy: { id: sessionId, username: submitter?.username },
        },
      },
    },
  });

  await notify(
    context,
    reviewers.filter((id) => id !== sessionId),
    `/dashboard/irb/${consent.code}`,
    {
      title: "Consent protocol ready for review",
      message: `${escapeHtml(submitter?.username || "A student")} marked "${escapeHtml(consent.title)}" as ready for review.`,
      linkTitle: "Review protocol",
    }
  );

  return context.db.Consent.findOne({ where: { id: consentId } });
}

export async function reviewConsent(
  _root: unknown,
  {
    consentId,
    decision,
    note,
  }: { consentId: string; decision: string; note?: string },
  context: any
) {
  const sessionId = context.session?.itemId;
  if (!sessionId) throw new Error("You must be signed in.");
  if (decision !== "approve" && decision !== "reopen") {
    throw new Error('decision must be "approve" or "reopen".');
  }

  const consent = await loadConsent(context, consentId);
  if (!teachingTeamIds(consent).includes(sessionId)) {
    throw new Error("Only the class's teaching team can review this protocol.");
  }

  const reviewer = await context.sudo().query.Profile.findOne({
    where: { id: sessionId },
    query: "username",
  });
  const trimmedNote = (note || "").trim();
  const approved = decision === "approve";

  await context.sudo().db.Consent.updateOne({
    where: { id: consentId },
    data: {
      settings: {
        ...(consent.settings || {}),
        review: {
          ...(consent.settings?.review || {}),
          status: approved ? "approved" : "reopened",
          reviewedAt: new Date().toISOString(),
          reviewedBy: { id: sessionId, username: reviewer?.username },
          note: approved ? "" : trimmedNote,
        },
      },
    },
  });

  const reviewerName = escapeHtml(reviewer?.username || "Your teacher");
  const title = escapeHtml(consent.title);
  await notify(
    context,
    [
      consent.author?.id,
      ...(consent.collaborators || []).map((c: any) => c?.id),
    ].filter((id: string) => id && id !== sessionId),
    `/dashboard/irb/${consent.code}?action=edit`,
    approved
      ? {
          title: "Consent protocol approved",
          message: `${reviewerName} approved "${title}".`,
          linkTitle: "Open protocol",
        }
      : {
          title: "Consent protocol reopened",
          message: trimmedNote
            ? `${reviewerName} reopened "${title}": ${escapeHtml(trimmedNote)}`
            : `${reviewerName} reopened "${title}" for more work.`,
          linkTitle: "Open protocol",
        }
  );

  return context.db.Consent.findOne({ where: { id: consentId } });
}
