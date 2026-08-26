import gql from "graphql-tag";

export const CLASS_OPPORTUNITY_PREVIEW_LOGS = gql`
  query CLASS_OPPORTUNITY_PREVIEW_LOGS(
    $classId: ID!
    $opportunityIds: [ID!]!
  ) {
    logs(
      where: {
        event: { equals: "OPPORTUNITY_PREVIEW_VISIT" }
        class: { id: { equals: $classId } }
        opportunity: { id: { in: $opportunityIds } }
      }
    ) {
      id
      content
      createdAt
      user {
        id
        firstName
        lastName
        username
      }
      opportunity {
        id
      }
    }
  }
`;
