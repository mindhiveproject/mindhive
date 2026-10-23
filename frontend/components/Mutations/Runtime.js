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
      assetToken
    }
  }
`;

// An asset token to preview a jsPsych task without starting a run.
export const RUNTIME_ASSET_PREVIEW_TOKEN = gql`
  query RUNTIME_ASSET_PREVIEW_TOKEN($taskId: ID!) {
    runtimeAssetPreviewToken(taskId: $taskId)
  }
`;

export const UPDATE_RUN_DATA_POLICY = gql`
  mutation UPDATE_RUN_DATA_POLICY($runToken: String!, $dataPolicy: String!) {
    updateRunDataPolicy(runToken: $runToken, dataPolicy: $dataPolicy)
  }
`;

const RUNTIME_VERSION_FIELDS = `
  currentVersionId
  currentVersion
  latestVersionId
  latestVersion
  latestTitle
  isLatest
  locked
  lockingStudies
  canUpdate
  changes {
    added
    removed
    reset
  }
`;

// Whether a jsPsych block's experiment has a newer version (W35).
export const RUNTIME_VERSION_STATUS = gql`
  query RUNTIME_VERSION_STATUS($taskId: ID!) {
    runtimeVersionStatus(taskId: $taskId) {
      ${RUNTIME_VERSION_FIELDS}
    }
  }
`;

// Moves a jsPsych block to the latest version, merging its parameters.
export const UPDATE_TASK_RUNTIME_VERSION = gql`
  mutation UPDATE_TASK_RUNTIME_VERSION($taskId: ID!) {
    updateTaskRuntimeVersion(taskId: $taskId) {
      ${RUNTIME_VERSION_FIELDS}
    }
  }
`;
