import gql from "graphql-tag";

export const CREATE_LOG = gql`
  mutation CREATE_LOG($input: LogCreateInput!) {
    createLog(data: $input) {
      id
    }
  }
`;
