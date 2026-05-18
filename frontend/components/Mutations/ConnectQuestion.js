import gql from "graphql-tag";

export const CREATE_QUESTION = gql`
  mutation CREATE_QUESTION($input: ConnectQuestionCreateInput!) {
    createConnectQuestion(data: $input) {
      id
      prompt
      scope
      status
    }
  }
`;

export const UPDATE_QUESTION = gql`
  mutation UPDATE_QUESTION($id: ID!, $input: ConnectQuestionUpdateInput!) {
    updateConnectQuestion(where: { id: $id }, data: $input) {
      id
      prompt
      scope
      status
    }
  }
`;

export const DELETE_QUESTION = gql`
  mutation DELETE_QUESTION($id: ID!) {
    deleteConnectQuestion(where: { id: $id }) {
      id
    }
  }
`;

export const SUBMIT_QUESTION_ANSWERS = gql`
  mutation SUBMIT_QUESTION_ANSWERS(
    $answers: [QuestionAnswerCreateInput!]!
  ) {
    createQuestionAnswers(data: $answers) {
      id
      question {
        id
      }
    }
  }
`;
