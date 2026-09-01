import gql from "graphql-tag";

// get user group chats (exclude opportunity × class FAQ rooms)
export const GET_MY_CHATS = gql`
  query GET_MY_CHATS($id: ID!) {
    talks(
      where: {
        AND: [
          {
            OR: [
              { author: { id: { equals: $id } } }
              { members: { some: { id: { equals: $id } } } }
            ]
          }
          { opportunities: { none: {} } }
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
        image {
          id
          keystoneImage {
            id
            url
          }
          image {
            publicUrlTransformed
          }
        }
      }
    }
  }
`;

// Shared Word shape for opportunity × class FAQ (question + official answer).
export const OPPORTUNITY_CLASS_FAQ_WORD_FIELDS = gql`
  fragment OpportunityClassFaqWordFields on Word {
    id
    message
    isMain
    createdAt
    updatedAt
    settings
    parent {
      id
    }
    children {
      id
      message
      createdAt
      updatedAt
      settings
      author {
        id
        username
        firstName
        lastName
      }
    }
    author {
      id
      username
      firstName
      lastName
    }
  }
`;

// Find the oldest Talk for an opportunity × class pair (FAQ room).
export const GET_OPPORTUNITY_CLASS_FORUM = gql`
  query GET_OPPORTUNITY_CLASS_FORUM($opportunityId: ID!, $classId: ID!) {
    talks(
      where: {
        AND: [
          { opportunities: { some: { id: { equals: $opportunityId } } } }
          { classes: { some: { id: { equals: $classId } } } }
        ]
      }
      orderBy: [{ createdAt: asc }]
      take: 1
    ) {
      id
      settings
      classes {
        id
        creator {
          id
        }
        mentors {
          id
        }
      }
      opportunities {
        id
        mentor {
          id
        }
      }
      words(orderBy: [{ createdAt: asc }]) {
        ...OpportunityClassFaqWordFields
      }
    }
  }
  ${OPPORTUNITY_CLASS_FAQ_WORD_FIELDS}
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
