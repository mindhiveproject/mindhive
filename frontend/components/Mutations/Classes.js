import gql from "graphql-tag";

// create new class
export const CREATE_CLASS = gql`
  mutation CREATE_CLASS($code: String!, $title: String!, $description: String) {
    createClass(
      data: { code: $code, title: $title, description: $description }
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
  ) {
    updateClass(
      where: { id: $id }
      data: { title: $title, description: $description, settings: $settings }
    ) {
      id
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

// remove a student from class
export const REMOVE_STUDENT_FROM_CLASS = gql`
  mutation REMOVE_STUDENT_FROM_CLASS($studentId: ID!, $classId: ID!) {
    updateProfile(
      where: { id: $studentId }
      data: { studentIn: { disconnect: { id: $classId } } }
    ) {
      id
    }
  }
`;

// assign a student to a class
export const ASSIGN_STUDENT_TO_CLASS = gql`
  mutation ASSIGN_STUDENT_TO_CLASS($studentId: ID!, $classId: ID!) {
    updateProfile(
      where: { id: $studentId }
      data: { studentIn: { connect: { id: $classId } } }
    ) {
      id
    }
  }
`;

// remove a mentor from class
export const REMOVE_MENTOR_FROM_CLASS = gql`
  mutation REMOVE_MENTOR_FROM_CLASS($mentorId: ID!, $classId: ID!) {
    updateProfile(
      where: { id: $mentorId }
      data: { mentorIn: { disconnect: { id: $classId } } }
    ) {
      id
    }
  }
`;
