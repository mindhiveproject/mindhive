import gql from "graphql-tag";

export const CREATE_OPPORTUNITY = gql`
  mutation CREATE_OPPORTUNITY(
    $title: String!
    $shortDescription: String
    $description: String
    $coverImageUrl: String
    $videoUrl: String
    $classNetworks: [ClassNetworkWhereUniqueInput!]
    $availableFrom: DateTime
    $availableTo: DateTime
    $timeCommitment: String
    $studentCapacity: Int
    $teamSize: Int
    $allowsTeamPreferences: Boolean
    $preferGradeLevels: [String!]
    $preferGroupFormat: String
    $preferClassType: [String!]
    $status: String
    $extraDetails: JSON
  ) {
    createOpportunity(
      data: {
        title: $title
        shortDescription: $shortDescription
        description: $description
        coverImageUrl: $coverImageUrl
        videoUrl: $videoUrl
        classNetworks: { connect: $classNetworks }
        availableFrom: $availableFrom
        availableTo: $availableTo
        timeCommitment: $timeCommitment
        studentCapacity: $studentCapacity
        teamSize: $teamSize
        allowsTeamPreferences: $allowsTeamPreferences
        preferGradeLevels: $preferGradeLevels
        preferGroupFormat: $preferGroupFormat
        preferClassType: $preferClassType
        status: $status
        extraDetails: $extraDetails
      }
    ) {
      id
      title
      status
    }
  }
`;

export const UPDATE_OPPORTUNITY = gql`
  mutation UPDATE_OPPORTUNITY(
    $id: ID!
    $title: String
    $shortDescription: String
    $description: String
    $coverImageUrl: String
    $videoUrl: String
    $classNetworks: [ClassNetworkWhereUniqueInput!]
    $availableFrom: DateTime
    $availableTo: DateTime
    $timeCommitment: String
    $studentCapacity: Int
    $teamSize: Int
    $allowsTeamPreferences: Boolean
    $preferGradeLevels: [String!]
    $preferGroupFormat: String
    $preferClassType: [String!]
    $status: String
    $extraDetails: JSON
    $updatedAt: DateTime
  ) {
    updateOpportunity(
      where: { id: $id }
      data: {
        title: $title
        shortDescription: $shortDescription
        description: $description
        coverImageUrl: $coverImageUrl
        videoUrl: $videoUrl
        classNetworks: { set: $classNetworks }
        availableFrom: $availableFrom
        availableTo: $availableTo
        timeCommitment: $timeCommitment
        studentCapacity: $studentCapacity
        teamSize: $teamSize
        allowsTeamPreferences: $allowsTeamPreferences
        preferGradeLevels: $preferGradeLevels
        preferGroupFormat: $preferGroupFormat
        preferClassType: $preferClassType
        status: $status
        extraDetails: $extraDetails
        updatedAt: $updatedAt
      }
    ) {
      id
      title
      status
    }
  }
`;

export const DELETE_OPPORTUNITY = gql`
  mutation DELETE_OPPORTUNITY($id: ID!) {
    deleteOpportunity(where: { id: $id }) {
      id
    }
  }
`;
