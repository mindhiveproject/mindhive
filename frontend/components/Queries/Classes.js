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

// GET_CLASSES filters for the "My classes" lists. Apollo caches results per
// exact filter, so every list and refetch must use these helpers: a refetch
// with a slightly different filter updates a different cache entry and leaves
// the list stale.
export const teacherClassesWhere = (userId) => ({
  OR: [
    { creator: { id: { equals: userId } } },
    { teachingTeam: { some: { id: { equals: userId } } } },
    { mentors: { some: { id: { equals: userId } } } },
  ],
});

export const studentClassesWhere = (userId) => ({
  students: { some: { id: { equals: userId } } },
});

export const teacherClassesRefetch = (userId) => ({
  query: GET_CLASSES,
  variables: { input: teacherClassesWhere(userId) },
});

export const studentClassesRefetch = (userId) => ({
  query: GET_CLASSES,
  variables: { input: studentClassesWhere(userId) },
});

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
// public preview of a class by join code (title and teacher only; class
// details are limited to members)
export const CLASS_JOIN_PREVIEW = gql`
  query CLASS_JOIN_PREVIEW($code: String!) {
    classJoinPreview(code: $code) {
      id
      code
      title
      creatorUsername
    }
  }
`;

// The student class page: only what its header and Studies tab read. The
// Projects, Assignments and Opportunities tabs load their own data. GET_CLASS
// is the teacher's query: on a large class its roster (every member's email,
// each checked by a per-profile access query, plus each student's boards)
// took ~21 s for a student, who only ever sees nulls for those emails.
export const STUDENT_CLASS_QUERY = gql`
  query STUDENT_CLASS_QUERY($code: String!) {
    class(where: { code: $code }) {
      id
      title
      description
      code
      creator {
        id
        username
      }
      mentors {
        id
        username
      }
      studies {
        id
        slug
        title
        author {
          id
          username
        }
        collaborators {
          id
          username
        }
        participantsCount
        createdAt
      }
      settings
      createdAt
      updatedAt
    }
  }
`;

export const GET_CLASS = gql`
  query GET_CLASS($code: String!) {
    class(where: { code: $code }) {
      id
      title
      description
      code
      hiddenTasks {
        id
        public
      }
      hiddenStudies {
        id
        featured
      }
      creator {
        id
        username
      }
      teachingTeam {
        id
        username
        email
        firstName
        lastName
      }
      students {
        id
        publicId
        username
        email
        firstName
        lastName
        collaboratorInProposal {
          id
          title
          isMain
          usedInClass {
            id
          }
          clonedFrom {
            id
            title
          }
        }
        authorOfProposal {
          id
          title
          isMain
          usedInClass {
            id
          }
          clonedFrom {
            id
            title
          }
        }
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
          id
          username
        }
        collaborators {
          id
          username
        }
        participantsCount
        createdAt
        status
        dataCollectionStatus
        dataCollectionOpenForParticipation
      }
      networks {
        id
        publicId
        title
        description
        isPublic
        settings
        creator {
          id
          username
        }
        admins {
          id
          username
          firstName
          lastName
          email
        }
        classes {
          id
          title
        }
        memberOrganizations {
          id
          name
        }
        opportunities {
          id
        }
        createdAt
      }
      templateProposal {
        id
        title
        settings
      }
      classTemplateBoards {
        id
        title
        settings
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
        id
        code
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

// The teacher's class dashboard loads its students, the class's project boards
// and the class's studies as three flat lists, and useClassDashboardData groups
// them per student. Nesting boards and studies under each student resolved a
// shared board once per collaborator, and every board and study from the
// students' other classes too: up to ~1,900 database queries per view.
export const CLASS_ROSTER_QUERY = gql`
  query CLASS_ROSTER_QUERY($classId: ID!) {
    profiles(where: { studentIn: { some: { id: { equals: $classId } } } }) {
      id
      username
      publicId
    }
  }
`;

// The class's project boards with their sections and cards, collaborators,
// study and reviews, loaded by the backend in one query per relation
// (keystone/lib/classDashboard.js). Through proposalBoards { ... } Keystone
// resolved each board's and each section's relations on its own: ~1,400
// database queries per view for a large class. Plain JSON, so it isn't kept
// in sync with ProposalBoard edits elsewhere: useClassDashboardData refetches
// it on mount, and the dashboard's mutations refetch it.
export const CLASS_DASHBOARD_PROJECTS_QUERY = gql`
  query CLASS_DASHBOARD_PROJECTS_QUERY($classId: ID!) {
    classDashboardProjects(classId: $classId)
  }
`;

// Collaborators on this class's projects and studies who are mentors; the
// dashboard's modals list them apart. One query instead of every collaborator's
// permissions.
export const CLASS_DASHBOARD_MENTORS_QUERY = gql`
  query CLASS_DASHBOARD_MENTORS_QUERY($classId: ID!) {
    profiles(
      where: {
        AND: [
          { permissions: { some: { name: { equals: "MENTOR" } } } }
          {
            OR: [
              {
                collaboratorInProposal: {
                  some: { usedInClass: { id: { equals: $classId } } }
                }
              }
              {
                collaboratorInStudy: {
                  some: { classes: { some: { id: { equals: $classId } } } }
                }
              }
            ]
          }
        ]
      }
    ) {
      id
    }
  }
`;

// The class's teaching team (teacher, co-teachers, mentors) who hold a mentor
// or teacher permission: the people a teacher can add as a study's mentors.
export const CLASS_TEACHING_STAFF_QUERY = gql`
  query CLASS_TEACHING_STAFF_QUERY($ids: [ID!]) {
    profiles(
      where: {
        AND: [
          { id: { in: $ids } }
          {
            permissions: {
              some: { name: { in: ["MENTOR", "TEACHER"] } }
            }
          }
        ]
      }
      orderBy: { username: asc }
    ) {
      id
      username
      firstName
      lastName
    }
  }
`;

// The class's studies with their classes and collaborators, loaded by the
// backend with one class access check for all studies
// (keystone/lib/classDashboard.js) instead of one per study. Plain JSON, like
// CLASS_DASHBOARD_PROJECTS_QUERY.
export const CLASS_DASHBOARD_STUDIES_QUERY = gql`
  query CLASS_DASHBOARD_STUDIES_QUERY($classId: ID!) {
    classDashboardStudies(classId: $classId)
  }
`;

// A project's cards with their milestones, for the dashboard's milestone status
// modal to link to the student's action card. Loaded only when it opens.
export const DASHBOARD_PROJECT_CARDS_QUERY = gql`
  query DASHBOARD_PROJECT_CARDS_QUERY($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id
      sections {
        id
        cards {
          id
          type
          milestone {
            id
            key
            actionCardType
          }
        }
      }
    }
  }
`;

export const GET_TEACHER_CLASSES = gql`
  query GET_TEACHER_CLASSES($userId: ID!) {
    classes(
      where: {
        OR: [
          { creator: { id: { equals: $userId } } }
          { teachingTeam: { some: { id: { equals: $userId } } } }
        ]
      }
    ) {
      id
      title
      code
      createdAt
    }
  }
`;

export const GET_MENTOR_CLASSES = gql`
  query GET_MENTOR_CLASSES($userId: ID!) {
    classes(where: { 
      mentors: { 
        some: { 
          id: { 
            equals: $userId 
          }
        }
      } 
    })
    {
      id
      title
      code
      createdAt
    }
  }
`;
// Students of a class warned that their identity will be removed after two
// years without a sign-in (DOE data agreement), as [{ id, date }]. The class's
// teacher and co-teachers only (keystone/mutations/classDeidentificationNotices).
export const CLASS_DEIDENTIFICATION_NOTICES = gql`
  query CLASS_DEIDENTIFICATION_NOTICES($classId: ID!) {
    classDeidentificationNotices(classId: $classId)
  }
`;

// Whether the class supervises its studies' data collection itself, without
// a project board template (keystone/mutations/studyDataCollection.ts).
const CLASS_DATA_COLLECTION_FIELDS = `
  classId
  enabled
  canManage
  templateBoards {
    id
    title
  }
  carryOverCollecting
  carryOverFinished
  turnOffKeep
  turnOffStaysLocked
  turnOffSelfManaged
`;

export const CLASS_DATA_COLLECTION = gql`
  query CLASS_DATA_COLLECTION($classId: ID!) {
    classDataCollection(classId: $classId) {
      ${CLASS_DATA_COLLECTION_FIELDS}
    }
  }
`;

export const SET_CLASS_DATA_COLLECTION = gql`
  mutation SET_CLASS_DATA_COLLECTION($classId: ID!, $enabled: Boolean!) {
    setClassDataCollection(classId: $classId, enabled: $enabled) {
      ${CLASS_DATA_COLLECTION_FIELDS}
    }
  }
`;
