import gql from "graphql-tag";

export const SHARE_TASK = gql`
  mutation SHARE_TASK(
    $taskId: ID!
    $classId: ID!
    $wholeClass: Boolean
    $recipientIds: [ID!]
    $message: String
  ) {
    shareTask(
      taskId: $taskId
      classId: $classId
      wholeClass: $wholeClass
      recipientIds: $recipientIds
      message: $message
    ) {
      id
    }
  }
`;

export const RESPOND_TO_TASK_SHARE = gql`
  mutation RESPOND_TO_TASK_SHARE($inviteId: ID!, $accept: Boolean!) {
    respondToTaskShare(inviteId: $inviteId, accept: $accept) {
      id
      viewerCopyId
    }
  }
`;

export const WITHDRAW_TASK_SHARE = gql`
  mutation WITHDRAW_TASK_SHARE($inviteId: ID!) {
    withdrawTaskShare(inviteId: $inviteId) {
      id
      status
    }
  }
`;

export const FORK_TASK_TEMPLATE = gql`
  mutation FORK_TASK_TEMPLATE($taskId: ID!) {
    forkTaskTemplate(taskId: $taskId) {
      templateId
      slug
      sourceSlug
    }
  }
`;

export const SWITCH_TASK_TEMPLATE = gql`
  mutation SWITCH_TASK_TEMPLATE($taskId: ID!, $templateId: ID!) {
    switchTaskTemplate(taskId: $taskId, templateId: $templateId) {
      id
    }
  }
`;

export const DISCARD_TEMPLATE = gql`
  mutation DISCARD_TEMPLATE($id: ID!) {
    deleteTemplate(where: { id: $id }) {
      id
    }
  }
`;
