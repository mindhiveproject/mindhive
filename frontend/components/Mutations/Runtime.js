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

export const INGEST_RUN_MESSAGE = gql`
  mutation INGEST_RUN_MESSAGE(
    $runToken: String!
    $sequence: Int!
    $messageType: RuntimeMessageType!
    $data: JSON
    $aggregated: JSON
    $error: String
  ) {
    ingestRunMessage(
      runToken: $runToken
      sequence: $sequence
      messageType: $messageType
      data: $data
      aggregated: $aggregated
      error: $error
    ) {
      accepted
      duplicate
      sequence
      datasetToken
      completed
    }
  }
`;

export const UPDATE_RUN_DATA_POLICY = gql`
  mutation UPDATE_RUN_DATA_POLICY($runToken: String!, $dataPolicy: String!) {
    updateRunDataPolicy(runToken: $runToken, dataPolicy: $dataPolicy)
  }
`;
