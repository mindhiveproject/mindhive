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
