import gql from "graphql-tag";

export const CREATE_STUDY_VERSION = gql`
  mutation CREATE_STUDY_VERSION($input: StudyVersionCreateInput!) {
    createStudyVersion(data: $input) {
      id
      name
      createdAt
    }
  }
`;

export const UPDATE_STUDY_VERSION = gql`
  mutation UPDATE_STUDY_VERSION($id: ID!, $input: StudyVersionUpdateInput!) {
    updateStudyVersion(where: { id: $id }, data: $input) {
      id
      name
      description
      # returned so that starring a version updates the cached list in place
      isFavorite
    }
  }
`;

export const DELETE_STUDY_VERSION = gql`
  mutation DELETE_STUDY_VERSION($id: ID!) {
    deleteStudyVersion(where: { id: $id }) {
      id
    }
  }
`;
