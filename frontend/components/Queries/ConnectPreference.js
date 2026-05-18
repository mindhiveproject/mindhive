import gql from "graphql-tag";

export const MY_PARTICIPATING_ROUNDS = gql`
  query MY_PARTICIPATING_ROUNDS {
    authenticatedItem {
      ... on Profile {
        id
        studentIn {
          id
          title
          networks {
            id
            connectRounds(orderBy: { createdAt: desc }) {
              id
              title
              description
              status
              openAt
              closeAt
              publishedAt
              classNetwork {
                id
                title
              }
              opportunities {
                id
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_PARTICIPATE_VIEW = gql`
  query GET_PARTICIPATE_VIEW($roundId: ID!) {
    connectRound(where: { id: $roundId }) {
      id
      title
      description
      status
      openAt
      closeAt
      classNetwork {
        id
        title
        classes {
          id
          students {
            id
            username
            firstName
            lastName
          }
        }
      }
      questions {
        id
        prompt
        helperText
        questionType
        options
        isRequired
        order
        status
      }
      opportunities {
        id
        title
        shortDescription
        coverImageUrl
        videoUrl
        timeCommitment
        studentCapacity
        teamSize
        allowsTeamPreferences
        mentor {
          id
          username
          firstName
          lastName
        }
        questions {
          id
          prompt
          helperText
          questionType
          options
          isRequired
          order
          status
        }
      }
    }
    authenticatedItem {
      ... on Profile {
        id
        connectPreferences(
          where: { round: { id: { equals: $roundId } } }
        ) {
          id
          status
          notes
          submittedAt
          items {
            id
            opportunity {
              id
            }
            rank
            starRating
            comment
          }
        }
        teamPreferencesSubmitted(
          where: { round: { id: { equals: $roundId } } }
        ) {
          id
          opportunity {
            id
          }
          preferredTeammate {
            id
            username
            firstName
            lastName
          }
          priority
        }
        questionAnswers(
          where: { round: { id: { equals: $roundId } } }
        ) {
          id
          question {
            id
          }
          opportunity {
            id
          }
          answer
        }
        connectMatches(
          where: {
            round: { id: { equals: $roundId } }
            status: { in: ["active", "completed", "proposed"] }
          }
        ) {
          id
          status
          matchScore
          activatedAt
          completedAt
          opportunity {
            id
            title
            shortDescription
            mentor {
              id
              username
              firstName
              lastName
            }
          }
          ratings {
            id
            rater {
              id
            }
            opportunityRating
            feedback
            isPublic
          }
        }
      }
    }
  }
`;
