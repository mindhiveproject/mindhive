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
  query MEDIA_ASSETS($scopeId: ID!) {
    mediaAssets(
      where: { board: { id: { equals: $scopeId } } }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      fileName
      title
      description
      url
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
 * @param {string} opts.scopeId - ProposalBoard id
 * @param {string} opts.fileName - base file name (no extension ok)
 * @param {string} opts.url
 * @param {string} [opts.publicId]
 * @param {string} [opts.title] - display title; defaults from fileName so it is always set when a name exists
 * @param {{ sourceType?: string | null, sourceId?: string | null, createdWith?: string | null }} [opts.mediaLibrarySource]
 * @param {string | null} [opts.mediaCreatedWithOverride] - e.g. "paste" when inserting from clipboard upload path
 * @param {string | null} [opts.mediaDisplayedInProposalCardId]
 */
export function buildMediaAssetCreateData({
  scopeId,
  fileName,
  url,
  publicId,
  title,
  mediaLibrarySource,
  mediaCreatedWithOverride = null,
  mediaDisplayedInProposalCardId,
}) {
  const createdWith =
    mediaCreatedWithOverride ??
    mediaLibrarySource?.createdWith ??
    "upload";
  const settings = {
    sourceType: mediaLibrarySource?.sourceType ?? null,
    sourceId: mediaLibrarySource?.sourceId ?? null,
    createdWith,
  };
  const resolvedTitle = resolveInitialMediaTitle({ title, fileName });
  const resolvedFileName =
    (typeof fileName === "string" && fileName.trim()) || resolvedTitle;
  const data = {
    fileName: resolvedFileName,
    title: resolvedTitle,
    url,
    publicId: publicId || undefined,
    board: { connect: { id: scopeId } },
    settings,
  };
  if (mediaDisplayedInProposalCardId) {
    data.displayedIn = { connect: [{ id: mediaDisplayedInProposalCardId }] };
  }
  return data;
}
