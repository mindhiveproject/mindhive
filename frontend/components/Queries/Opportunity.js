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
          classNetworks {
            id
            title
          }
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
      videoUrl
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
      createdAt
      updatedAt
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
