import gql from "graphql-tag";

// copy proposal
export const COPY_PROPOSAL_MUTATION = gql`
  mutation COPY_PROPOSAL_MUTATION(
    $id: ID!
    $study: ID
    $title: String
    $classIdTemplate: ID
    $classIdUsed: ID
    $collaborators: [ID]
    $isTemplate: Boolean
  ) {
    copyProposalBoard(
      id: $id
      study: $study
      title: $title
      classIdTemplate: $classIdTemplate
      classIdUsed: $classIdUsed
      collaborators: $collaborators
      isTemplate: $isTemplate
    ) {
      id
      title
      slug
      description
      sections {
        id
        title
        description
        position
        cards {
          id
          type
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

export const CREATE_NEW_PROPOSAL = gql`
  mutation CREATE_NEW_PROPOSAL(
    $title: String!
    $description: String
    $settings: JSON
    $creatorId: ID!
  ) {
    createProposalBoard(
      data: {
        title: $title
        description: $description
        settings: $settings
        creator: { connect: { id: $creatorId } }
      }
    ) {
      id
    }
  }
`;

export const UPDATE_PROPOSAL_BOARD = gql`
  mutation UPDATE_PROPOSAL_BOARD(
    $id: ID!
    $title: String
    $description: String
    $isSubmitted: Boolean
    $checklist: JSON
    $isTemplate: Boolean
    $settings: JSON
  ) {
    updateProposalBoard(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        isSubmitted: $isSubmitted
        checklist: $checklist
        isTemplate: $isTemplate
        settings: $settings
      }
    ) {
      id
    }
  }
`;

export const DELETE_PROPOSAL = gql`
  mutation DELETE_PROPOSAL($id: ID!) {
    deleteProposalBoard(where: { id: $id }) {
      id
    }
  }
`;

export const CREATE_SECTION = gql`
  mutation CREATE_SECTION(
    $boardId: ID!
    $title: String!
    $description: String
    $position: Float!
  ) {
    createProposalSection(
      data: {
        board: { connect: { id: $boardId } }
        title: $title
        description: $description
        position: $position
      }
    ) {
      id
      title
      description
      position
      cards {
        id
      }
    }
  }
`;

export const UPDATE_SECTION = gql`
  mutation UPDATE_SECTION(
    $id: ID!
    $boardId: ID!
    $title: String
    $description: String
    $position: Float
  ) {
    updateProposalSection(
      where: { id: $id }
      data: {
        board: { connect: { id: $boardId } }
        title: $title
        description: $description
        position: $position
      }
    ) {
      id
      title
      description
      position
      cards {
        id
        title
        position
        content
      }
    }
  }
`;

export const DELETE_SECTION = gql`
  mutation DELETE_SECTION($id: ID!) {
    deleteProposalSection(where: { id: $id }) {
      id
    }
  }
`;

export const CREATE_CARD = gql`
  mutation CREATE_CARD(
    $title: String!
    $content: String
    $sectionId: ID!
    $position: Float!
    $settings: JSON
  ) {
    createProposalCard(
      data: {
        section: { connect: { id: $sectionId } }
        title: $title
        content: $content
        position: $position
        settings: $settings
      }
    ) {
      id
      title
      content
      position
      settings
      section {
        id
      }
    }
  }
`;

export const UPDATE_CARD_POSITION = gql`
  mutation UPDATE_CARD_POSITION($id: ID!, $sectionId: ID, $position: Float) {
    updateProposalCard(
      where: { id: $id }
      data: { section: { connect: { id: $sectionId } }, position: $position }
    ) {
      id
      position
      section {
        id
      }
    }
  }
`;

export const UPDATE_CARD_CONTENT = gql`
  mutation UPDATE_CARD_CONTENT(
    $id: ID!
    $title: String
    $description: String
    $internalContent: String
    $content: String
    $revisedContent: String
    $comment: String
    $settings: JSON
    $assignedTo: [ProfileWhereUniqueInput!]
    $type: String
    $shareType: String
    $resources: [ResourceWhereUniqueInput!]
    $assignments: [AssignmentWhereUniqueInput!]
    $tasks: [TaskWhereUniqueInput!]
    $studies: [StudyWhereUniqueInput!]
  ) {
    updateProposalCard(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        internalContent: $internalContent
        content: $content
        revisedContent: $revisedContent
        comment: $comment
        settings: $settings
        assignedTo: { set: $assignedTo }
        type: $type
        shareType: $shareType
        resources: { set: $resources }
        assignments: { set: $assignments }
        tasks: { set: $tasks }
        studies: { set: $studies }
      }
    ) {
      id
      title
      description
      content
      comment
      settings
      assignedTo {
        id
      }
      resources {
        id
      }
      assignments {
        id
      }
      tasks {
        id
      }
      studies {
        id
      }
    }
  }
`;

// update card edit information
export const UPDATE_CARD_EDIT = gql`
  mutation UPDATE_CARD_EDIT($id: ID!, $input: ProposalCardUpdateInput!) {
    updateProposalCard(where: { id: $id }, data: $input) {
      id
    }
  }
`;

export const DELETE_CARD = gql`
  mutation DELETE_CARD($id: ID!) {
    deleteProposalCard(where: { id: $id }) {
      id
      section {
        id
      }
    }
  }
`;

export const DELETE_COMPLETE_PROPOSAL = gql`
  mutation DELETE_COMPLETE_PROPOSAL($id: ID!) {
    deleteProposal(id: $id) {
      id
    }
  }
`;

// update a project board
export const UPDATE_PROJECT_BOARD = gql`
  mutation UPDATE_PROJECT_BOARD($id: ID!, $input: ProposalBoardUpdateInput!) {
    updateProposalBoard(where: { id: $id }, data: $input) {
      id
    }
  }
`;

// remove (hide) study by author
export const HIDE_PROJECT = gql`
  mutation HIDE_PROJECT($id: ID!) {
    updateProposalBoard(where: { id: $id }, data: { isHidden: true }) {
      id
    }
  }
`;

export const UPDATE_PROPOSAL_CARD = gql`
  mutation UpdateProposalCard(
    $where: ProposalCardWhereUniqueInput!
    $data: ProposalCardUpdateInput!
  ) {
    updateProposalCard(where: $where, data: $data) {
      id
    }
  }
`;

export const CREATE_NEW_PROPOSAL_AS_AUTHOR = gql`
  mutation CREATE_NEW_PROPOSAL_AS_AUTHOR(
    $title: String!
    $description: String
    $settings: JSON
    $authorId: ID!
  ) {
    createProposalBoard(
      data: {
        title: $title
        description: $description
        settings: $settings
        author: { connect: { id: $authorId } }
      }
    ) {
      id
    }
  }
`;
