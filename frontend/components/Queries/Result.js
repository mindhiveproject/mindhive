import gql from "graphql-tag";

// get proposal templates
export const GET_PARTICIPANT_RESULTS = gql`
  query GET_PARTICIPANT_RESULTS($participantId: ID!, $studyId: ID!) {
    results(
        where: {
            
        }
        participantId: $participantId, studyId: $studyId) {
      id
      task {
        title
      }
      quantity
      data
      dataPolicy
      token
      createdAt
      updatedAt
      payload
      study {
        title
      }
      info
      incrementalData {
        id
      }
      fullData {
        id
      }
      resultType
    }
  }
`;
