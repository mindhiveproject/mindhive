import gql from "graphql-tag";

// list of the snapshots of a study, without the diagrams:
// a study can accumulate hundreds of snapshots, so the diagram of a single
// snapshot is only fetched when it is about to be loaded on the canvas
export const STUDY_VERSIONS = gql`
  query STUDY_VERSIONS($studyId: ID!) {
    studyVersions(
      where: { study: { id: { equals: $studyId } } }
      orderBy: { createdAt: desc }
    ) {
      id
      name
      description
      isFavorite
      legacyId
      createdAt
      createdBy {
        id
        username
      }
    }
  }
`;

// the diagram of one snapshot, fetched when the user loads it
export const STUDY_VERSION_DIAGRAM = gql`
  query STUDY_VERSION_DIAGRAM($id: ID!) {
    studyVersion(where: { id: $id }) {
      id
      name
      diagram
      flow
    }
  }
`;

// the most recent snapshot, used on save to decide whether the study design
// has changed and a new snapshot has to be created
export const LATEST_STUDY_VERSION = gql`
  query LATEST_STUDY_VERSION($studyId: ID!) {
    studyVersions(
      where: { study: { id: { equals: $studyId } } }
      orderBy: { createdAt: desc }
      take: 1
    ) {
      id
      name
      diagram
    }
    studyVersionsCount(where: { study: { id: { equals: $studyId } } })
  }
`;

// how many collected datasets are stamped with this version, used to protect
// the version labels of the collected data from deletion. The datasets that
// were collected before the versions were moved into their own list refer to
// the version by its legacy id, so both ids are counted.
export const DATASETS_USING_STUDY_VERSION = gql`
  query DATASETS_USING_STUDY_VERSION($studyId: ID!, $versionIds: [String!]!) {
    datasetsCount(
      where: {
        study: { id: { equals: $studyId } }
        studyVersion: { in: $versionIds }
      }
    )
  }
`;
