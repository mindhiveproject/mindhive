import gql from "graphql-tag";

// create new task
export const CREATE_TASK = gql`
  mutation CREATE_TASK(
    $title: String!
    $description: String
    $descriptionForParticipants: String
    $templateId: ID
    $taskType: TaskTaskTypeType
    $isExternal: Boolean
    $link: String
    $parameters: JSON
    $settings: JSON
    $i18nContent: JSON
    $collaborators: [ProfileWhereUniqueInput!]
  ) {
    createTask(
      data: {
        template: { connect: { id: $templateId } }
        title: $title
        description: $description
        descriptionForParticipants: $descriptionForParticipants
        taskType: $taskType
        isExternal: $isExternal
        link: $link
        parameters: $parameters
        settings: $settings
        i18nContent: $i18nContent
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
    $descriptionForParticipants: String
    $taskType: TaskTaskTypeType
    $isExternal: Boolean
    $link: String
    $collaborators: [ProfileWhereUniqueInput!]
    $settings: JSON
  ) {
    createTask(
      data: {
        title: $title
        description: $description
        descriptionForParticipants: $descriptionForParticipants
        taskType: $taskType
        isExternal: $isExternal
        link: $link
        collaborators: { connect: $collaborators }
        settings: $settings
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
    $descriptionForParticipants: String
    $link: String
    $parameters: JSON
    $settings: JSON
    $i18nContent: JSON
    $collaborators: [ProfileWhereUniqueInput!]
  ) {
    updateTask(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        descriptionForParticipants: $descriptionForParticipants
        link: $link
        parameters: $parameters
        settings: $settings
        i18nContent: $i18nContent
        collaborators: { set: $collaborators }
      }
    ) {
      id
      title
      description
    }
  }
`;
