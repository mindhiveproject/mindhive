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
            admins {
              id
            }
          }
          opportunities {
            id
            title
            status
          }
          createdAt
          updatedAt
        }
        connectRoundsReviewing(orderBy: { updatedAt: desc }) {
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
            admins {
              id
            }
          }
          opportunities {
            id
            title
            status
          }
          createdAt
          updatedAt
        }
        adminOfClassNetworks {
          id
          title
          connectRounds(orderBy: { createdAt: desc }) {
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
              admins {
                id
              }
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
        admins {
          id
        }
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
      reviewers {
        id
        username
        firstName
        lastName
        email
      }
      createdAt
      updatedAt
    }
  }
`;

// Rounds the current user is assigned to as a reviewer, with their
// opportunities (grouped client-side by status in the review queue).
export const MY_REVIEW_QUEUE = gql`
  query MY_REVIEW_QUEUE {
    authenticatedItem {
      ... on Profile {
        id
        connectRoundsReviewing(orderBy: { updatedAt: desc }) {
          id
          title
          description
          status
          openAt
          closeAt
          classNetwork {
            id
            title
          }
          createdBy {
            id
            firstName
            lastName
            username
          }
          opportunities {
            id
            title
            shortDescription
            status
            updatedAt
            mentor {
              id
              firstName
              lastName
              username
            }
            organization {
              id
              name
            }
          }
        }
      }
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
      availableFrom
      availableTo
      timeCommitment
      coverImageUrl
      coverImage {
        url
      }
      mentor {
        id
        username
        firstName
        lastName
      }
      organization {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;
