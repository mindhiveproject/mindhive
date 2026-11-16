import gql from "graphql-tag";

// featured studies a teacher can hide from their class's students
export const FEATURED_STUDIES_FOR_CLASS_VISIBILITY = gql`
  query FEATURED_STUDIES_FOR_CLASS_VISIBILITY {
    studies(where: { featured: { equals: true } }, orderBy: { title: asc }) {
      id
      title
    }
  }
`;

// get featured studies
export const FEATURED_STUDIES = gql`
  query FEATURED_STUDIES($hiddenIds: [ID!] = []) {
    studies(
      where: { featured: { equals: true }, id: { notIn: $hiddenIds } }
    ) {
      id
      title
      slug
      author {
        id
      }
      collaborators {
        id
      }
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
      description
    }
  }
`;

// get public studies
export const PUBLIC_STUDIES = gql`
  query PUBLIC_STUDIES {
    studies(where: { public: { equals: true } }) {
      id
      title
      slug
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
      description
      author {
        id
        username
      }
    }
  }
`;

// get my studies
export const MY_STUDIES = gql`
  query MY_STUDIES($id: ID!) {
    studies(
      where: {
        isHidden: { equals: false }
        OR: [
          { author: { id: { equals: $id } } }
          { collaborators: { some: { id: { equals: $id } } } }
        ]
      }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      title
      slug
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
      description
      author {
        id
        username
      }
      createdAt
      classes {
        id
        title
        code
        settings
      }
      # Data-collection stage on the study cards (StudyStageChip).
      status
      dataCollectionStatus
      dataCollectionOpenForParticipation
      proposal {
        id
        usedInClass {
          id
        }
      }
    }
  }
`;

//  TEACHER_STUDIES query
export const TEACHER_STUDIES = gql`
  query TEACHER_STUDIES($id: ID!) {
    studies(
      where: {
        isHidden: { equals: false }
        OR: [
          { author: { id: { equals: $id } } }
          { collaborators: { some: { id: { equals: $id } } } }
          { classes: { some: { creator: { id: { equals: $id } } } } }
        ]
      }
      orderBy: [{ createdAt: desc }]
    ) {
      id
      title
      slug
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
      description
      author {
        id
        username
      }
      createdAt
      classes {
        id
        title
        code
        settings
      }
      # Data-collection stage on the study cards (StudyStageChip).
      status
      dataCollectionStatus
      dataCollectionOpenForParticipation
      proposal {
        id
        usedInClass {
          id
        }
      }
    }
  }
`;

// get my study
export const MY_STUDY = gql`
  query MY_STUDY($id: ID!) {
    study(where: { id: $id }) {
      id
      title
      slug
      info
      settings
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
      shortDescription
      description
      proposal {
        id
        title
      }
      proposalMain {
        id
        title
      }
      author {
        id
        username
      }
      collaborators {
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
      classes {
        id
      }
      consent {
        id
      }
      diagram
      components
      flow
      descriptionInProposalCard {
        id
        title
        description
        section {
          id
          board {
            id
            title
          }
        }
      }
      tags {
        id
        title
      }
      status
      currentVersion
      versionHistory
      dataCollectionStatus
      updatedAt
    }
  }
`;

// get study to see the information about the study
export const STUDY_TO_DISCOVER = gql`
  query STUDY_TO_DISCOVER($slug: String!) {
    study(where: { slug: $slug }) {
      id
      title
      slug
      settings
      collaborators {
        id
      }
      author {
        id
      }
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
      description
      info
      flow
      components
      currentVersion
      status
    }
  }
`;

// get study to join it
export const STUDY_TO_JOIN = gql`
  query STUDY_TO_JOIN($id: ID!) {
    study(where: { id: $id }) {
      id
      title
      slug
      description
      settings
      status
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
      info
      collaborators {
        id
        username
      }
      author {
        id
        username
      }
      consent {
        id
        title
        organization
        info
        settings
        studies {
          id
          title
          public
        }
        tasks {
          id
          title
        }
      }
      reviews {
        id
        stage
      }
      components
      flow
    }
  }
`;

// get study to clone
export const STUDY_TO_CLONE = gql`
  query STUDY_TO_CLONE($slug: String!) {
    study(where: { slug: $slug }) {
      id
      title
      slug
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
      description
    }
  }
`;

// get study templates
export const STUDY_TEMPLATES = gql`
  query STUDY_TEMPLATES($id: ID!) {
    studies(
      where: {
        OR: [
          { public: { equals: true } }
          { author: { id: { equals: $id } } }
          { collaborators: { some: { id: { equals: $id } } } }
        ]
      }
    ) {
      id
      title
      slug
      description
      shortDescription
      public
      diagram
      author {
        id
      }
      collaborators {
        id
      }
    }
  }
`;

// get study components (taken conditions by participants)
export const STUDY_COMPONENTS = gql`
  query STUDY_COMPONENTS($studyId: ID!) {
    study(where: { id: $studyId }) {
      components
    }
  }
`;

// get study datasets, summary results and consents
// A study's runs, summary results and data source records for its Collect
// page and downloads, read server-side in a few flat queries (see keystone
// lib/studyResults.js). Same shape as the old study { ... } selection:
// id slug flow datasets summaryResults dataSourceRecords consent versions
// versionHistory.
export const GET_STUDY_RESULTS = gql`
  query GET_STUDY_RESULTS($id: ID!) {
    studyResults(studyId: $id)
  }
`;

// get all studies (public studies and studies in the student's class network) that collect data
export const STUDIES_COLLECTING_DATA = gql`
  query STUDIES_COLLECTING_DATA($classIds: [ID!]) {
    studies(
      where: {
        AND: [
          # Collecting data: submitted through a class milestone, or a
          # self-managed study labelled as collecting (lib/studyLifecycle.js).
          {
            OR: [
              { dataCollectionStatus: { in: ["SUBMITTED"] } }
              { status: { equals: "COLLECTING_DATA" } }
            ]
          }
          {
            OR: [
              { featured: { equals: true } }
              { classes: { some: { id: { in: $classIds } } } }
            ]
          }
        ]
      }
    ) {
      id
      slug
      title
      featured
      status
      dataCollectionStatus
      classes {
        id
      }
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
      reviews {
        id
        stage
      }
      proposal {
        reviews {
          id
        }
      }
      participants {
        id
        datasets {
          studyStatus
        }
      }
      guests {
        id
        datasets {
          studyStatus
        }
      }
      createdAt
      dataCollectionOpenForParticipation
    }
  }
`;

// get a study for review
export const STUDY_TO_REVIEW = gql`
  query STUDY_TO_REVIEW($id: ID!) {
    study(where: { id: $id }) {
      id
      slug
      title
      featured
      description
      info
      status
      author {
        id
        username
        permissions {
          name
        }
      }
      collaborators {
        id
        username
        permissions {
          name
        }
      }
      classes {
        id
      }
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
      reviews {
        id
        stage
        content
        author {
          id
          permissions {
            name
          }
        }
        upvotedBy {
          id
        }
        createdAt
        updatedAt
      }
      proposalMain {
        id
        title
        description
        slug
        isSubmitted
        checklist
        study {
          id
          title
          slug
        }
        sections {
          id
          title
          description
          position
          cards {
            id
            title
            content
            settings
            position
            section {
              id
            }
            assignedTo {
              id
              username
            }
            shareType
            homework {
              id
              author {
                id
              }
            }
          }
        }
      }
    }
  }
`;

// get study proposals
export const STUDY_PROPOSALS_QUERY = gql`
  query STUDY_PROPOSALS_QUERY($id: ID!) {
    study(where: { id: $id }) {
      id
      status
      proposal {
        id
        author {
          id
        }
        title
        slug
        description
        isSubmitted
        isTemplate
        settings
        createdAt
        updatedAt
      }
      proposalMain {
        id
        author {
          id
        }
        title
        slug
        description
        isSubmitted
        isTemplate
        settings
        checklist
        createdAt
        updatedAt
      }
      classes {
        id
        title
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
      }
      reviews {
        id
        stage
        content
        author {
          id
        }
        createdAt
        updatedAt
        upvotedBy {
          id
        }
      }
    }
  }
`;

// get study flow
export const GET_STUDY_FLOW = gql`
  query Studies($where: StudyWhereInput!) {
    studies(where: $where) {
      id
      title
      flow
      dataCollectionStatus
    }
  }
`;

// get aggregate variables from a block
export const GET_BLOCK_AGGVAR = gql`
  query Tasks($where: TaskWhereInput!) {
    tasks(where: $where) {
      id
      settings
      i18nContent
    }
  }
`;

// The study's author and the people on the project boards linked to it, who
// can edit the study through their board (Connect modals).
export const STUDY_LINKED_BOARD_PEOPLE = gql`
  query STUDY_LINKED_BOARD_PEOPLE($id: ID!) {
    study(where: { id: $id }) {
      id
      author {
        id
        username
      }
      proposal {
        id
        title
        author {
          ...LinkedBoardPerson
        }
        collaborators {
          ...LinkedBoardPerson
        }
      }
    }
  }

  # Avatar fields read by the Connect facepile (ConnectFacepile photoUrl).
  fragment LinkedBoardPerson on Profile {
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
`;

// A study's data-collection lifecycle: whether a class milestone supervises
// it, its stage, who shares it and what the viewer may change
// (keystone/lib/studyDataCollection.js).
const STUDY_DATA_COLLECTION_FIELDS = `
  studyId
  supervised
  locked
  stage
  open
  canEdit
  canManage
  boards {
    id
    title
    classId
    classTitle
    milestoneKey
    supervising
  }
  classes {
    id
    title
    supervising
  }
  people {
    id
    username
    boards
  }
  submittedBy
  submittedAt
  history {
    action
    by
    at
    open
    stage
    confirmed
    sharedWith
    carriedOver
  }
`;

export const STUDY_DATA_COLLECTION = gql`
  query STUDY_DATA_COLLECTION($studyId: ID!) {
    studyDataCollection(studyId: $studyId) {
      ${STUDY_DATA_COLLECTION_FIELDS}
    }
  }
`;

export const SET_STUDY_DATA_COLLECTION = gql`
  mutation SET_STUDY_DATA_COLLECTION(
    $studyId: ID!
    $action: String!
    $open: Boolean
    $stage: String
    $acknowledgedProfileIds: [ID!]
    $confirmed: Boolean
  ) {
    setStudyDataCollection(
      studyId: $studyId
      action: $action
      open: $open
      stage: $stage
      acknowledgedProfileIds: $acknowledgedProfileIds
      confirmed: $confirmed
    ) {
      ${STUDY_DATA_COLLECTION_FIELDS}
    }
  }
`;
