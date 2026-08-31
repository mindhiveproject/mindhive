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

export const TEACHER_STUDENT_BALLOT_VIEW = gql`
  query TEACHER_STUDENT_BALLOT_VIEW($roundId: ID!) {
    connectRound(where: { id: $roundId }) {
      id
      title
      status
      matchingAlgorithm
      studentAssessmentFormDefinition {
        id
        title
        status
        version
      }
      classNetwork {
        id
      }
      opportunities {
        id
        title
        studentCapacity
        teamSize
        allowsTeamPreferences
      }
      questions {
        id
        prompt
        questionType
        order
        status
      }
      preferences {
        id
        status
        notes
        submittedAt
        assessmentData
        submitter {
          id
          username
          firstName
          lastName
        }
        items {
          id
          rank
          starRating
          comment
          opportunity {
            id
            title
          }
        }
      }
      teamPreferences {
        id
        priority
        opportunity {
          id
          allowsTeamPreferences
          teamSize
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
      }
      questionAnswers {
        id
        answer
        question {
          id
          prompt
          questionType
        }
        respondent {
          id
        }
        opportunity {
          id
        }
      }
      matches {
        id
        status
        student {
          id
        }
        opportunity {
          id
          title
        }
      }
    }
  }
`;
