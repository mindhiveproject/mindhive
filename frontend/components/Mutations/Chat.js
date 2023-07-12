import gql from "graphql-tag";

// create new group chat
export const CREATE_CHAT = gql`
  mutation CREATE_CHAT(
    $members: [ProfileWhereUniqueInput!]
    $classes: [ClassWhereUniqueInput!]
    $studies: [StudyWhereUniqueInput!]
    $settings: JSON
  ) {
    createTalk(
      data: {
        members: { connect: $members }
        classes: { connect: $classes }
        studies: { connect: $studies }
        settings: $settings
      }
    ) {
      id
    }
  }
`;

// update chat settings
export const UPDATE_CHAT_SETTINGS = gql`
  mutation UPDATE_CHAT_SETTINGS($id: ID!, $settings: JSON) {
    updateTalk(where: { id: $id }, data: { settings: $settings }) {
      id
      settings
    }
  }
`;

// create new message
export const CREATE_NEW_MESSAGE = gql`
  mutation CREATE_NEW_MESSAGE($input: WordCreateInput!) {
    createWord(data: $input) {
      id
    }
  }
`;

// update thechat message
export const UPDATE_MESSAGE = gql`
  mutation UPDATE_MESSAGE($id: ID!, $message: String, $settings: JSON) {
    updateWord(
      where: { id: $id }
      data: { message: $message, settings: $settings }
    ) {
      id
    }
  }
`;

// delete the chat message
export const DELETE_MESSAGE = gql`
  mutation DELETE_MESSAGE($id: ID!) {
    deleteWord(where: { id: $id }) {
      id
    }
  }
`;
