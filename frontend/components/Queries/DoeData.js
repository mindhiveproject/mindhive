import gql from "graphql-tag";

// Admin tool for the NYC DOE data agreement (keystone/mutations/doeDataAdmin).

export const DELETE_DOE_DATA = gql`
  mutation DELETE_DOE_DATA(
    $email: String
    $school: String
    $termination: Boolean
    $dryRun: Boolean
    $confirm: String
  ) {
    deleteDoeData(
      email: $email
      school: $school
      termination: $termination
      dryRun: $dryRun
      confirm: $confirm
    )
  }
`;

export const DOE_EXPORT_PERSON = gql`
  query DOE_EXPORT_PERSON($email: String) {
    doeExportPerson(email: $email)
  }
`;

export const DOE_EXPORT_SCHOOL = gql`
  query DOE_EXPORT_SCHOOL($school: String!, $includeRawFiles: Boolean) {
    doeExportSchool(school: $school, includeRawFiles: $includeRawFiles)
  }
`;

export const RETENTION_RUNS = gql`
  query RETENTION_RUNS {
    retentionRuns(orderBy: { startedAt: desc }, take: 50) {
      id
      trigger
      scope
      dryRun
      verified
      counts
      startedAt
      finishedAt
    }
  }
`;

export const RETENTION_SETTINGS = gql`
  query RETENTION_SETTINGS {
    doeRetentionSettings
  }
`;

export const SET_AUTO_DEIDENTIFY = gql`
  mutation SET_AUTO_DEIDENTIFY($enabled: Boolean!) {
    setAutoDeidentify(enabled: $enabled)
  }
`;

export const RUN_DEIDENTIFICATION = gql`
  mutation RUN_DEIDENTIFICATION($dryRun: Boolean, $profileIds: [ID!]) {
    runDeidentification(dryRun: $dryRun, profileIds: $profileIds)
  }
`;
