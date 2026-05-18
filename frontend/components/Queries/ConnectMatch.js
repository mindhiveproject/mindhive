import gql from "graphql-tag";

export const ROUND_MATCH_VIEW = gql`
  query ROUND_MATCH_VIEW($roundId: ID!) {
    connectRound(where: { id: $roundId }) {
      id
      title
      status
      matchingAlgorithm
      classNetwork {
        id
        title
      }
      opportunities {
        id
        title
        studentCapacity
        teamSize
        mentor {
          id
          username
          firstName
          lastName
        }
      }
      matches(orderBy: { matchScore: desc }) {
        id
        status
        matchScore
        teacherNotes
        student {
          id
          username
          firstName
          lastName
        }
        opportunity {
          id
        }
        proposedAt
        activatedAt
        completedAt
      }
      preferences {
        id
        status
        submitter {
          id
          username
          firstName
          lastName
        }
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
      teamPreferences {
        id
        opportunity {
          id
        }
        submitter {
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
    }
  }
`;
