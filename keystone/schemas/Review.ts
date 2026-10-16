import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  password,
  timestamp,
  select,
  integer,
  checkbox,
  json,
} from "@keystone-6/core/fields";
import slugify from "slugify";

import { authorFilter, isSignedIn } from "../access";

type ProfileRef = {
  id?: string;
} | null;

type BoardRef = {
  id?: string;
  title?: string | null;
  creator?: ProfileRef;
  author?: ProfileRef;
  collaborators?: ProfileRef[] | null;
} | null;

const REVIEW_NOTIFY_QUERY = `
  stage
  author { id }
  milestone { title }
  proposal {
    id
    title
    creator { id }
    author { id }
    collaborators { id }
  }
  study {
    proposal {
      id
      title
      creator { id }
      author { id }
      collaborators { id }
    }
  }
`;

function milestoneLabel(title?: string | null, stage?: string | null) {
  const milestoneTitle = title?.trim();
  if (milestoneTitle) return milestoneTitle;
  const raw = stage?.trim();
  if (!raw) return "this milestone";
  const words = raw.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function boardFromReview(review: {
  proposal?: BoardRef;
  study?: { proposal?: BoardRef[] | BoardRef } | null;
}): BoardRef {
  if (review.proposal?.id) return review.proposal;
  const linked = review.study?.proposal;
  if (Array.isArray(linked)) return linked.find((board) => board?.id) || null;
  return linked?.id ? linked : null;
}

function recipientIds(board: BoardRef, excludedIds: string[]) {
  const excluded = new Set(excludedIds.filter(Boolean));
  const ids = new Set<string>();
  const people = [
    board?.creator,
    board?.author,
    ...(board?.collaborators || []),
  ];
  for (const person of people) {
    const id = person?.id ? String(person.id) : "";
    if (id && !excluded.has(id)) ids.add(id);
  }
  return [...ids];
}

async function notifyProjectMembersOfNewReview(context: any, reviewId: string) {
  const review = await context.sudo().query.Review.findOne({
    where: { id: reviewId },
    query: REVIEW_NOTIFY_QUERY,
  });
  if (!review) return;

  const board = boardFromReview(review);
  if (!board?.id) return;

  const recipients = recipientIds(board, [
    review.author?.id ? String(review.author.id) : "",
    context.session?.itemId ? String(context.session.itemId) : "",
  ]);
  if (recipients.length === 0) return;

  const projectTitle = board.title?.trim() || "your project";
  const content = {
    title: "New feedback on your project",
    message: `You received a review on "${projectTitle}" (${milestoneLabel(
      review.milestone?.title,
      review.stage
    )}).`,
    linkTitle: "View project",
  };
  const link = `/builder/projects?selector=${encodeURIComponent(board.id)}`;

  for (const profileId of recipients) {
    try {
      await context.sudo().db.Update.createOne({
        data: {
          user: { connect: { id: profileId } },
          updateArea: "PROJECT",
          link,
          content,
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to create review Update for user ${profileId}:`,
        e
      );
    }
  }
}

export const Review = list({
  access: {
    // Reviews are shared with signed-in users (Feedback Center). Only the
    // author edits a review; upvotes go through toggleReviewUpvote (sudo).
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      update: authorFilter,
      delete: authorFilter,
    },
  },
  fields: {
    author: relationship({
      ref: "Profile.reviews",
      hooks: {
        // A review is always filed by the signed-in user.
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create" && context.session?.itemId) {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.author;
        },
      },
    }),
    study: relationship({
      ref: "Study.reviews",
    }),
    proposal: relationship({
      ref: "ProposalBoard.reviews",
    }),
    settings: json(),
    content: json(),
    stage: text({
      isFilterable: true,
      isIndexed: true,
    }),
    milestone: relationship({
      ref: "Milestone.reviews",
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
  hooks: {
    async afterOperation({ operation, item, context }) {
      if (operation !== "create") return;
      const reviewId = (item as { id?: string } | undefined)?.id;
      if (!reviewId) return;
      try {
        await notifyProjectMembersOfNewReview(context, String(reviewId));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to notify project members of review ${reviewId}:`,
          e
        );
      }
    },
  },
});
