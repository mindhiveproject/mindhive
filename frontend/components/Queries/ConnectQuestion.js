import gql from "graphql-tag";

export const QUESTION_LIBRARY = gql`
  query QUESTION_LIBRARY {
    connectQuestions(
      where: { scope: { equals: "library" } }
      orderBy: { createdAt: desc }
    ) {
      id
      prompt
      helperText
      questionType
      options
      status
      weight
      isRequired
      order
      proposedBy {
        id
        username
        firstName
        lastName
      }
      approvedBy {
        id
        username
      }
      createdAt
    }
  }
`;

export const GET_QUESTION = gql`
  query GET_QUESTION($id: ID!) {
    connectQuestion(where: { id: $id }) {
      id
      prompt
      helperText
      questionType
      options
      scope
      status
      reviewNotes
      weight
      matchingRules
      isRequired
      order
      rounds {
        id
        title
      }
      opportunity {
        id
        title
      }
      proposedBy {
        id
        username
        firstName
        lastName
      }
      approvedBy {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

export const QUESTIONS_FOR_ROUND = gql`
  query QUESTIONS_FOR_ROUND($roundId: ID!) {
    connectQuestions(
      where: { rounds: { some: { id: { equals: $roundId } } } }
      orderBy: { order: asc }
    ) {
      id
      prompt
      helperText
      questionType
      options
      status
      isRequired
      order
    }
  }
`;

export const QUESTIONS_FOR_OPPORTUNITY = gql`
  query QUESTIONS_FOR_OPPORTUNITY($opportunityId: ID!) {
    connectQuestions(
      where: { opportunity: { id: { equals: $opportunityId } } }
      orderBy: { order: asc }
    ) {
      id
      prompt
      helperText
      questionType
      options
      status
      isRequired
      order
    }
  }
`;
