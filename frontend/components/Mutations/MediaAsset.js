import gql from "graphql-tag";

export const MEDIA_LIBRARY_PROFILE_ID = gql`
  query MEDIA_LIBRARY_PROFILE_ID {
    authenticatedItem {
      ... on Profile {
        id
      }
    }
  }
`;

export const MEDIA_ASSETS = gql`
  query MEDIA_ASSETS($profileId: ID!) {
    mediaAssets(
      where: { author: { id: { equals: $profileId } } }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      fileName
      title
      description
      url
      image {
        id
        url
      }
      createdAt
      settings
      author {
        id
      }
      favoriteBy {
        id
      }
    }
  }
`;

export const CREATE_MEDIA_ASSET = gql`
  mutation CREATE_MEDIA_ASSET($data: MediaAssetCreateInput!) {
    createMediaAsset(data: $data) {
      id
      url
      image {
        id
        url
      }
      fileName
      title
    }
  }
`;

export const UPDATE_MEDIA_ASSET = gql`
  mutation UPDATE_MEDIA_ASSET($id: ID!, $data: MediaAssetUpdateInput!) {
    updateMediaAsset(where: { id: $id }, data: $data) {
      id
      fileName
      title
      description
      favoriteBy {
        id
      }
    }
  }
`;

export const DELETE_MEDIA_ASSET = gql`
  mutation DELETE_MEDIA_ASSET($id: ID!) {
    deleteMediaAsset(where: { id: $id }) {
      id
    }
  }
`;

function resolveInitialMediaTitle({ title, fileName }) {
  const fromTitle = typeof title === "string" ? title.trim() : "";
  if (fromTitle) return fromTitle;
  const fromFile = typeof fileName === "string" ? fileName.trim() : "";
  if (fromFile) return fromFile;
  return "image";
}

/**
 * @param {object} opts
 * @param {string} opts.scopeId - ProposalBoard id (fallback when `mediaLibrarySource` has no createdIn*)
 * @param {string} opts.fileName - base file name (no extension ok)
 * @param {string} [opts.title] - display title; defaults from fileName so it is always set when a name exists
 * @param {{ sourceType?: string | null, sourceId?: string | null, createdWith?: string | null }} [opts.mediaLibrarySource]
 * @param {string | null} [opts.mediaCreatedWithOverride] - e.g. "paste" when inserting from clipboard upload path
 * @param {string | null} [opts.mediaDisplayedInProposalCardId]
 * @param {string[] | null | undefined} [opts.usedInVizSectionIds] - VizSection ids (e.g. Data Journal widget id) for usedInVizSections
 */
function resolveCreatedInConnection(mediaLibrarySource) {
  const sourceType = mediaLibrarySource?.sourceType;
  const sourceId = mediaLibrarySource?.sourceId;
  if (!sourceType || !sourceId) return {};

  if (sourceType === "projectCard" || sourceType === "proposalCard") {
    return { createdInCard: { connect: { id: sourceId } } };
  }
  if (sourceType === "proposalBoard" || sourceType === "board") {
    return { createdInBoard: { connect: { id: sourceId } } };
  }
  if (sourceType === "vizSection") {
    return { createdInVizSection: { connect: { id: sourceId } } };
  }
  if (sourceType === "resource" || sourceType === "resourceContent") {
    return { createdInResource: { connect: { id: sourceId } } };
  }
  if (sourceType === "study") {
    return { createdInStudy: { connect: { id: sourceId } } };
  }
  if (sourceType === "assignment") {
    return { createdInAssignment: { connect: { id: sourceId } } };
  }
  if (sourceType === "profile") {
    return { createdInProfile: { connect: { id: sourceId } } };
  }

  return {};
}

/**
 * True when `mediaLibrarySource` supplies a createdIn* owner so `buildMediaAssetCreateData`
 * does not need `scopeId` as fallback `createdInBoard`.
 */
export function mediaCreateHasOwnerFromSource(mediaLibrarySource) {
  return (
    Object.keys(resolveCreatedInConnection(mediaLibrarySource || {})).length > 0
  );
}

export function buildMediaAssetCreateData({
  scopeId,
  fileName,
  title,
  mediaLibrarySource,
  mediaCreatedWithOverride = null,
  mediaDisplayedInProposalCardId,
  usedInVizSectionIds,
}) {
  const createdWith =
    mediaCreatedWithOverride ??
    mediaLibrarySource?.createdWith ??
    "upload";
  const settings = {
    createdWith,
  };
  const resolvedTitle = resolveInitialMediaTitle({ title, fileName });
  const resolvedFileName =
    (typeof fileName === "string" && fileName.trim()) || resolvedTitle;
  const createdInConnection = resolveCreatedInConnection(mediaLibrarySource);
  const data = {
    fileName: resolvedFileName,
    title: resolvedTitle,
    settings,
    ...(Object.keys(createdInConnection).length
      ? createdInConnection
      : { createdInBoard: { connect: { id: scopeId } } }),
  };
  if (mediaDisplayedInProposalCardId) {
    data.usedInCards = { connect: [{ id: mediaDisplayedInProposalCardId }] };
  }
  const vizIds = Array.isArray(usedInVizSectionIds)
    ? usedInVizSectionIds.filter((x) => typeof x === "string" && String(x).trim())
    : [];
  if (vizIds.length) {
    data.usedInVizSections = {
      connect: vizIds.map((x) => ({ id: String(x).trim() })),
    };
  }
  return data;
}

export function resolveMediaAssetUrl(asset) {
  return asset?.image?.url || asset?.url || "";
}
