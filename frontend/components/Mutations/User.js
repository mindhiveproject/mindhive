import gql from "graphql-tag";

// sign up
export const SIGNUP_MUTATION = gql`
  mutation SIGNUP_MUTATION($input: ProfileCreateInput!) {
    createProfile(data: $input) {
      id
      username
      email
    }
  }
`;

// sign in
export const SIGNIN_MUTATION = gql`
  mutation SIGNIN_MUTATION($email: String!, $password: String!) {
    authenticateProfileWithPassword(email: $email, password: $password) {
      ... on ProfileAuthenticationWithPasswordSuccess {
        item {
          id
        }
      }
      ... on ProfileAuthenticationWithPasswordFailure {
        message
      }
    }
  }
`;

// send password reset link
export const REQUEST_RESET_MUTATION = gql`
  mutation REQUEST_RESET_MUTATION($email: String!) {
    sendProfilePasswordResetLink(email: $email)
  }
`;

// sign out
export const SIGN_OUT_MUTATION = gql`
  mutation {
    endSession
  }
`;

// update information about user
export const UPDATE_USER = gql`
  mutation UPDATE_USER($id: ID!, $email: String, $username: String) {
    updateProfile(
      where: { id: $id }
      data: { email: $email, username: $username }
    ) {
      id
    }
  }
`;

// update image of the profile
export const UPDATE_PROFILE_IMAGE = gql`
  mutation UPDATE_PROFILE_IMAGE($id: ID!, $image: Upload) {
    updateProfile(
      where: { id: $id }
      data: { image: { create: { image: $image } } }
    ) {
      id
    }
  }
`;

// join the study as a participant
export const JOIN_STUDY_MUTATION = gql`
  mutation JOIN_STUDY_MUTATION($id: ID!, $studyId: ID!) {
    updateProfile(
      where: { id: $id }
      data: { participantIn: { connect: { id: $studyId } } }
    ) {
      id
    }
  }
`;

// join the class as a student
export const JOIN_CLASS_MUTATION = gql`
  mutation JOIN_CLASS_MUTATION($id: ID!, $classCode: String!) {
    updateProfile(
      where: { id: $id }
      data: { studentIn: { connect: { code: $classCode } } }
    ) {
      id
    }
  }
`;

// reset password
export const RESET_MUTATION = gql`
  mutation RESET_MUTATION(
    $email: String!
    $password: String!
    $token: String!
  ) {
    redeemUserPasswordResetToken(
      email: $email
      password: $password
      token: $token
    ) {
      code
      message
    }
  }
`;

// follow user
export const FOLLOW_USER_MUTATION = gql`
  mutation FOLLOW_USER_MUTATION($id: ID!, $userId: ID!) {
    updateUser(
      where: { id: $id }
      data: { followedBy: { connect: { id: $userId } } }
    ) {
      id
    }
  }
`;

// unfollow user
export const UNFOLLOW_USER_MUTATION = gql`
  mutation UNFOLLOW_USER_MUTATION($id: ID!, $userId: ID!) {
    updateUser(
      where: { id: $id }
      data: { followedBy: { disconnect: { id: $userId } } }
    ) {
      id
    }
  }
`;

// update user study information
export const UPDATE_USER_STUDY_INFO = gql`
  mutation UPDATE_USER_STUDY_INFO($id: ID!, $studiesInfo: JSON) {
    updateProfile(where: { id: $id }, data: { studiesInfo: $studiesInfo }) {
      id
    }
  }
`;
