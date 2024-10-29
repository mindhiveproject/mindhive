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
      isTemplate
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
        }
      }
      reviews {
        id
        stage
        content
        author {
          id
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
