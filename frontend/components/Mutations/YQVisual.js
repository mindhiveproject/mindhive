import gql from "graphql-tag";

export const CREATE_VISUAL = gql`
  mutation CREATE_VISUAL($data: VisualCreateInput!) {
    createVisual(data: $data) {
      id
      title
    }
  }
`;

export const UPDATE_VISUAL = gql`
  mutation UPDATE_VISUAL($id: ID!, $data: VisualUpdateInput!) {
    updateVisual(where: { id: $id }, data: $data) {
      id
      title
      description
      privacy
      published
      participationMode
      docs
      docsVisible
      parameters
      lastTimeEdited
      collaborators {
        id
        username
      }
      viewers {
        id
        username
      }
    }
  }
`;

export const DELETE_VISUAL = gql`
  mutation DELETE_VISUAL($id: ID!) {
    deleteVisual(where: { id: $id }) {
      id
    }
  }
`;

export const CREATE_VISUAL_CODE_FILE = gql`
  mutation CREATE_VISUAL_CODE_FILE($data: VisualCodeFileCreateInput!) {
    createVisualCodeFile(data: $data) {
      id
      name
      language
      role
      order
      content
      lastTimeEdited
    }
  }
`;

export const UPDATE_VISUAL_CODE_FILE = gql`
  mutation UPDATE_VISUAL_CODE_FILE($id: ID!, $data: VisualCodeFileUpdateInput!) {
    updateVisualCodeFile(where: { id: $id }, data: $data) {
      id
      name
      content
      lastTimeEdited
    }
  }
`;

export const DELETE_VISUAL_CODE_FILE = gql`
  mutation DELETE_VISUAL_CODE_FILE($id: ID!) {
    deleteVisualCodeFile(where: { id: $id }) {
      id
    }
  }
`;
