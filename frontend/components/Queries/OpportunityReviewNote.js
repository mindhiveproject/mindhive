import { gql } from "@apollo/client";

// Everything the review-mode opportunity view needs in a single round-
// trip: the opportunity (read-only), its mentor + organization (for
// conflict-flag detection), the round (to verify the viewer is on its
// reviewer list), and the review notes scoped to this (opp, round) pair.
export const REVIEW_OPPORTUNITY = gql`
  query REVIEW_OPPORTUNITY($oppId: ID!, $roundId: ID!) {
    opportunity(where: { id: $oppId }) {
      id
      title
      shortDescription
      description
      status
      projectCategory
      projectCategoryOther
      coverImage {
        url
      }
      coverImageUrl
      videoUrl
      videoFile {
        url
        filename
      }
      availableFrom
      availableTo
      timeCommitment
      studentCapacity
      teamSize
      preferGroupFormat
      preferGradeLevels
      preferClassType
      scopeDescription
      potentialActivities
      specificSkills
      proposalData
      extraDetails
      mentor {
        id
        firstName
        lastName
        username
        email
      }
      organization {
        id
        name
        mission
        website
        logo {
          url
        }
      }
      rounds(where: { id: { equals: $roundId } }) {
        id
        title
        status
        openAt
        closeAt
        createdBy {
          id
          username
        }
        reviewers {
          id
        }
      }
      reviewNotes(
        where: { round: { id: { equals: $roundId } } }
        orderBy: { createdAt: desc }
      ) {
        id
        body
        createdAt
        updatedAt
        author {
          id
          username
          firstName
          lastName
        }
      }
    }
  }
`;
