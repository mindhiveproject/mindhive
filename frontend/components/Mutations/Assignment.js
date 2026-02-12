import gql from "graphql-tag";

// create assignment
export const CREATE_ASSIGNMENT = gql`
  mutation CREATE_ASSIGNMENT($input: AssignmentCreateInput!) {
    createAssignment(data: $input) {
      id
    }
  }
`;

// edit assignment
export const EDIT_ASSIGNMENT = gql`
  mutation EDIT_ASSIGNMENT($id: ID!, $input: AssignmentUpdateInput!) {
    updateAssignment(where: { id: $id }, data: $input) {
      id
    }
  }
`;

// delete assignment
export const DELETE_ASSIGNMENT = gql`
  mutation DELETE_ASSIGNMENT($id: ID!) {
    deleteAssignment(where: { id: $id }) {
      id
    }
  }
`;

// link assignment to a template card (and propagate to student boards)
export const LINK_ASSIGNMENT_TO_TEMPLATE_CARD = gql`
  mutation LINK_ASSIGNMENT_TO_TEMPLATE_CARD(
    $assignmentId: ID!
    $templateCardId: ID!
    $classId: ID!
  ) {
    linkAssignmentToTemplateCard(
      assignmentId: $assignmentId
      templateCardId: $templateCardId
      classId: $classId
    ) {
      id
    }
  }
`;
