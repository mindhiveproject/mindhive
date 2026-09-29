import gql from "graphql-tag";

// create new class
export const CREATE_CLASS = gql`
  mutation CREATE_CLASS(
    $code: String!
    $title: String!
    $description: String
    $settings: JSON
  ) {
    createClass(
      data: {
        code: $code
        title: $title
        description: $description
        settings: $settings
      }
    ) {
      id
    }
  }
`;

// edit class
export const EDIT_CLASS = gql`
  mutation EDIT_CLASS(
    $id: ID!
    $title: String
    $description: String
    $settings: JSON
    $templateProposal: ProposalBoardRelateToOneForUpdateInput
  ) {
    updateClass(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        settings: $settings
        templateProposal: $templateProposal
      }
    ) {
      id
      templateProposal {
        id
      }
    }
  }
`;

export const UPDATE_CLASS_TEACHING_TEAM = gql`
  mutation UPDATE_CLASS_TEACHING_TEAM(
    $id: ID!
    $teachingTeam: ProfileRelateToManyForUpdateInput
  ) {
    updateClass(where: { id: $id }, data: { teachingTeam: $teachingTeam }) {
      id
      teachingTeam {
        id
        username
        email
        firstName
        lastName
      }
    }
  }
`;

// delete class
export const DELETE_CLASS = gql`
  mutation DELETE_CLASS($id: ID!) {
    deleteClass(where: { id: $id }) {
      id
    }
  }
`;

// Roster and project changes update the Class / ProposalBoard side: a
// student's Profile is only writable by its owner (or an admin).

// remove a student from class
export const REMOVE_STUDENT_FROM_CLASS = gql`
  mutation REMOVE_STUDENT_FROM_CLASS($studentId: ID!, $classId: ID!) {
    updateClass(
      where: { id: $classId }
      data: { students: { disconnect: { id: $studentId } } }
    ) {
      id
    }
  }
`;

// assign a student to a class
export const ASSIGN_STUDENT_TO_CLASS = gql`
  mutation ASSIGN_STUDENT_TO_CLASS($studentId: ID!, $classId: ID!) {
    updateClass(
      where: { id: $classId }
      data: { students: { connect: { id: $studentId } } }
    ) {
      id
    }
  }
`;

// remove a mentor from class
export const REMOVE_MENTOR_FROM_CLASS = gql`
  mutation REMOVE_MENTOR_FROM_CLASS($mentorId: ID!, $classId: ID!) {
    updateClass(
      where: { id: $classId }
      data: { mentors: { disconnect: { id: $mentorId } } }
    ) {
      id
    }
  }
`;

// assign a student to a project, or remove them ($input is the
// ProposalBoard.collaborators relation update)
export const ASSIGN_STUDENT_TO_PROJECT = gql`
  mutation ASSIGN_STUDENT_TO_PROJECT(
    $projectId: ID!
    $input: ProfileRelateToManyForUpdateInput!
  ) {
    updateProposalBoard(
      where: { id: $projectId }
      data: { collaborators: $input }
    ) {
      id
    }
  }
`;
