import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import { rules, isSignedIn } from "../access";
import { sendNotificationEmail } from "../lib/mail";

const frontendUrl = () =>
  (process.env.NODE_ENV === "development"
    ? process.env.FRONTEND_URL_DEV
    : process.env.FRONTEND_URL) || "https://mindhive.science";

export const ConnectRating = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.connectRatingVisible,
      update: rules.connectRatingVisible,
      delete: rules.connectRatingVisible,
    },
  },
  hooks: {
    // Notify the rated party (mentor when a student rates, student when a
    // mentor rates) on rating creation. Best-effort, never blocks the mutation.
    async afterOperation({ operation, item, context }) {
      try {
        if (operation !== "create" || !item) return;
        const rating = await context.sudo().query.ConnectRating.findOne({
          where: { id: item.id },
          query: `
            raterRole
            rater { firstName lastName username }
            opportunity { id title }
            match {
              round { id }
              student { email username firstName }
              opportunity { mentor { email username firstName } }
            }
          `,
        });
        if (!rating) return;
        const raterName =
          rating.rater?.firstName ||
          rating.rater?.lastName ||
          rating.rater?.username ||
          "Someone";
        const oppTitle = rating.opportunity?.title || "an opportunity";

        if (rating.raterRole === "student") {
          const to = rating.match?.opportunity?.mentor?.email;
          if (!to) return;
          await sendNotificationEmail(
            to,
            `New rating for "${oppTitle}"`,
            `${raterName} just rated their experience with "${oppTitle}". Open your dashboard to see the feedback.`,
            `${frontendUrl()}/dashboard/connect/my-matches`,
          );
        } else if (rating.raterRole === "mentor") {
          const to = rating.match?.student?.email;
          if (!to) return;
          await sendNotificationEmail(
            to,
            `Your mentor left feedback`,
            `${raterName} rated your work on "${oppTitle}". You can review the feedback in your dashboard.`,
            `${frontendUrl()}/dashboard/connect/participate?round=${rating.match?.round?.id || ""}`,
          );
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("ConnectRating notification email failed:", e);
      }
    },
  },
  fields: {
    match: relationship({
      ref: "ConnectMatch.ratings",
    }),
    opportunity: relationship({
      ref: "Opportunity.ratings",
    }),

    rater: relationship({
      ref: "Profile.connectRatingsGiven",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && !inputData.rater) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.rater;
        },
      },
    }),
    raterRole: select({
      options: [
        { label: "Student", value: "student" },
        { label: "Mentor", value: "mentor" },
      ],
      defaultValue: "student",
    }),

    opportunityRating: integer(),
    mentorRating: integer(),
    teammateRatings: json(),
    feedback: text({ ui: { displayMode: "textarea" } }),
    tags: json(),
    isPublic: checkbox({ defaultValue: false }),

    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
