import gql from "graphql-tag";

export const MY_CONNECT_ROUNDS = gql`
  query MY_CONNECT_ROUNDS {
    authenticatedItem {
      ... on Profile {
        id
        connectRoundsCreated(orderBy: { createdAt: desc }) {
          id
          title
          description
          status
          openAt
          closeAt
          publishedAt
          matchingAlgorithm
          classNetwork {
            id
            title
          }
          opportunities {
            id
            title
            status
          }
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const GET_CONNECT_ROUND = gql`
  query GET_CONNECT_ROUND($id: ID!) {
    connectRound(where: { id: $id }) {
      id
      title
      description
      status
      openAt
      closeAt
      publishedAt
      matchingAlgorithm
      settings
      classNetwork {
        id
        title
      }
      opportunities {
        id
        title
        shortDescription
        status
        studentCapacity
        teamSize
      }
      questions {
        id
        prompt
        questionType
        status
        isRequired
        weight
      }
      createdBy {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

export const NETWORK_OPPORTUNITIES_FOR_ROUND = gql`
  query NETWORK_OPPORTUNITIES_FOR_ROUND($classNetworkId: ID!) {
    opportunities(
      where: {
        classNetworks: { some: { id: { equals: $classNetworkId } } }
      }
    ) {
      id
      title
      shortDescription
      status
      studentCapacity
      teamSize
      mentor {
        id
        username
        firstName
        lastName
      }
    }
  }
`;
