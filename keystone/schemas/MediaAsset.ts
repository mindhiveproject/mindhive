import { list } from "@keystone-6/core";
import {
  text,
  relationship,
  timestamp,
  json,
  image,
} from "@keystone-6/core/fields";
import { rules } from "../access";

function hasManageUsersPermission(session: any) {
  const permissionRows = Array.isArray(session?.data?.permissions)
    ? session.data.permissions
    : [];
  return permissionRows.some((row: any) => !!row?.canManageUsers);
}

/**
 * Reusable images scoped to a board.
 *
 * `settings` JSON (expected shape):
 * {
 *   createdWith?: string | null; // how the file was produced, e.g. upload, paste, datatool-hv, datatool-graph
 * }
 */
export const MediaAsset = list({
  access: {
    operation: {
      query: () => true,
      create: ({ session }) => !!session?.itemId,
      update: ({ session }) => !!session?.itemId,
      delete: ({ session }) => !!session?.itemId,
    },
    item: {
      update: ({ session, item }) => {
        const canManageUsers = hasManageUsersPermission(session);
        const isAuthor = item.authorId === session?.itemId;
        const allowed = !!session?.itemId && (canManageUsers || isAuthor);
        return allowed;
      },
      delete: ({ session, item }) => {
        const canManageUsers = hasManageUsersPermission(session);
        const isAuthor = item.authorId === session?.itemId;
        const allowed = !!session?.itemId && (canManageUsers || isAuthor);
        return allowed;
      },
    },
  },
  hooks: {
    resolveInput: async ({ operation, resolvedData, context }) => {
      if (operation !== "create" && operation !== "update") {
        return resolvedData;
      }

      // Keep createdInBoard aligned with the card context when createdInCard is provided.
      const createdInCardId =
        resolvedData?.createdInCard?.connect?.id ||
        resolvedData?.createdInCard?.set?.id ||
        null;
      const hasExplicitCreatedInBoard =
        resolvedData?.createdInBoard !== undefined &&
        resolvedData?.createdInBoard !== null;

      if (!createdInCardId || hasExplicitCreatedInBoard) {
        return resolvedData;
      }

      const card = await context.query.ProposalCard.findOne({
        where: { id: String(createdInCardId) },
        query: "id section { board { id } }",
      });
      const boardId = card?.section?.board?.id;
      if (!boardId) return resolvedData;

      return {
        ...resolvedData,
        createdInBoard: { connect: { id: boardId } },
      };
    },
    validateInput: async ({
      operation,
      resolvedData,
      item,
      context,
      addValidationError,
    }) => {
      const ownerFields = [
        "createdInBoard",
        "createdInCard",
        "createdInVizSection",
        "createdInResource",
        "createdInStudy",
        "createdInAssignment",
        "createdInProfile",
      ];

      const getResolvedOwnerState = (
        fieldName: string,
        previousId: string | null
      ) => {
        const update = resolvedData[fieldName];
        if (update === undefined) return previousId;
        if (update === null || update.disconnect) return null;
        if (update.connect?.id) return update.connect.id;
        if (update.set?.id) return update.set.id;
        return previousId;
      };

      if (operation === "create") {
        const ownerCount = ownerFields.reduce((count, fieldName) => {
          const value = resolvedData[fieldName];
          if (value?.connect?.id || value?.set?.id) return count + 1;
          return count;
        }, 0);
        const hasCardAndBoardOwner =
          !!resolvedData?.createdInCard?.connect?.id &&
          !!resolvedData?.createdInBoard?.connect?.id;
        const ownerValidationPassed =
          ownerCount === 1 || (ownerCount === 2 && hasCardAndBoardOwner);

        if (!ownerValidationPassed) {
          addValidationError(
            "MediaAsset must have exactly one createdIn* owner, except createdInCard + createdInBoard which are allowed together."
          );
        }
        return;
      }

      if (operation === "update" && item?.id) {
        const ownerPatchProvided = ownerFields.some(
          (fieldName) => resolvedData[fieldName] !== undefined
        );
        if (!ownerPatchProvided) return;

        const current = await context.query.MediaAsset.findOne({
          where: { id: String(item.id) },
          query: `
            createdInBoard { id }
            createdInCard { id }
            createdInVizSection { id }
            createdInResource { id }
            createdInStudy { id }
            createdInAssignment { id }
            createdInProfile { id }
          `,
        });

        const ownerCount = ownerFields.reduce((count, fieldName) => {
          const previousId = current?.[fieldName]?.id || null;
          const nextId = getResolvedOwnerState(fieldName, previousId);
          return nextId ? count + 1 : count;
        }, 0);
        const nextCreatedInCardId = getResolvedOwnerState(
          "createdInCard",
          current?.createdInCard?.id || null
        );
        const nextCreatedInBoardId = getResolvedOwnerState(
          "createdInBoard",
          current?.createdInBoard?.id || null
        );
        const hasCardAndBoardOwner =
          !!nextCreatedInCardId && !!nextCreatedInBoardId;
        const ownerValidationPassed =
          ownerCount === 1 || (ownerCount === 2 && hasCardAndBoardOwner);

        if (!ownerValidationPassed) {
          addValidationError(
            "MediaAsset must have exactly one createdIn* owner, except createdInCard + createdInBoard which are allowed together."
          );
        }
      }
    },
  },
  fields: {
    /** Original file name (without path), e.g. from upload */
    fileName: text(),
    /** User-facing customizable title */
    title: text(),
    /** Optional; may be null or incomplete (text() defaults to NOT NULL in Keystone unless db.isNullable is set). */
    description: text({
      db: { isNullable: true },
      validation: { isRequired: false },
    }),
    /** Keystone-managed uploaded image */
    image: image({ storage: "media_library_images" }),
    /** Legacy URL kept temporarily for backward compatibility/migration. */
    url: text({
      db: { isNullable: true },
      validation: { isRequired: false },
    }),
    /** Legacy Cloudinary public_id kept temporarily for migration/backfill only. */
    publicId: text({
      db: { isNullable: true },
      validation: { isRequired: false },
    }),
    settings: json(),
    createdInBoard: relationship({
      ref: "ProposalBoard",
    }),
    createdInCard: relationship({
      ref: "ProposalCard",
    }),
    createdInVizSection: relationship({
      ref: "VizSection",
    }),
    createdInResource: relationship({
      ref: "Resource",
    }),
    createdInStudy: relationship({
      ref: "Study",
    }),
    createdInAssignment: relationship({
      ref: "Assignment",
    }),
    createdInProfile: relationship({
      ref: "Profile",
    }),
    author: relationship({
      ref: "Profile.authoredMediaAssets",
      hooks: {
        async resolveInput({ context, operation, inputData }) {
          if (operation === "create") {
            return { connect: { id: context.session.itemId } };
          }
          return inputData.author;
        },
      },
    }),
    /** Profiles who marked this asset as a favorite */
    favoriteBy: relationship({
      ref: "Profile.favoritedMediaAssets",
      many: true,
    }),
    /** Proposal cards whose content references / displays this media */
    usedInCards: relationship({
      ref: "ProposalCard.mediaAssetsUsed",
      many: true,
    }),
    usedInBoards: relationship({
      ref: "ProposalBoard.mediaAssetsUsed",
      many: true,
    }),
    usedInVizSections: relationship({
      ref: "VizSection.mediaAssetsUsed",
      many: true,
    }),
    usedInResources: relationship({
      ref: "Resource.mediaAssetsUsed",
      many: true,
    }),
    usedInStudies: relationship({
      ref: "Study.mediaAssetsUsed",
      many: true,
    }),
    usedInAssignments: relationship({
      ref: "Assignment.mediaAssetsUsed",
      many: true,
    }),
    usedInProfiles: relationship({
      ref: "Profile.mediaAssetsUsed",
      many: true,
    }),
    createdAt: timestamp({
      defaultValue: { kind: "now" },
    }),
  },
});
