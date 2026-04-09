import { list } from "@keystone-6/core";
import { relationship, timestamp, select, json } from "@keystone-6/core/fields";
import { isSignedIn, isAdmin } from "../access";

export const Review = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all;
      // Others: their own reviews (author) or reviews on projects they own?
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : { author: { id: { equals: session?.itemId } } },
    },
  },
  fields: {
    author: relationship({
      ref: "Profile.reviews",
    }),
    study: relationship({
      ref: "Study.reviews",
    }),
    proposal: relationship({
      ref: "ProposalBoard.reviews",
    }),
    settings: json(),
    content: json(),
    stage: select({
      options: [
        { label: "Individual", value: "INDIVIDUAL" },
        { label: "Synthesis", value: "SYNTHESIS" },
        { label: "Proposal", value: "SUBMITTED_AS_PROPOSAL" },
        { label: "Peer Review", value: "PEER_REVIEW" },
        { label: "Data Collection", value: "DATA_COLLECTION" },
        { label: "Project Report", value: "PROJECT_REPORT" },
        { label: "In review", value: "IN_REVIEW" },
      ],
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
    updatedAt: timestamp(),
    upvotedBy: relationship({
      ref: "Profile.reviewsUpvoted",
      many: true,
    }),
  },
});
