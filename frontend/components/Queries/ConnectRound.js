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
      formDefinitions {
        id
        title
        key
        scope
        version
        createdBy {
          id
        }
      }
      studentAssessmentFormDefinition {
        id
        title
        key
        scope
        status
        version
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
            sponsors {
              id
              firstName
              lastName
              username
            }
            mentors {
              id
              firstName
              lastName
              username
            }
            sponsorIsMentor
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
        status: { in: ["pending_review", "returned", "pre_selected", "accepted"] }
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
      requestsAppointment
      coverImageUrl
      coverImage {
        url
        extension
      }
      sponsors {
        id
        username
        firstName
        lastName
      }
      mentors {
        id
        username
        firstName
        lastName
      }
      sponsorIsMentor
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
      proposalData
      videoUrl
      videoFile {
        url
        filename
        filesize
      }
      reviewNotes {
        id
        kind
        createdAt
        round {
          id
        }
        readBy {
          id
        }
      }
    }
  }
`;

/** Student class Opportunities tab: rounds + selected opportunities for class networks. */
export const CLASS_STUDENT_OPPORTUNITIES = gql`
  query CLASS_STUDENT_OPPORTUNITIES($code: String!) {
    class(where: { code: $code }) {
      id
      networks {
        id
        title
        connectRounds(orderBy: { createdAt: desc }) {
          id
          title
          status
          openAt
          closeAt
          settings
          opportunities {
            id
            title
            shortDescription
            projectCategory
            projectCategoryOther
            timeCommitment
            availableFrom
            availableTo
            studentCapacity
            coverImageUrl
            coverImage {
              id
              url
            }
            sponsors {
              id
              username
              firstName
              lastName
            }
            mentors {
              id
              username
              firstName
              lastName
            }
            sponsorIsMentor
            mentor {
              id
              username
              firstName
              lastName
            }
            organization {
              id
              name
              logo {
                url
              }
            }
          }
        }
      }
    }
    authenticatedItem {
      ... on Profile {
        id
        connectPreferences(
          where: {
            round: {
              classNetwork: {
                classes: { some: { code: { equals: $code } } }
              }
            }
          }
        ) {
          id
          status
          submittedAt
          round {
            id
          }
          items {
            id
            opportunity {
              id
            }
          }
        }
      }
    }
  }
`;
