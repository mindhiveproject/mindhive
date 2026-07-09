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
      projectCategory
      projectCategoryOther
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
      organization {
        id
        name
        tagline
        department
        website
        location
        mission
        primaryDomain
        verified
        logo {
          url
        }
      }
      proposalData
      # Legacy fallbacks for proposalData migration (editor only)
      issueRelevance
      specialConsiderations
      guidelinesAcknowledged
      guidelinesAcknowledgedAt
      requestsAppointment
      acceptedAt
      preSelectedAt
      reviewedBy {
        id
        firstName
        lastName
        username
      }
      # Post-acceptance / workflow (follow-up TBD)
      scopeDescription
      potentialActivities
      specificSkills
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
      projectCategory
      projectCategoryOther
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
        email
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
      organization {
        id
        name
        tagline
        department
        website
        location
        mission
        primaryDomain
        verified
        logo {
          url
        }
      }
      classNetworks {
        id
        title
      }
      proposalData
      # Post-acceptance details
      scopeDescription
      potentialActivities
      specificSkills
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

export const MY_MEMBER_CLASS_NETWORKS_FOR_OPPORTUNITY = gql`
  query MY_MEMBER_CLASS_NETWORKS_FOR_OPPORTUNITY {
    authenticatedItem {
      ... on Profile {
        memberOfClassNetworks {
          id
          title
        }
        organizations {
          memberOfClassNetworks {
            id
            title
          }
        }
      }
    }
  }
`;

export const OPPORTUNITY_EDITOR_CLASS_NETWORKS = gql`
  query OPPORTUNITY_EDITOR_CLASS_NETWORKS {
    authenticatedItem {
      ... on Profile {
        memberOfClassNetworks {
          id
          title
        }
        organizations {
          memberOfClassNetworks {
            id
            title
          }
        }
      }
    }
  }
`;

// Teacher review queue — client filters by classNetworks overlap with reviewer.
export const PENDING_OPPORTUNITIES_FOR_REVIEW = gql`
  query PENDING_OPPORTUNITIES_FOR_REVIEW {
    opportunities(
      where: {
        status: { in: ["pending_review", "pre_selected", "accepted"] }
      }
      orderBy: { updatedAt: desc }
    ) {
      id
      title
      shortDescription
      status
      updatedAt
      preSelectedAt
      acceptedAt
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
      classNetworks {
        id
        title
      }
    }
  }
`;
