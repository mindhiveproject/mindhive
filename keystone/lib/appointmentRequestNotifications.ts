import {
  getNotificationRecipients,
  getOpportunityStakeholderIds,
  getPrimarySponsor,
  isOpportunitySponsor,
} from "./opportunityStakeholders";

const APPOINTMENT_REQUEST_UPDATE_KIND = "appointment_request";
const APPOINTMENT_SCHEDULED_UPDATE_KIND = "appointment_scheduled";
const SPONSOR_OPPORTUNITIES_LINK = "/dashboard/sponsor-connect/opportunities";

type Person = {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
} | null;

function displayName(p: Person) {
  if (!p) return "there";
  return (
    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
    p.username ||
    "there"
  );
}

function parseUpdateContent(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return null;
}

/**
 * Deep link into a class matching "Review opportunities" panel for a
 * network, matching NetworkAppointmentRequests on the frontend.
 */
export function appointmentReviewLink(
  recipientId: string,
  rounds: any[]
): string {
  for (const round of rounds || []) {
    const network = round?.classNetwork;
    if (!network?.id) continue;
    const networkRef = network.publicId || network.id;
    for (const cls of network.classes || []) {
      if (!cls?.code) continue;
      const isCreator = cls.creator?.id === recipientId;
      const isMentor = (cls.mentors || []).some(
        (m: { id: string }) => m.id === recipientId
      );
      if (!isCreator && !isMentor) continue;
      const params = new URLSearchParams({
        page: "opportunities",
        matchingPanel: "review",
        networkId: networkRef,
      });
      return `/dashboard/myclasses/${encodeURIComponent(
        cls.code
      )}?${params.toString()}`;
    }
  }
  return "/dashboard/home";
}

async function createConnectAppointmentUpdate(
  context: any,
  userId: string,
  link: string,
  content: Record<string, unknown>
) {
  try {
    await context.sudo().db.Update.createOne({
      data: {
        user: { connect: { id: userId } },
        updateArea: "CONNECT",
        link,
        content,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(
      `Failed to create appointment Update for user ${userId}:`,
      e
    );
  }
}

async function loadNetworkRounds(context: any, opportunity: any) {
  const networkIds = [
    ...(opportunity.classNetworks || []).map((n: { id: string }) => n?.id),
    ...(opportunity.rounds || []).map(
      (r: { classNetwork?: { id?: string } }) => r?.classNetwork?.id
    ),
  ].filter(Boolean);
  const uniqueNetworkIds = [...new Set(networkIds)];
  if (uniqueNetworkIds.length === 0) return [];

  return (
    (await context.sudo().query.ConnectRound.findMany({
      where: {
        classNetwork: { id: { in: uniqueNetworkIds } },
        status: { not: { equals: "archived" } },
      },
      query: `
        id
        createdBy { id }
        reviewers { id }
        classNetwork {
          id
          publicId
          classes {
            code
            creator { id }
            mentors { id }
          }
        }
      `,
    })) || []
  );
}

function reviewerRecipientIds(
  rounds: any[],
  stakeholderIds: string[],
  authorId: string
) {
  const recipientIds = new Set<string>();
  for (const round of rounds) {
    if (round?.createdBy?.id) recipientIds.add(round.createdBy.id);
    for (const reviewer of round?.reviewers || []) {
      if (reviewer?.id) recipientIds.add(reviewer.id);
    }
  }
  for (const id of stakeholderIds) recipientIds.delete(id);
  if (authorId) recipientIds.delete(authorId);
  return recipientIds;
}

function isSponsorActor(opportunity: any, authorId: string): boolean {
  if (!authorId) return true;
  return isOpportunitySponsor(opportunity, authorId);
}

function getStakeholderIds(opportunity: any): string[] {
  return getOpportunityStakeholderIds(opportunity);
}

function getStakeholderRecipients(opportunity: any): Person[] {
  return getNotificationRecipients(opportunity);
}

/**
 * Notify the other party when a meeting is requested.
 * Sponsor / form requests notify reviewers; teacher requests notify stakeholders.
 */
export async function notifyAppointmentRequestUpdates(
  context: any,
  opportunity: any,
  options?: { author?: Person }
) {
  try {
    if (!opportunity?.requestsAppointment) return;

    const author = options?.author || null;
    const authorId = author?.id ? String(author.id) : "";
    const stakeholderIds = getStakeholderIds(opportunity);
    const primarySponsor = getPrimarySponsor(opportunity);
    const requesterName = displayName(author || primarySponsor);
    const title = opportunity.title || "an opportunity";
    const opportunityId = String(opportunity.id);
    const content = {
      title: "Appointment requested",
      message: `${requesterName} requested a meeting about "${title}"`,
      linkTitle: "Review",
      kind: APPOINTMENT_REQUEST_UPDATE_KIND,
      opportunityId,
    };

    const isSponsorRequest = isSponsorActor(opportunity, authorId);

    if (!isSponsorRequest) {
      const recipients = getStakeholderRecipients(opportunity).filter(
        (p) => p?.id && String(p.id) !== authorId
      );
      for (const recipient of recipients) {
        await createConnectAppointmentUpdate(
          context,
          String(recipient.id),
          SPONSOR_OPPORTUNITIES_LINK,
          { ...content, linkTitle: "Messages" }
        );
      }
      return;
    }

    const rounds = await loadNetworkRounds(context, opportunity);
    if (!rounds.length) return;

    const recipientIds = reviewerRecipientIds(
      rounds,
      stakeholderIds,
      authorId
    );
    if (recipientIds.size === 0) return;

    for (const userId of recipientIds) {
      await createConnectAppointmentUpdate(
        context,
        userId,
        appointmentReviewLink(userId, rounds),
        content
      );
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("notifyAppointmentRequestUpdates failed:", e);
  }
}

/**
 * Notify the other party when a meeting is marked scheduled. No email.
 */
export async function notifyAppointmentScheduledUpdates(
  context: any,
  opportunity: any,
  options?: { author?: Person }
) {
  try {
    const author = options?.author || null;
    const authorId = author?.id ? String(author.id) : "";
    const stakeholderIds = getStakeholderIds(opportunity);
    const primarySponsor = getPrimarySponsor(opportunity);
    const actorName = displayName(author || primarySponsor);
    const title = opportunity.title || "an opportunity";
    const opportunityId = String(opportunity.id);
    const content = {
      title: "Meeting scheduled",
      message: `${actorName} marked the meeting about "${title}" as scheduled`,
      linkTitle: "Review",
      kind: APPOINTMENT_SCHEDULED_UPDATE_KIND,
      opportunityId,
    };

    const isSponsorActorFlag = isSponsorActor(opportunity, authorId);

    if (!isSponsorActorFlag) {
      const recipients = getStakeholderRecipients(opportunity).filter(
        (p) => p?.id && String(p.id) !== authorId
      );
      for (const recipient of recipients) {
        await createConnectAppointmentUpdate(
          context,
          String(recipient.id),
          SPONSOR_OPPORTUNITIES_LINK,
          { ...content, linkTitle: "Messages" }
        );
      }
      return;
    }

    const rounds = await loadNetworkRounds(context, opportunity);
    if (!rounds.length) return;

    const recipientIds = reviewerRecipientIds(
      rounds,
      stakeholderIds,
      authorId
    );
    if (recipientIds.size === 0) return;

    for (const userId of recipientIds) {
      await createConnectAppointmentUpdate(
        context,
        userId,
        appointmentReviewLink(userId, rounds),
        content
      );
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("notifyAppointmentScheduledUpdates failed:", e);
  }
}

/**
 * Archive every unarchived CONNECT appointment-request Update for this
 * opportunity so the doorbell is off for all recipients, not only the actor.
 */
export async function archiveAppointmentRequestUpdates(
  context: any,
  opportunityId: string
) {
  if (!opportunityId) return;
  try {
    const updates = await context.sudo().query.Update.findMany({
      where: {
        updateArea: { equals: "CONNECT" },
        isArchived: { equals: false },
      },
      query: `id content`,
    });

    for (const update of updates || []) {
      const content = parseUpdateContent(update?.content);
      if (!content) continue;
      if (content.kind !== APPOINTMENT_REQUEST_UPDATE_KIND) continue;
      if (String(content.opportunityId || "") !== String(opportunityId)) {
        continue;
      }
      try {
        await context.sudo().db.Update.updateOne({
          where: { id: String(update.id) },
          data: { isArchived: true, hasOpen: true },
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to archive appointment-request Update ${update.id}:`,
          e
        );
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("archiveAppointmentRequestUpdates failed:", e);
  }
}
