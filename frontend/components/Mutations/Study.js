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
    }
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
