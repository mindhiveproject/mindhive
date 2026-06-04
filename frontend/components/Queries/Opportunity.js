import gql from "graphql-tag";

export const MY_OPPORTUNITIES = gql`
  query MY_OPPORTUNITIES {
    authenticatedItem {
      ... on Profile {
        id
        opportunitiesCreated {
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
            id
            url
            width
            height
          }
          classNetworks {
            id
            title
          }
          publicRatingAverage
          publicRatingCount
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const GET_OPPORTUNITY = gql`
  query GET_OPPORTUNITY($id: ID!) {
    opportunity(where: { id: $id }) {
      id
      title
      shortDescription
      description
      coverImageUrl
      coverImage {
        id
        url
        width
        height
        extension
      }
      videoUrl
      videoFile {
        url
        filename
        filesize
      }
      availableFrom
      availableTo
      timeCommitment
      studentCapacity
      teamSize
      allowsTeamPreferences
      preferGradeLevels
      preferGroupFormat
      preferClassType
      status
      extraDetails
      classNetworks {
        id
        title
      }
      mentor {
        id
        username
        firstName
        lastName
      }
      # CUSP capstone fields
      sponsorIsMentor
      mentorNotes
      researchQuestion
      relevance
      dataRequirements
      backgroundMethodology
      dataSecurityConcerns
      dataSecurityNotes
      techRequirements
      fieldWorkLikelihood
      competencies
      learningOutcomes
      relevantLinks
      additionalNotes
      guidelinesAcknowledged
      guidelinesAcknowledgedAt
      requestsAppointment
      createdAt
      updatedAt
    }
  }
`;

// Lightweight context used by the Explore list: which networks the current
// user is in (for the network filter), and which opportunities the user has
// favorited (for the heart toggles + favorites-only filter).
export const EXPLORE_CONTEXT = gql`
  query EXPLORE_CONTEXT {
    authenticatedItem {
      ... on Profile {
        id
        favoriteOpportunities {
          id
        }
        studentIn {
          id
          networks {
            id
            title
          }
        }
        mentorIn {
          id
          networks {
            id
            title
          }
        }
        teacherIn {
          id
          networks {
            id
            title
          }
        }
      }
    }
  }
`;

// Server-side paginated list of opportunities filtered by network membership.
// The frontend builds the where clause from EXPLORE_CONTEXT (network IDs) and
// any active filters (search, solo/team, favorites-only).
export const EXPLORE_OPPORTUNITIES_PAGED = gql`
  query EXPLORE_OPPORTUNITIES_PAGED(
    $where: OpportunityWhereInput!
    $take: Int!
    $skip: Int!
  ) {
    opportunities(
      where: $where
      take: $take
      skip: $skip
      orderBy: { createdAt: desc }
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
        width
        height
      }
      videoUrl
      videoFile {
        url
      }
      publicRatingAverage
      publicRatingCount
      mentor {
        id
        username
        firstName
        lastName
      }
      classNetworks {
        id
        title
      }
    }
    opportunitiesCount(where: $where)
  }
`;

// Full detail for one opportunity. Reuses the existing GET_OPPORTUNITY shape
// plus a few extras (mentor bio, public ratings list).
export const EXPLORE_OPPORTUNITY_DETAIL = gql`
  query EXPLORE_OPPORTUNITY_DETAIL($id: ID!) {
    opportunity(where: { id: $id }) {
      id
      title
      shortDescription
      description
      status
      coverImageUrl
      coverImage {
        url
        width
        height
      }
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
      allowsTeamPreferences
      preferGradeLevels
      preferGroupFormat
      preferClassType
      publicRatingAverage
      publicRatingCount
      mentor {
        id
        username
        firstName
        lastName
        bio
        tagline
        organization
        department
        primaryDomain
        timeCommitment
        publicReadableId
        image {
          keystoneImage {
            url
          }
          image {
            publicUrlTransformed
          }
        }
      }
      classNetworks {
        id
        title
      }
      # CUSP capstone fields (read-only display for students)
      sponsorIsMentor
      mentorNotes
      researchQuestion
      relevance
      dataRequirements
      backgroundMethodology
      dataSecurityConcerns
      dataSecurityNotes
      techRequirements
      fieldWorkLikelihood
      competencies
      learningOutcomes
      relevantLinks
      additionalNotes
      ratings(
        where: { isPublic: { equals: true } }
        orderBy: { createdAt: desc }
      ) {
        id
        opportunityRating
        feedback
        createdAt
        rater {
          id
          username
          firstName
          lastName
        }
      }
    }
    # Sibling fetches: the current user's favorites + any active matching
    # rounds that include this opportunity AND belong to a network the user is
    # a student in. Frontend collapses these into "active round CTA" + "is
    # this favorited?".
    authenticatedItem {
      ... on Profile {
        id
        favoriteOpportunities {
          id
        }
        studentIn {
          id
          networks {
            id
            connectRounds(
              where: {
                status: { equals: "preferences_open" }
                opportunities: { some: { id: { equals: $id } } }
              }
            ) {
              id
              title
              openAt
              closeAt
              classNetwork {
                id
                title
              }
            }
          }
        }
      }
    }
  }
`;

export const MY_MENTOR_MATCHES = gql`
  query MY_MENTOR_MATCHES {
    authenticatedItem {
      ... on Profile {
        id
        opportunitiesCreated(orderBy: { createdAt: desc }) {
          id
          title
          shortDescription
          status
          studentCapacity
          teamSize
          coverImageUrl
          coverImage {
            url
          }
          matches(orderBy: { proposedAt: desc }) {
            id
            status
            matchScore
            activatedAt
            completedAt
            student {
              id
              username
              firstName
              lastName
              email
              image {
                keystoneImage {
                  url
                }
                image {
                  publicUrlTransformed
                }
              }
            }
            ratings {
              id
              raterRole
              rater {
                id
              }
              mentorRating
              feedback
              tags
              isPublic
              createdAt
            }
          }
        }
      }
    }
  }
`;

export const MY_CLASS_NETWORKS_FOR_OPPORTUNITY = gql`
  query MY_CLASS_NETWORKS_FOR_OPPORTUNITY {
    classNetworks {
      id
      title
    }
  }
`;
