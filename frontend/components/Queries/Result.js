import gql from "graphql-tag";

// get results of users and guests
export const GET_PARTICIPANT_RESULTS = gql`
  query GET_PARTICIPANT_RESULTS($participantId: String!, $studyId: ID!) {
    datasets(
      where: {
        OR: [
          { profile: { publicId: { equals: $participantId } } }
          { guest: { publicId: { equals: $participantId } } }
        ]
        study: { id: { equals: $studyId } }
      }
    ) {
      id
      token
      date
      task {
        title
      }
      study {
        title
      }
      dataPolicy
      info
      isCompleted
      isIncluded
      createdAt
      completedAt
    }
  }
`;

// get user results
export const GET_USER_RESULTS = gql`
  query GET_USER_RESULTS($id: String!) {
    profile(where: { publicId: $id }) {
      id
      publicId
      publicReadableId
      type
      info
      generalInfo
      studiesInfo
      participantIn {
        id
        title
        slug
      }
      datasets {
        id
        token
        task {
          title
        }
        dataPolicy
        info
        isCompleted
        isIncluded
        createdAt
        completedAt
      }
    }
  }
`;

// get guest results
export const GET_GUEST_RESULTS = gql`
  query GET_GUEST_RESULTS($id: String!) {
    guest(where: { publicId: $id }) {
      id
      publicId
      publicReadableId
      type
      info
      generalInfo
      studiesInfo
      participantIn {
        id
        title
        slug
      }
      datasets {
        id
        token
        task {
          title
        }
        dataPolicy
        info
        isCompleted
        isIncluded
        createdAt
        completedAt
      }
    }
  }
`;
