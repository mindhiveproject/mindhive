import gql from "graphql-tag";

export const CREATE_LOG = gql`
  mutation CREATE_LOG($input: LogCreateInput!) {
    createLog(data: $input) {
      id
    }
  }
`;

export const RECORD_OPPORTUNITY_PREVIEW_VISIT = gql`
  mutation RECORD_OPPORTUNITY_PREVIEW_VISIT(
    $opportunityId: ID!
    $classId: ID!
    $roundId: ID!
    $openAt: DateTime!
    $closeAt: DateTime!
  ) {
    recordOpportunityPreviewVisit(
      opportunityId: $opportunityId
      classId: $classId
      roundId: $roundId
      openAt: $openAt
      closeAt: $closeAt
    ) {
      id
    }
  }
`;
