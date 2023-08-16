import gql from "graphql-tag";

// create dataset record
export const CREATE_DATASET = gql`
  mutation CREATE_DATASET(
    $token: String!
    $profileId: ID
    $templateId: ID
    $taskId: ID
    # $studyId: ID
    $dataPolicy: String
    $info: JSON
    $isCompleted: Boolean
  ) {
    createDataset(
      data: {
        token: $token
        profile: { connect: { id: $profileId } }
        template: { connect: { id: $templateId } }
        task: { connect: { id: $taskId } }
        # study: { connect: { id: $studyId } }
        dataPolicy: $dataPolicy
        info: $info
        isCompleted: $isCompleted
      }
    ) {
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
  ) {
    updateDataset(
      where: { token: $token }
      data: { isCompleted: $isCompleted, dataPolicy: $dataPolicy }
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
