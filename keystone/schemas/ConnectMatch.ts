import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  float,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";
import { sendNotificationEmail } from "../lib/mail";
import {
  pickStudentClassForRound,
  studentOpportunitiesUrl,
} from "../lib/connectRoundLinks";

export const ConnectMatch = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectMatchVisible,
      update: rules.connectMatchVisible,
      delete: rules.connectMatchVisible,
    },
  },
  hooks: {
    // Enforce uniqueness on (round, student, opportunity). Prisma doesn't
    // express compound-unique across relation FKs through Keystone field
    // decorators, so we guard at the resolver layer instead. Client already
    // dedupes, but a browser double-click or a network retry can still
    // race two createConnectMatch requests through; this hook catches them
    // before both rows land.
    async validateInput({ operation, resolvedData, item, addValidationError, context }) {
      if (operation !== "create" && operation !== "update") return;
      const nextRoundId =
        resolvedData?.round?.connect?.id ?? item?.roundId ?? null;
      const nextStudentId =
        resolvedData?.student?.connect?.id ?? item?.studentId ?? null;
      const nextOpportunityId =
        resolvedData?.opportunity?.connect?.id ?? item?.opportunityId ?? null;
      // Skip when we don't have all three legs yet (partial update, or a
      // create that omits one of them will fail elsewhere anyway).
      if (!nextRoundId || !nextStudentId || !nextOpportunityId) return;
      const existing = await context.sudo().query.ConnectMatch.findMany({
        where: {
          round: { id: { equals: nextRoundId } },
          student: { id: { equals: nextStudentId } },
          opportunity: { id: { equals: nextOpportunityId } },
          ...(operation === "update" && item?.id
            ? { id: { not: { equals: item.id } } }
            : {}),
        },
        query: "id",
      });
      if (existing.length > 0) {
        addValidationError(
          "This student is already matched to that opportunity in this round.",
        );
      }
    },
    // Notify the student when their match becomes active (e.g. when a teacher
    // publishes a round). Best-effort — swallows errors so a flaky email
    // service can't break the mutation.
    async afterOperation({ operation, item, originalItem, context }) {
      try {
        if (!item) return;
        const becameActive =
          item.status === "active" &&
          (operation === "create" || originalItem?.status !== "active");
        if (!becameActive) return;
        const match = await context.sudo().query.ConnectMatch.findOne({
          where: { id: item.id },
          query: `
            student {
              email
              firstName
              username
              studentIn { id code }
            }
            opportunity { title }
            round {
              id
              title
              classNetwork {
                classes { id code }
              }
            }
          `,
        });
        const email = match?.student?.email;
        if (!email) return;
        const oppTitle = match?.opportunity?.title || "an opportunity";
        const roundTitle = match?.round?.title || "your matching round";
        const studentName =
          match?.student?.firstName || match?.student?.username || "there";
        const targetClass = pickStudentClassForRound(
          match?.student?.studentIn,
          match?.round?.classNetwork?.classes,
        );
        const dashboardUrl = studentOpportunitiesUrl(
          targetClass?.code,
          match?.round?.id,
        );
        await sendNotificationEmail(
          email,
          `You're matched: ${oppTitle}`,
          `Hi ${studentName}, your match for "${roundTitle}" is now active — you've been placed on "${oppTitle}". Open your dashboard for details, and remember to rate the experience when the project wraps up.`,
          dashboardUrl,
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("ConnectMatch notification email failed:", e);
      }
    },
  },
  fields: {
    round: relationship({
      ref: "ConnectRound.matches",
    }),
    classNetwork: relationship({
      ref: "ClassNetwork.matches",
    }),
    opportunity: relationship({
      ref: "Opportunity.matches",
    }),
    student: relationship({
      ref: "Profile.connectMatches",
    }),

    status: select({
      options: [
        { label: "Proposed", value: "proposed" },
        { label: "Active", value: "active" },
        { label: "Completed", value: "completed" },
        { label: "Declined", value: "declined" },
        { label: "Cancelled", value: "cancelled" },
      ],
      defaultValue: "proposed",
    }),

    matchScore: float(),

    teacherNotes: text({ ui: { displayMode: "textarea" } }),

    ratings: relationship({
      ref: "ConnectRating.match",
      many: true,
    }),

    createdBy: relationship({
      ref: "Profile.connectMatchesCreated",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.createdBy) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.createdBy;
        },
      },
    }),

    proposedAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    activatedAt: timestamp(),
    completedAt: timestamp(),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
  },
});
