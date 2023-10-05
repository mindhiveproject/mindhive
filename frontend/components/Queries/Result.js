import gql from "graphql-tag";

// get results
export const GET_PARTICIPANT_RESULTS = gql`
  query GET_PARTICIPANT_RESULTS($participantId: ID!, $studyId: ID!) {
    datasets(
        where: {
          profile: { id: { equals: $participantId } }, 
          study: { id: { equals: $studyId } }
        }) {
      id
      token
      task {
        title
      }
      dataPolicy
      info
      isCompleted
      createdAt
      updatedAt
    }
  }
`;
