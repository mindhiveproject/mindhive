import gql from "graphql-tag";

// get specific classes
export const GET_CLASSES = gql`
  query GET_CLASSES($input: ClassWhereInput!) {
    classes(where: $input) {
      id
      title
      description
      code
      creator {
        id
        username
      }
      students {
        id
      }
      settings
      createdAt
      updatedAt
    }
  }
`;

// get all classes
export const GET_ALL_CLASSES = gql`
  query GET_ALL_CLASSES {
    classes {
      id
      title
      description
      code
      createdAt
      updatedAt
      settings
    }
  }
`;

// get class with a unique code
export const GET_CLASS = gql`
  query GET_CLASS($code: String!) {
    class(where: { code: $code }) {
      id
      title
      description
      code
      creator {
        username
      }
      students {
        id
        publicId
        username
        email
      }
      mentors {
        id
        publicId
        username
        email
      }
      studies {
        id
        slug
        title
        author {
          username
        }
        collaborators {
          username
        }
        participants {
          id
        }
        createdAt
      }
      networks {
        title
        description
        creator {
          username
        }
        classes {
          title
        }
        createdAt
      }
      templateProposal {
        id
      }
      settings
      createdAt
      updatedAt
    }
  }
`;

// get student data of a particular class
export const GET_STUDENTS_DATA = gql`
  query GET_STUDENTS_DATA($classId: ID!) {
    profiles(where: { studentIn: { some: { id: { equals: $classId } } } }) {
      id
      username
      firstName
      lastName
      publicId
      authorOfHomework {
        assignment {
          id
        }
        settings
        public
      }
      studiesInfo
      participantIn {
        id
        title
        slug
        flow
      }
    }
  }
`;

// get student data of a particular class
export const GET_STUDENTS_DASHBOARD_DATA = gql`
  query GET_STUDENTS_DASHBOARD_DATA($classId: ID!) {
    profiles(where: { studentIn: { some: { id: { equals: $classId } } } }) {
      id
      username
      publicId
      collaboratorInStudy {
        id
        title
        classes {
          id
          title
        }
        collaborators {
          id
          username
          permissions {
            name
          }
        }
      }
      collaboratorInProposal {
        id
        title
        isMain
        sections {
          cards {
            id
            settings
          }
        }
        submitProposalStatus
        submitProposalOpenForComments
        peerFeedbackStatus
        peerFeedbackOpenForComments
        projectReportStatus
        projectReportOpenForComments
        usedInClass {
          id
        }
        collaborators {
          id
          username
          permissions {
            name
          }
        }
        study {
          id
          title
          status
          collaborators {
            id
            username
            permissions {
              name
            }
          }
          dataCollectionStatus
          dataCollectionOpenForParticipation
        }
        reviews {
          stage
          content
        }
      }
    }
  }
`;

export const GET_TEACHER_CLASSES = gql`
  query GET_TEACHER_CLASSES($userId: ID!) {
    classes(where: { creator: { id: { equals: $userId } } }) {
      id
      title
      code
    }
  }
`;
