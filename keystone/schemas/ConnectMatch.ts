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

const frontendUrl = () =>
  (process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL) || "https://mindhive.science";

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
            student { email firstName username }
            opportunity { title }
            round { id title }
          `,
        });
        const email = match?.student?.email;
        if (!email) return;
        const oppTitle = match?.opportunity?.title || "an opportunity";
        const roundTitle = match?.round?.title || "your matching round";
        const studentName =
          match?.student?.firstName || match?.student?.username || "there";
        await sendNotificationEmail(
          email,
          `You're matched: ${oppTitle}`,
          `Hi ${studentName}, your match for "${roundTitle}" is now active — you've been placed on "${oppTitle}". Open your dashboard for details, and remember to rate the experience when the project wraps up.`,
          `${frontendUrl()}/dashboard/connect/participate?round=${match?.round?.id || ""}`,
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
