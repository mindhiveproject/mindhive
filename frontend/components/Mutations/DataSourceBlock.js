import gql from "graphql-tag";

// Link a catalog block into a study.
export const CREATE_STUDY_DATA_SOURCE = gql`
  mutation CREATE_STUDY_DATA_SOURCE($data: StudyDataSourceCreateInput!) {
    createStudyDataSource(data: $data) {
      id
    }
  }
`;

// Order, scope, label and per-instance settings all go through here. Returns
// the changed fields (rather than just `id`) so Apollo's normalized cache
// updates every open query watching this StudyDataSource — the settings panel
// and the persistent panel/link modal read the same rows without a refetch.
export const UPDATE_STUDY_DATA_SOURCE = gql`
  mutation UPDATE_STUDY_DATA_SOURCE(
    $id: ID!
    $data: StudyDataSourceUpdateInput!
  ) {
    updateStudyDataSource(where: { id: $id }, data: $data) {
      id
      label
      order
      inputBindings
      settings
      scope
    }
  }
`;

export const DELETE_STUDY_DATA_SOURCE = gql`
  mutation DELETE_STUDY_DATA_SOURCE($id: ID!) {
    deleteStudyDataSource(where: { id: $id }) {
      id
    }
  }
`;

// Upserts the current participant's aggregate record for a study — the
// AggregateRecorder's running snapshot, sent on every step close and once
// more when the participant finishes or leaves. `guestPublicId` is omitted
// for a signed-in participant, whose identity comes from the session cookie.
export const SAVE_STUDY_DATA_SOURCE_RECORD = gql`
  mutation SAVE_STUDY_DATA_SOURCE_RECORD(
    $studyId: ID!
    $guestPublicId: String
    $steps: JSON
    $session: JSON
  ) {
    saveStudyDataSourceRecord(
      studyId: $studyId
      guestPublicId: $guestPublicId
      steps: $steps
      session: $session
    )
  }
`;
