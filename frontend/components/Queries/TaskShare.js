import gql from "graphql-tag";

// Classes the signed-in user can share a task in, with who they can pick
// (keystone/mutations/taskShare.ts).
export const TASK_SHARE_TARGETS = gql`
  query TASK_SHARE_TARGETS($taskId: ID!) {
    taskShareTargets(taskId: $taskId) {
      id
      title
      code
      role
      canShare
      canShareWithClass
      studentCount
      members {
        id
        name
        role
      }
    }
  }
`;

// What the signed-in user already shared of one task.
export const MY_SENT_TASK_SHARES = gql`
  query MY_SENT_TASK_SHARES($taskId: ID!, $me: ID!) {
    taskShareInvites(
      where: {
        task: { id: { equals: $taskId } }
        sender: { id: { equals: $me } }
      }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      status
      wholeClass
      createdAt
      class {
        id
        title
      }
      recipients {
        id
        username
        firstName
        lastName
      }
      acceptedByCount
    }
  }
`;

const SHARED_INVITE_FIELDS = `
  id
  status
  wholeClass
  message
  createdAt
  viewerCopyId
  sender {
    id
    username
    firstName
    lastName
  }
  class {
    id
    title
  }
  task {
    id
    title
    i18nContent
    taskType
    runtimeType
    settings
  }
`;

// Everything shared with the signed-in user that is still open to them, or
// that they added (Develop › Shared with me). Their own answer is read
// through acceptedBy/declinedBy filtered to them.
export const TASKS_SHARED_WITH_ME = gql`
  query TASKS_SHARED_WITH_ME($me: ID!) {
    taskShareInvites(
      where: { NOT: [{ sender: { id: { equals: $me } } }] }
      orderBy: [{ createdAt: desc }]
    ) {
      ${SHARED_INVITE_FIELDS}
      acceptedBy(where: { id: { equals: $me } }) {
        id
      }
      declinedBy(where: { id: { equals: $me } }) {
        id
      }
    }
  }
`;

// How many shares of this type wait for an answer, for the filter label.
export const PENDING_TASK_SHARES_COUNT = gql`
  query PENDING_TASK_SHARES_COUNT($me: ID!, $taskType: TaskTaskTypeType!) {
    taskShareInvitesCount(
      where: {
        status: { equals: "active" }
        task: { taskType: { equals: $taskType } }
        NOT: [
          { sender: { id: { equals: $me } } }
          { acceptedBy: { some: { id: { equals: $me } } } }
          { declinedBy: { some: { id: { equals: $me } } } }
        ]
      }
    )
  }
`;

// The copies the signed-in user made from shares, for their cards.
export const SHARED_COPIES = gql`
  query SHARED_COPIES($ids: [ID!]!) {
    tasks(where: { id: { in: $ids } }) {
      id
      title
      i18nContent
      taskType
      runtimeType
      settings
    }
  }
`;

// Other people's tasks running a template, for its authors' warning.
export const TEMPLATE_USAGE = gql`
  query TEMPLATE_USAGE($templateId: ID!) {
    templateUsage(templateId: $templateId) {
      otherTasks
      otherPeople
    }
  }
`;
