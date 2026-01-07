import gql from "graphql-tag";

// get featured studies
export const FEATURED_STUDIES = gql`
  query FEATURED_STUDIES {
    studies(where: { featured: { equals: true } }) {
      id
      title
      slug
      image {
        id
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
        image {
          publicUrlTransformed
        }
      }
      description
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
      author {
        id
        username
      }
      collaborators {
        id
        username
        image {
          id
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
      talks {
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
export const GET_STUDY_RESULTS = gql`
  query GET_STUDY_RESULTS($id: ID!) {
    study(where: { id: $id }) {
      id
      slug
      flow
      datasets {
        date
        token
        task {
          id
          slug
        }
        isCompleted
        isIncluded
        testVersion
        dataPolicy
      }
      summaryResults {
        data
        user {
          publicId
        }
        guest {
          publicId
        }
        study {
          title
        }
        task {
          id
          slug
          title
        }
        testVersion
        metadataId
        createdAt
      }
      consent {
        id
        title
      }
      versionHistory
    }
  }
`;

// get all studies (public studies and studies in the student's class network) that collect data
export const STUDIES_COLLECTING_DATA = gql`
  query STUDIES_COLLECTING_DATA($classIds: [ID!]) {
    studies(
      where: {
        AND: [
          { dataCollectionStatus: { in: ["SUBMITTED"] } }
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
      classes {
        id
      }
      image {
        id
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
      flow
    }
  }
`;

// get aggregate variables from a block
export const GET_BLOCK_AGGVAR = gql`
  query Tasks($where: TaskWhereInput!) {
    tasks(where: $where) {
      settings
      i18nContent
    }
  }
`;
