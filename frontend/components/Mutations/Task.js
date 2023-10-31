import gql from "graphql-tag";

// create new task
export const CREATE_TASK = gql`
  mutation CREATE_TASK(
    $title: String!
    $description: String
    $templateId: ID
    $taskType: TaskTaskTypeType
    $isExternal: Boolean
    $link: String
    $parameters: JSON
    $collaborators: [ProfileWhereUniqueInput!]
  ) {
    createTask(
      data: {
        template: { connect: { id: $templateId } }
        title: $title
        description: $description
        taskType: $taskType
        isExternal: $isExternal
        link: $link
        parameters: $parameters
        collaborators: { connect: $collaborators }
      }
    ) {
      id
      title
      description
    }
  }
`;

// create new task
export const CREATE_EXTERNAL_TASK = gql`
  mutation CREATE_EXTERNAL_TASK(
    $title: String!
    $description: String
    $taskType: TaskTaskTypeType
    $isExternal: Boolean
    $link: String
    $collaborators: [ProfileWhereUniqueInput!]
  ) {
    createTask(
      data: {
        title: $title
        description: $description
        taskType: $taskType
        isExternal: $isExternal
        link: $link
        collaborators: { connect: $collaborators }
      }
    ) {
      id
      title
      description
    }
  }
`;

// update task
export const UPDATE_TASK = gql`
  mutation UPDATE_TASK(
    $id: ID!
    $title: String
    $description: String
    $link: String
    $parameters: JSON
    $collaborators: [ProfileWhereUniqueInput!]
  ) {
    updateTask(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        link: $link
        parameters: $parameters
        collaborators: { set: $collaborators }
      }
    ) {
      id
      title
      description
    }
  }
`;
