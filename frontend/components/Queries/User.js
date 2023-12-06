import gql from "graphql-tag";

// get the current user
export const CURRENT_USER_QUERY = gql`
  query {
    authenticatedItem {
      ... on Profile {
        id
        username
        email
        publicId
        publicReadableId
        type
        permissions {
          name
        }
        image {
          id
          image {
            publicUrlTransformed
          }
        }
        studiesInfo
        participantIn {
          id
        }
        bio
        location
        language
      }
    }
  }
`;

// get the information about user's classes
export const GET_USER_CLASSES = gql`
  query {
    authenticatedItem {
      ... on Profile {
        id
        studentIn {
          id
          title
          code
          networks {
            classes {
              id
              title
              code
            }
          }
        }
        teacherIn {
          id
          title
          code
          networks {
            classes {
              id
              title
              code
            }
          }
        }
        mentorIn {
          id
          title
          code
          networks {
            classes {
              id
              title
              code
            }
          }
        }
      }
    }
  }
`;

// get the information about studies the user participated in
export const GET_USER_STUDIES = gql`
  query {
    authenticatedItem {
      ... on Profile {
        id
        studiesInfo
        participantIn {
          id
        }
      }
    }
  }
`;

// get user study information
// export const GET_USER_STUDY_INFO = gql`
//   query {
//     authenticatedItem {
//       ... on Profile {
//         studiesInfo
//       }
//     }
//   }
// `;

export const GET_USERNAMES = gql`
  query GET_USERNAMES {
    profiles {
      id
      username
    }
  }
`;

// get user information
export const GET_USER = gql`
  query GET_USER($id: String!) {
    profile(where: { publicId: $id }) {
      id
      username
      publicId
      publicReadableId
      email
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      studiesInfo
      participantIn {
        id
        title
        slug
      }
      # results {
      #   id
      #   payload
      #   study {
      #     id
      #   }
      #   testVersion
      #   createdAt
      # }
      researcherIn {
        title
        slug
        createdAt
        updatedAt
      }
      collaboratorInStudy {
        title
        slug
        createdAt
        updatedAt
      }
      reviews {
        id
        createdAt
        study {
          slug
          title
        }
        proposal {
          slug
        }
        content
        stage
      }
      journals {
        id
        code
        title
        description
        creator {
          id
          username
        }
        createdAt
        posts {
          id
        }
      }
      authorOfHomework {
        id
        code
        title
        createdAt
        updatedAt
        assignment {
          title
        }
      }
    }
  }
`;

// get study participants
export const GET_STUDY_PARTICIPANTS = gql`
  query GET_STUDY_PARTICIPANTS($id: ID!) {
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
      participants {
        id
        publicId
        publicReadableId
        type
        studiesInfo
      }
      guests {
        id
        publicId
        publicReadableId
        type
        studiesInfo
      }
    }
  }
`;

// get study participant
export const GET_PARTICIPANT = gql`
  query GET_PARTICIPANT($id: ID!) {
    profile(where: { id: $id }) {
      id
      publicId
      publicReadableId
      studiesInfo
      participantIn {
        id
        title
        slug
      }
    }
  }
`;

// get person profile by a slug
export const PUBLIC_USER_QUERY = gql`
  query PUBLIC_USER_QUERY($id: String) {
    profile(where: { publicId: $id }) {
      id
      username
      email
      publicId
      publicReadableId
      type
      permissions {
        name
      }
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      studiesInfo
      participantIn {
        id
      }
      bio
      location
      language
    }
  }
`;

////////////////////////////////////////////////
// to do from here

// get short updates for notifying the user
export const GET_UPDATES = gql`
  query {
    authenticatedItem {
      ... on User {
        id
        updates {
          id
          type
          new
          from {
            id
          }
        }
      }
    }
  }
`;

// get full updates for the news page
export const GET_FULL_UPDATES = gql`
  query {
    authenticatedItem {
      ... on User {
        id
        updates {
          id
          dateCreated
          information
          type
          new
          from {
            id
            name
            slug
            image {
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

// query to get the id of the other person
export const GET_PERSON_ID = gql`
  query GET_PERSON_ID($slug: String!) {
    users(where: { slug: { equals: $slug } }) {
      id
      name
    }
  }
`;

// get users
export const PUBLIC_USERS_QUERY = gql`
  query PUBLIC_USERS_QUERY($skip: Int = 0, $take: Int) {
    users(
      take: $take
      skip: $skip
      where: {
        status: { equals: "ARTIST" }
        isAccountApproved: { equals: true }
      }
    ) {
      id
      name
      slug
      bio
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      editionsOwned {
        id
      }
      artworksCreated {
        id
      }
      dateCreated
      followedBy {
        id
      }
    }
  }
`;

// query all users that a user follows
export const MY_FOLLOWING_USERS_QUERY = gql`
  query {
    authenticatedItem {
      ... on User {
        id
        usersFollowed {
          id
          name
          slug
          email
          image {
            id
            image {
              publicUrlTransformed
            }
          }
          editionsOwned {
            id
          }
          artworksCreated {
            id
          }
          dateCreated
          followedBy {
            id
          }
        }
      }
    }
  }
`;

// get the current user
export const LIGHT_USER_QUERY = gql`
  query {
    authenticatedItem {
      ... on User {
        id
        name
        walletAddress
        status
        isAccountApproved
        image {
          image {
            publicUrlTransformed
          }
        }
      }
    }
  }
`;

// query to get the id of the other person by wallet address
export const GET_PERSON_ID_BY_WALLET = gql`
  query GET_PERSON_ID_BY_WALLET($walletAddress: String!) {
    user(where: { walletAddress: $walletAddress }) {
      id
      name
    }
  }
`;
