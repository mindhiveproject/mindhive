import gql from "graphql-tag";

export const GET_ASSIGNMENTS_CHILD = gql`
  query GET_ASSIGNMENTS_CHILD($parentId: ID!) {
    assignments(where: { templateSource: { id: { equals: $parentId } } }) {
      id
      title
      code
      createdAt
      author {
        id
        username
      }
      templateSource {
        id
        author {
          id
        }
        title
      }
    }
  }
`;

// get assignment by code
export const GET_ASSIGNMENT = gql`
  query GET_ASSIGNMENT($code: String!) {
    assignment(where: { code: $code }) {
      id
      code
      title
      content
      placeholder
      templateSource {
        id
        title
      }
      classes {
        id
      }
      homework {
        id
        code
        title
        public
        content
        placeholder
        settings
        author {
          id
          username
          publicReadableId
        }
        createdAt
        updatedAt
      }
    }
  }
`;

// get assignment for students to complete
export const GET_ASSIGNMENT_FOR_STUDENT = gql`
  query GET_ASSIGNMENT_FOR_STUDENT($code: String!) {
    assignment(where: { code: $code }) {
      id
      code
      title
      content
      placeholder
    }
  }
`;

// get all my and class assignments
export const GET_MY_CLASS_ASSIGNMENTS = gql`
  query GET_MY_CLASS_ASSIGNMENTS($userId: ID!, $classId: ID) {
    assignments(
      where: {
        AND: [
          { author: { id: { equals: $userId } } }
          { classes: { some: { id: { equals: $classId } } } }
        ]
      }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      code
      title
      content
      placeholder
      author {
        username
      }
      public
      homework {
        public
      }
      classes {
        id
      }
      createdAt
    }
  }
`;

// get all my and class assignments
export const GET_CLASS_ASSIGNMENTS_FOR_STUDENTS = gql`
  query GET_CLASS_ASSIGNMENTS_FOR_STUDENTS($classId: ID) {
    assignments(
      where: { classes: { some: { id: { equals: $classId } } } }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      code
      title
      content
      placeholder
      author {
        username
      }
      public
      homework {
        public
      }
      classes {
        id
      }
      createdAt
    }
  }
`;

// get template assignments
export const GET_TEMPLATE_ASSIGNMENTS = gql`
  query GET_TEMPLATE_ASSIGNMENTS {
    assignments(where: { isTemplate: { equals: true } }) {
      id
      code
      title
      content
      placeholder
      author {
        username
      }
    }
  }
`;

// get assignment by id
export const GET_TEMPLATE_ASSIGNMENT = gql`
  query GET_ASSIGNMENT($id: ID!) {
    assignment(where: { id: $id }) {
      id
      code
      title
      content
      placeholder
    }
  }
`;

// get my assignments
export const GET_MY_ASSIGNMENTS = gql`
  query GET_MY_ASSIGNMENTS($id: ID!) {
    assignments(where: { author: { id: { equals: $id } } }) {
      id
      title
      content
      placeholder
      public
      templateSource {
        id
        title
        author {
          id
        }
      } 
      classes {
        id
        title
      }
    }
  }
`;

// get my assignments
export const GET_AN_ASSIGNMENT = gql`
  query GET_AN_ASSIGNMENT($id: ID!) {
    assignments(where: { id: { equals: $id } }) {
      id
      title
      content
      placeholder
      public
      code
      settings
      author {
        id
      }
      homework {
        id
        title
        code
        content
        comment
        updatedAt
        settings
        placeholder
      }
      classes {
        id
      }
    }
  }
`;

// get assignments attached to any card on a board
export const GET_BOARD_ASSIGNMENTS = gql`
  query GET_BOARD_ASSIGNMENTS($boardId: ID!) {
    assignments(
      where: {
        proposalCards: {
          some: { section: { board: { id: { equals: $boardId } } } }
        }
      }
    ) {
      id
      classes { id }
    }
  }
`;
