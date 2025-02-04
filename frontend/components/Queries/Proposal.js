import gql from "graphql-tag";

// get proposal templates
export const PROPOSAL_TEMPLATES_QUERY = gql`
  query PROPOSAL_TEMPLATES_QUERY {
    proposalBoards(where: { isTemplate: { equals: true } }) {
      id
      title
      description
      sections {
        id
        title
        description
        position
        cards {
          id
          title
          position
          section {
            id
          }
        }
      }
    }
  }
`;

// get study proposals
export const STUDY_PROPOSALS_QUERY = gql`
  query STUDY_PROPOSALS_QUERY($studyId: ID!) {
    proposalBoards(where: { study: { id: { equals: $studyId } } }) {
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
  }
`;

// get overview of a proposal
export const OVERVIEW_PROPOSAL_BOARD_QUERY = gql`
  query OVERVIEW_PROPOSAL_BOARD_QUERY($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id
      title
      slug
      description
      isSubmitted
      isTemplate
      settings
      study {
        id
        author {
          id
          username
        }
        collaborators {
          id
          username
        }
      }
    }
  }
`;

// get the full content of a proposal
export const PROPOSAL_QUERY = gql`
  query PROPOSAL_QUERY($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id
      title
      slug
      description
      settings
      isSubmitted
      submitProposalStatus
      submitProposalOpenForComments
      peerFeedbackStatus
      peerFeedbackOpenForComments
      projectReportStatus
      projectReportOpenForComments
      isTemplate
      usedInClass {
        id
        title
        creator {
          id
        }
        templateProposal {
          id
        }
      }
      author {
        username
      }
      collaborators {
        id
        username
      }
      study {
        id
        title
        slug
        author {
          id
          username
        }
        collaborators {
          id
          username
        }
      }
      sections {
        id
        title
        description
        position
        cards {
          id
          type
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
          isEditedBy {
            username
            image {
              id
              image {
                publicUrlTransformed
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_CARD_CONTENT = gql`
  query GET_CARD_CONTENT($id: ID!) {
    proposalCard(where: { id: $id }) {
      id
      type
      title
      description
      internalContent
      content
      comment
      settings
      assignedTo {
        id
        username
      }
      lastTimeEdited
      isEditedBy {
        username
      }
      shareType
      resources {
        id
        title
        content
      }
    }
  }
`;

// get reviews of a specific proposal
export const PROPOSAL_REVIEWS_QUERY = gql`
  query PROPOSAL_REVIEWS_QUERY($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id
      title
      description
      slug
      isSubmitted
      submitProposalStatus
      submitProposalOpenForComments
      peerFeedbackStatus
      peerFeedbackOpenForComments
      projectReportStatus
      projectReportOpenForComments
      checklist
      author {
        username
      }
      collaborators {
        username
      }
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
          type
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
        updatedAt
      }
    }
  }
`;

// get submitted proposals for featured studies
export const FEATURED_PROPOSALS_REVIEWS_QUERY = gql`
  query FEATURED_PROPOSALS_REVIEWS_QUERY(
    $featured: Boolean
    $isSubmitted: Boolean
  ) {
    proposalBoards(
      where: {
        AND: [
          { study: { featured: { equals: $featured } } }
          { isSubmitted: { equals: $isSubmitted } }
        ]
      }
    ) {
      id
      title
      slug
      isSubmitted
      checklist
      study {
        slug
        title
      }
      reviews {
        id
        stage
        content
        author {
          id
        }
      }
    }
  }
`;

// get reviews for some proposals
export const MY_STUDIES_PROPOSALS_REVIEWS_QUERY = gql`
  query MY_STUDIES_PROPOSALS_REVIEWS_QUERY($userId: ID) {
    proposalBoards(
      where: {
        OR: [
          { study: { collaborators: { some: { id: { equals: $userId } } } } }
          { study: { author: { id: { equals: $userId } } } }
        ]
      }
    ) {
      id
      title
      slug
      isSubmitted
      checklist
      study {
        slug
        title
      }
      reviews {
        id
        stage
        content
        author {
          id
        }
      }
    }
  }
`;

// get submitted proposals of the class's studies
export const CLASS_PROPOSALS_REVIEWS_QUERY = gql`
  query CLASS_PROPOSALS_REVIEWS_QUERY(
    $classCode: String
    $isSubmitted: Boolean
  ) {
    proposalBoards(
      where: {
        AND: [
          { study: { classes: { some: { code: { equals: $classCode } } } } }
          { isSubmitted: { equals: $isSubmitted } }
        ]
      }
    ) {
      id
      title
      slug
      isSubmitted
      checklist
      study {
        slug
        title
      }
      reviews {
        id
        stage
        content
        author {
          id
        }
      }
    }
  }
`;

// get the proposal boards created by the user
export const GET_MY_PROPOSALS = gql`
  query GET_MY_PROPOSALS($creatorId: ID!) {
    proposalBoards(where: { creator: { id: { equals: $creatorId } } }) {
      id
      title
      description
      creator {
        id
        username
      }
      sections {
        id
      }
      isTemplate
      createdAt
    }
  }
`;

// get the project boards where the user is an author or a collaborator
export const GET_MY_PROJECT_BOARDS = gql`
  query GET_MY_PROJECT_BOARDS($userId: ID!) {
    proposalBoards(
      where: {
        OR: [
          { author: { id: { equals: $userId } } }
          { collaborators: { some: { id: { equals: $userId } } } }
        ]
      }
    ) {
      id
      title
      author {
        id
        username
      }
      createdAt
    }
  }
`;

// get class proposals
export const CLASS_TEMPLATE_PROJECTS_QUERY = gql`
  query CLASS_TEMPLATE_PROJECTS_QUERY($classId: ID!) {
    proposalBoards(
      where: { templateForClasses: { some: { id: { equals: $classId } } } }
    ) {
      id
      title
      slug
      description
      isSubmitted
      isTemplate
      settings
      author {
        username
      }
      collaborators {
        username
      }
      createdAt
      updatedAt
    }
  }
`;

// get class proposals
export const CLASS_PROJECTS_QUERY = gql`
  query CLASS_PROJECTS_QUERY($classId: ID!) {
    proposalBoards(where: { usedInClass: { id: { equals: $classId } } }) {
      id
      title
      slug
      description
      isSubmitted
      settings
      author {
        username
      }
      collaborators {
        username
      }
      createdAt
      updatedAt
    }
  }
`;

// get overview of a proposal
export const GET_PROJECT_STUDY = gql`
  query GET_PROJECT_STUDY($id: ID!) {
    proposalBoard(where: { id: $id }) {
      id
      study {
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
      }
    }
  }
`;

// get proposals with a custom query
export const PROJECTS_QUERY = gql`
  query PROJECTS_QUERY($where: ProposalBoardWhereInput!) {
    proposalBoards(where: $where) {
      id
      title
      slug
      description
      isSubmitted
      submitProposalStatus
      submitProposalOpenForComments
      peerFeedbackStatus
      peerFeedbackOpenForComments
      projectReportStatus
      projectReportOpenForComments
      settings
      study {
        featured
      }
      reviews {
        id
        stage
      }
      author {
        username
      }
      collaborators {
        username
      }
      usedInClass {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

// get default proposals
export const DEFAULT_PROJECT_BOARDS = gql`
  query DEFAULT_PROJECT_BOARDS {
    proposalBoards(where: { isDefault: { equals: true } }) {
      id
    }
  }
`;
