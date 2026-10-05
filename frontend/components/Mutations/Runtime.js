import { gql } from '@apollo/client';

export const START_RUN = gql`
  mutation START_RUN(
    $taskId: ID!
    $studyId: ID!
    $requestedTestVersion: String
    $guestPublicId: String
  ) {
    startRun(
      taskId: $taskId
      studyId: $studyId
      requestedTestVersion: $requestedTestVersion
      guestPublicId: $guestPublicId
    ) {
      runToken
      datasetToken
      runtimeType
      testVersion
      studyVersion
      assetId
      assetVersion
    }
  }
`;

export const UPDATE_RUN_DATA_POLICY = gql`
  mutation UPDATE_RUN_DATA_POLICY($runToken: String!, $dataPolicy: String!) {
    updateRunDataPolicy(runToken: $runToken, dataPolicy: $dataPolicy)
  }
`;
