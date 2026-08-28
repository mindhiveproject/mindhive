import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  json,
} from "@keystone-6/core/fields";
import { rules, isSignedIn, permissions } from "../access";
import { sendNotificationEmail } from "../lib/mail";
import {
  archiveAppointmentRequestUpdates,
  notifyAppointmentRequestUpdates,
  notifyAppointmentScheduledUpdates,
} from "../lib/appointmentRequestNotifications";

const frontendUrl = () =>
  (process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL) || "https://mindhive.science";

function displayName(p: { firstName?: string; lastName?: string; username?: string } | null) {
  if (!p) return "there";
  return (
    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
    p.username ||
    "there"
  );
}

export const REVIEW_NOTE_KIND = {
  REVIEWER_COMMENT: "reviewer_comment",
  SPONSOR_REPLY: "sponsor_reply",
  APPOINTMENT_REQUEST: "appointment_request",
  APPOINTMENT_SCHEDULED: "appointment_scheduled",
} as const;

export type ReviewNoteKind =
  (typeof REVIEW_NOTE_KIND)[keyof typeof REVIEW_NOTE_KIND];

function connectId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const rel = value as { connect?: { id?: string } };
  return rel.connect?.id ? String(rel.connect.id) : null;
}

type PairActors = {
  isMentor: boolean;
  isReviewerSide: boolean;
};

async function getPairActors(
  context: any,
  roundId: string,
  opportunityId: string,
  userId: string
): Promise<PairActors | null> {
  if (permissions.canManageUsers({ session: context.session })) {
    return { isMentor: true, isReviewerSide: true };
  }

  const round = await context.sudo().query.ConnectRound.findOne({
    where: { id: roundId },
    query: `
      id
      createdBy { id }
      reviewers { id }
      classNetwork {
        id
        creator { id }
        admins { id }
        classes { id creator { id } mentors { id } }
      }
    `,
  });
  if (!round) return null;

  const opportunity = await context.sudo().query.Opportunity.findOne({
    where: { id: opportunityId },
    query: `id mentor { id }`,
  });
  if (!opportunity) return null;

  const isMentor = opportunity.mentor?.id === userId;
  const isReviewerSide =
    round.createdBy?.id === userId ||
    (round.reviewers || []).some((r: { id: string }) => r.id === userId) ||
    round.classNetwork?.creator?.id === userId ||
    (round.classNetwork?.admins || []).some(
      (admin: { id: string }) => admin.id === userId
    ) ||
    (round.classNetwork?.classes || []).some(
      (c: { creator?: { id: string }; mentors?: { id: string }[] }) =>
        c.creator?.id === userId ||
        (c.mentors || []).some((m) => m.id === userId)
    );

  return { isMentor, isReviewerSide };
}

async function canCreateReviewNoteForPair(
  context: any,
  roundId: string,
  opportunityId: string,
  userId: string,
  kind: ReviewNoteKind
): Promise<boolean> {
  const actors = await getPairActors(
    context,
    roundId,
    opportunityId,
    userId
  );
  if (!actors) return false;

  if (kind === REVIEW_NOTE_KIND.SPONSOR_REPLY) {
    return actors.isMentor;
  }
  if (
    kind === REVIEW_NOTE_KIND.APPOINTMENT_SCHEDULED ||
    kind === REVIEW_NOTE_KIND.APPOINTMENT_REQUEST
  ) {
    return actors.isMentor || actors.isReviewerSide;
  }
  // reviewer_comment (default): teachers/reviewers/admins — not the mentor alone
  return actors.isReviewerSide;
}

// A review conversation message on an opportunity within the context of a
// specific matching round. The (opportunity, round) pair scopes the thread —
// reviewing the same opportunity in a different round produces a separate
// conversation.
//
// Kinds:
// - reviewer_comment: teacher/reviewer feedback (default; existing notes)
// - sponsor_reply: mentor response in the same thread
// - appointment_request: either side requested a meeting (form seed or messages)
// - appointment_scheduled: either side marked the meeting request as scheduled
//
// Visibility: the author, any reviewer on the same round, the round
// creator, class-network/class teachers, the opportunity's mentor, and
// admins. Mutate: author or admin (notes are owned by the person who wrote them).
export const OpportunityReviewNote = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectReviewNoteVisible,
      update: rules.connectReviewNoteMutate,
      delete: rules.connectReviewNoteMutate,
    },
  },
  fields: {
    opportunity: relationship({
      ref: "Opportunity.reviewNotes",
    }),
    round: relationship({
      ref: "ConnectRound.reviewNotes",
    }),
    kind: select({
      options: [
        {
          label: "Reviewer comment",
          value: REVIEW_NOTE_KIND.REVIEWER_COMMENT,
        },
        {
          label: "Sponsor reply",
          value: REVIEW_NOTE_KIND.SPONSOR_REPLY,
        },
        {
          label: "Appointment request",
          value: REVIEW_NOTE_KIND.APPOINTMENT_REQUEST,
        },
        {
          label: "Appointment scheduled",
          value: REVIEW_NOTE_KIND.APPOINTMENT_SCHEDULED,
        },
      ],
      defaultValue: REVIEW_NOTE_KIND.REVIEWER_COMMENT,
      validation: { isRequired: true },
      isFilterable: true,
    }),
    body: text({
      validation: { isRequired: true },
      ui: { displayMode: "textarea" },
    }),
    // Optional structured extras (section refs, checklist items, etc.).
    // Human-readable content always lives in `body`.
    payload: json(),
    author: relationship({
      ref: "Profile.opportunityReviewNotes",
      hooks: {
        async resolveInput({ context, operation }) {
          // Always derive author from the session on create; ignore client input.
          if (operation === "create") {
            const sessionId = context.session?.itemId;
            if (!sessionId) return undefined;
            return { connect: { id: sessionId } };
          }
          // Never allow author changes on update.
          return undefined;
        },
      },
    }),
    // Reviewers who have seen this note. Only written via the
    // markOpportunityReviewNotesRead custom mutation — stripped from
    // normal create/update input below.
    readBy: relationship({
      ref: "Profile.opportunityReviewNotesRead",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
  hooks: {
    async resolveInput({ resolvedData, operation }) {
      if (operation === "update") {
        // Scope/ownership fields are immutable after create.
        // readBy is only set via markOpportunityReviewNotesRead (sudo).
        const {
          author: _author,
          opportunity: _opportunity,
          round: _round,
          kind: _kind,
          readBy: _readBy,
          ...rest
        } = resolvedData as Record<string, unknown>;
        return { ...rest, updatedAt: new Date() };
      }
      if (operation === "create") {
        // Never accept client-supplied readBy on create.
        const { readBy: _readBy, ...rest } = resolvedData as Record<
          string,
          unknown
        >;
        // Ensure kind defaults even if client omits it.
        if (!rest.kind) {
          return {
            ...rest,
            kind: REVIEW_NOTE_KIND.REVIEWER_COMMENT,
          };
        }
        return rest;
      }
      return resolvedData;
    },
    validateInput: async ({
      operation,
      resolvedData,
      item,
      context,
      addValidationError,
    }) => {
      if (operation === "update") {
        // Reject attempts to change immutable fields (also stripped in resolveInput).
        if (
          resolvedData.author !== undefined ||
          resolvedData.opportunity !== undefined ||
          resolvedData.round !== undefined ||
          resolvedData.kind !== undefined
        ) {
          addValidationError(
            "Review note author, opportunity, round, and kind cannot be changed after creation."
          );
        }
        return;
      }

      if (operation !== "create") return;

      const roundId = connectId(resolvedData.round);
      const opportunityId = connectId(resolvedData.opportunity);
      const userId = context.session?.itemId;
      const kind = (resolvedData.kind ||
        REVIEW_NOTE_KIND.REVIEWER_COMMENT) as ReviewNoteKind;

      if (!roundId || !opportunityId) {
        addValidationError(
          "Review notes must be linked to both an opportunity and a matching round."
        );
        return;
      }
      if (!userId) {
        addValidationError("You must be signed in to leave a review note.");
        return;
      }
      if (
        kind !== REVIEW_NOTE_KIND.REVIEWER_COMMENT &&
        kind !== REVIEW_NOTE_KIND.SPONSOR_REPLY &&
        kind !== REVIEW_NOTE_KIND.APPOINTMENT_REQUEST &&
        kind !== REVIEW_NOTE_KIND.APPOINTMENT_SCHEDULED
      ) {
        addValidationError("Invalid review note kind.");
        return;
      }

      const allowed = await canCreateReviewNoteForPair(
        context,
        roundId,
        opportunityId,
        userId,
        kind
      );
      if (!allowed) {
        if (kind === REVIEW_NOTE_KIND.SPONSOR_REPLY) {
          addValidationError(
            "Only the opportunity sponsor can post a reply in this thread."
          );
        } else if (kind === REVIEW_NOTE_KIND.APPOINTMENT_SCHEDULED) {
          addValidationError(
            "Only the sponsor or reviewers for this matching round can mark an appointment as scheduled."
          );
        } else if (kind === REVIEW_NOTE_KIND.APPOINTMENT_REQUEST) {
          addValidationError(
            "Only the sponsor or reviewers for this matching round can request a meeting."
          );
        } else {
          addValidationError(
            "You are not allowed to leave a review note on this opportunity for this round."
          );
        }
      }

      // Silence unused var warning if item is present on create in some versions.
      void item;
    },
    async afterOperation({ operation, item, context }) {
      if (operation !== "create" || !item) return;

      const isAppointmentRequest =
        item.kind === REVIEW_NOTE_KIND.APPOINTMENT_REQUEST;
      const isAppointmentScheduled =
        item.kind === REVIEW_NOTE_KIND.APPOINTMENT_SCHEDULED;

      if (isAppointmentRequest || isAppointmentScheduled) {
        try {
          const note = await context.sudo().query.OpportunityReviewNote.findOne({
            where: { id: String(item.id) },
            query: `
              id
              payload
              author { id firstName lastName username }
              opportunity {
                id
                title
                requestsAppointment
                mentor { id email firstName lastName username }
                classNetworks { id publicId }
                rounds {
                  id
                  classNetwork { id publicId }
                }
              }
            `,
          });
          const opportunity = note?.opportunity;
          const opportunityId = opportunity?.id;
          if (!opportunityId) return;

          const wantRequested = isAppointmentRequest;
          const currentlyRequested = Boolean(opportunity.requestsAppointment);
          if (currentlyRequested !== wantRequested) {
            await context.sudo().db.Opportunity.updateOne({
              where: { id: String(opportunityId) },
              data: { requestsAppointment: wantRequested },
            });
          }

          const payload =
            note.payload && typeof note.payload === "object"
              ? note.payload
              : item.payload && typeof item.payload === "object"
                ? item.payload
                : null;
          const seededFromForm = payload?.source === "form";

          if (isAppointmentRequest && !seededFromForm) {
            await notifyAppointmentRequestUpdates(
              context,
              {
                ...opportunity,
                requestsAppointment: true,
              },
              { author: note.author }
            );
          }
          if (isAppointmentScheduled) {
            await archiveAppointmentRequestUpdates(
              context,
              String(opportunityId)
            );
            await notifyAppointmentScheduledUpdates(context, opportunity, {
              author: note.author,
            });
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(
            "OpportunityReviewNote appointment flag update failed:",
            e
          );
        }
        return;
      }

      if (item.kind !== REVIEW_NOTE_KIND.SPONSOR_REPLY) return;

      try {
        const note = await context.sudo().query.OpportunityReviewNote.findOne({
          where: { id: String(item.id) },
          query: `
            id
            body
            author { id firstName lastName username }
            opportunity { id title mentor { id } }
            round {
              id
              title
              createdBy { id email firstName lastName username }
              reviewers { id email firstName lastName username }
            }
          `,
        });
        if (!note?.round || !note?.opportunity) return;

        const mentorId = note.opportunity.mentor?.id;
        const authorName = displayName(note.author);
        const title = note.opportunity.title || "Capstone proposal";
        const link =
          frontendUrl() +
          "/dashboard/connect/review?op=" +
          note.opportunity.id +
          "&round=" +
          note.round.id;
        const seen = new Set<string>();

        const recipients = [
          note.round.createdBy,
          ...(note.round.reviewers || []),
        ].filter(Boolean);

        for (const recipient of recipients) {
          if (!recipient?.email) continue;
          if (recipient.id === mentorId) continue;
          if (seen.has(recipient.id)) continue;
          seen.add(recipient.id);

          try {
            await sendNotificationEmail(
              recipient.email,
              'Sponsor replied on "' + title + '"',
              "Hi " +
                displayName(recipient) +
                ",\n\n" +
                authorName +
                ' replied in the review thread for "' +
                title +
                '" (round "' +
                (note.round.title || "matching") +
                '"). Open the link below to read their message.',
              link
            );
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error(
              "Sponsor reply notification failed for " + recipient.email + ":",
              e
            );
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("OpportunityReviewNote afterOperation failed:", e);
      }
    },
  },
});
