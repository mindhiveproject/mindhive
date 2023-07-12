import gql from "graphql-tag";

// get user group chats
export const GET_MY_CHATS = gql`
  query GET_MY_CHATS($id: ID!) {
    talks(
      where: {
        OR: [
          { author: { id: { equals: $id } } }
          { members: { some: { id: { equals: $id } } } }
        ]
      }
    ) {
      id
      author {
        id
      }
      classes {
        title
      }
      studies {
        title
      }
      members {
        username
      }
      settings
    }
  }
`;

// get teacher classes
export const GET_CHAT = gql`
  query GET_CHAT($id: ID!) {
    talk(where: { id: $id }) {
      id
      settings
      author {
        id
      }
      words {
        id
        author {
          id
          username
        }
        message
        settings
        new
        isMain
        children {
          id
        }
        createdAt
        updatedAt
      }
      classes {
        title
        creator {
          id
          username
        }
        mentors {
          id
          username
        }
        students {
          id
          username
        }
      }
      studies {
        title
        author {
          id
          username
        }
        collaborators {
          id
          username
        }
      }
      members {
        id
        username
      }
    }
  }
`;

// query specific message
export const GET_MESSAGE = gql`
  query GET_MESSAGE($id: ID!) {
    word(where: { id: $id }) {
      id
      author {
        id
        username
      }
      message
      settings
      children {
        id
      }
      parent {
        id
      }
      createdAt
      updatedAt
    }
  }
`;
