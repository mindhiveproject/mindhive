import gql from "graphql-tag";

export const CREATE_STUDY = gql`
  mutation CREATE_STUDY($input: StudyCreateInput!) {
    createStudy(data: $input) {
      id
    }
  }
`;

export const UPDATE_STUDY = gql`
  mutation UPDATE_STUDY($id: ID!, $input: StudyUpdateInput!) {
    updateStudy(where: { id: $id }, data: $input) {
      id
      # returned so that changing the data collection version updates the
      # cached study in every builder without a refetch
      currentVersion
    }
  }
`;

// count the between-subjects conditions a participant was assigned to
// (participants cannot update the study itself)
export const RECORD_STUDY_CONDITIONS = gql`
  mutation RECORD_STUDY_CONDITIONS($studyId: ID!, $conditionLabels: [String!]!) {
    recordStudyConditions(studyId: $studyId, conditionLabels: $conditionLabels)
  }
`;

// change the author of a study
export const CHANGE_STUDY_AUTHOR = gql`
  mutation CHANGE_STUDY_AUTHOR($studyId: ID!, $authorId: ID!) {
    updateStudy(
      where: { id: $studyId }
      data: { author: { connect: { id: $authorId } } }
    ) {
      id
    }
  }
`;

// remove (hide) study by author
export const HIDE_STUDY = gql`
  mutation HIDE_STUDY($id: ID!) {
    updateStudy(where: { id: $id }, data: { isHidden: true }) {
      id
    }
  }
`;

// archive the study
export const ARCHIVE_STUDY = gql`
  mutation ARCHIVE_STUDY($study: ID!, $isArchived: Boolean!) {
    archiveStudy(study: $study, isArchived: $isArchived) {
      id
    }
  }
`;
