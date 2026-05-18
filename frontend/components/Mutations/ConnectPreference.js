import gql from "graphql-tag";

export const CREATE_PREFERENCE = gql`
  mutation CREATE_PREFERENCE($input: ConnectPreferenceCreateInput!) {
    createConnectPreference(data: $input) {
      id
      status
    }
  }
`;

export const UPDATE_PREFERENCE = gql`
  mutation UPDATE_PREFERENCE($id: ID!, $input: ConnectPreferenceUpdateInput!) {
    updateConnectPreference(where: { id: $id }, data: $input) {
      id
      status
    }
  }
`;

export const DELETE_PREFERENCE_ITEMS = gql`
  mutation DELETE_PREFERENCE_ITEMS(
    $where: [ConnectPreferenceItemWhereUniqueInput!]!
  ) {
    deleteConnectPreferenceItems(where: $where) {
      id
    }
  }
`;

export const DELETE_TEAM_PREFERENCES = gql`
  mutation DELETE_TEAM_PREFERENCES(
    $where: [ConnectTeamPreferenceWhereUniqueInput!]!
  ) {
    deleteConnectTeamPreferences(where: $where) {
      id
    }
  }
`;

export const CREATE_TEAM_PREFERENCES = gql`
  mutation CREATE_TEAM_PREFERENCES(
    $data: [ConnectTeamPreferenceCreateInput!]!
  ) {
    createConnectTeamPreferences(data: $data) {
      id
    }
  }
`;

export const DELETE_QUESTION_ANSWERS = gql`
  mutation DELETE_QUESTION_ANSWERS(
    $where: [QuestionAnswerWhereUniqueInput!]!
  ) {
    deleteQuestionAnswers(where: $where) {
      id
    }
  }
`;

export const CREATE_QUESTION_ANSWERS = gql`
  mutation CREATE_QUESTION_ANSWERS($data: [QuestionAnswerCreateInput!]!) {
    createQuestionAnswers(data: $data) {
      id
    }
  }
`;
