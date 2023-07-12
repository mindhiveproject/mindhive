import gql from "graphql-tag";

// sign up with google
export const GOOGLE_SIGNUP = gql`
  mutation GOOGLE_SIGNUP($token: String!, $role: String, $classCode: String) {
    googleSignup(token: $token, role: $role, classCode: $classCode) {
      id
      username
      email
    }
  }
`;

// log  up with google
export const GOOGLE_LOGIN = gql`
  mutation GOOGLE_LOGIN($token: String!) {
    googleLogin(token: $token) {
      id
      username
      email
    }
  }
`;
