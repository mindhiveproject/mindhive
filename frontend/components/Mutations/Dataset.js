import gql from "graphql-tag";

// create dataset record
export const CREATE_DATASET = gql`
  mutation CREATE_DATASET($input: DatasetCreateInput!) {
    createDataset(data: $input) {
      id
    }
  }
`;

// update dataset record
export const UPDATE_DATASET = gql`
  mutation UPDATE_DATASET(
    $token: String!
    $isCompleted: Boolean
    $dataPolicy: String
    $completedAt: DateTime
  ) {
    updateDataset(
      where: { token: $token }
      data: {
        isCompleted: $isCompleted
        dataPolicy: $dataPolicy
        completedAt: $completedAt
      }
    ) {
      id
    }
  }
`;

// delete dataset record
export const DELETE_DATASET = gql`
  mutation DELETE_DATASET($id: ID!) {
    deleteDataset(where: { id: $id }) {
      id
    }
  }
`;
