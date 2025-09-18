import gql from "graphql-tag";

// get assignment by code
export const GET_ASSIGNMENT = gql`
  query GET_ASSIGNMENT($code: String!) {
    assignment(where: { code: $code }) {
      id
      code
      title
      content
      classes {
        id
      }
      homework {
        id
        code
        title
        public
        content
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
    }
  }
`;

// get my assignments
export const GET_MY_ASSIGNMENTS = gql`
  query GET_MY_ASSIGNMENTS($id: ID!) {
    assignments(where: { author: { id: { equals: $id } } }) {
      id
      title
    }
  }
`;
