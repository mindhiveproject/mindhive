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
        studentIn {
          id
        }
        teacherIn {
          id
        }
        mentorIn {
          id
        }
        favoriteTasks {
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

export const GET_USERNAMES_WHERE = gql`
  query GET_USERNAMES_WHERE($input: ProfileWhereInput!) {
    profiles(where: $input) {
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
        flow
      }
      datasets {
        id
        isCompleted
        study {
          id
        }
        testVersion
        createdAt
        completedAt
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

// get study participants for Test & Collect
export const GET_STUDY_PARTICIPANTS = gql`
  query GET_STUDY_PARTICIPANTS($studyId: ID!) {
    profiles(where: { participantIn: { some: { id: { equals: $studyId } } } }) {
      id
      publicId
      publicReadableId
      type
      info
      generalInfo
      studiesInfo
      datasets {
        isCompleted
        isIncluded
        token
        study {
          id
        }
      }
    }
  }
`;

export const GET_STUDY_GUESTS = gql`
  query GET_STUDY_GUESTS($studyId: ID!) {
    guests(where: { participantIn: { some: { id: { equals: $studyId } } } }) {
      id
      publicId
      publicReadableId
      type
      info
      generalInfo
      studiesInfo
      datasets {
        isCompleted
        isIncluded
        token
        study {
          id
        }
      }
    }
  }
`;

// get study user participant
export const GET_USER_PARTICIPANT = gql`
  query GET_USER_PARTICIPANT($publicId: String!) {
    profile(where: { publicId: $publicId }) {
      id
      publicId
      publicReadableId
      info
      generalInfo
      studiesInfo
      participantIn {
        id
        title
        slug
      }
    }
  }
`;

// get study guest participant
export const GET_GUEST_PARTICIPANT = gql`
  query GET_GUEST_PARTICIPANT($publicId: String!) {
    guest(where: { publicId: $publicId }) {
      id
      publicId
      publicReadableId
      info
      generalInfo
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
      firstName
      lastName
      bioInformal
      languages
      occupation
      education
      mentorPreferGrade
      mentorPreferGroup
      mentorPreferClass
      interests {
        id
      }
    }
  }
`;

// query to get all users for admin overview
export const GET_ALL_USERS = gql`
  query GET_ALL_USERS($skip: Int, $take: Int, $search: String) {
    profiles(
      skip: $skip
      take: $take
      where: {
        OR: [
          { username: { contains: $search } }
          { publicReadableId: { contains: $search } }
          { publicId: { contains: $search } }
        ]
      }
    ) {
      id
      username
      email
      publicId
      publicReadableId
      permissions {
        name
      }
      dateCreated
      image {
        image {
          publicUrlTransformed
        }
      }
      location
      interests {
        id
        title
      }
      bioInformal
      firstName
      lastName
    }
  }
`;

// count all users
export const PAGINATION_USERS_QUERY = gql`
  query PAGINATION_USERS_QUERY($search: String) {
    profilesCount(
      where: {
        OR: [
          { username: { contains: $search } }
          { publicReadableId: { contains: $search } }
          { publicId: { contains: $search } }
        ]
      }
    )
  }
`;

// download user data for admins
export const GET_USERS_DATA = gql`
  query GET_USERS_DATA($ids: [ID!]) {
    profiles(where: { id: { in: $ids } }) {
      id
      username

      studentIn {
        id
        code
        title
        description
        creator {
          username
        }
      }

      authorOfHomework {
        title
        assignment {
          title
        }
        content
        createdAt
        settings
        public
      }

      journals {
        title
        description
        settings
        createdAt
        posts {
          title
          content
          settings
          createdAt
        }
      }

      memberOfTalk {
        settings
        classes {
          title
        }
        studies {
          title
        }
        members {
          username
        }
        words {
          message
          settings
          isMain
          children {
            message
            settings
            isMain
            author {
              username
            }
            createdAt
          }
          author {
            username
          }
          createdAt
          updatedAt
        }
      }

      info
      generalInfo
      studiesInfo
      tasksInfo
      consentsInfo

      participantIn {
        id
        title
        slug
        shortDescription
        description
        flow
        settings
        collaborators {
          username
        }
        classes {
          title
        }
        createdAt
        updatedAt
      }

      researcherIn {
        id
        title
        slug
        shortDescription
        description
        flow
        settings
        collaborators {
          username
        }
        classes {
          title
        }
        proposal {
          slug
          sections {
            cards {
              title
              content
              createdAt
              updatedAt
            }
          }
          reviews {
            author {
              publicReadableId
            }
            settings
            content
            createdAt
          }
        }
        createdAt
        updatedAt
      }

      collaboratorInStudy {
        id
        title
        slug
        shortDescription
        description
        flow
        settings
        collaborators {
          username
        }
        classes {
          title
        }
        proposal {
          slug
          sections {
            cards {
              title
              content
              createdAt
              updatedAt
            }
          }
          reviews {
            author {
              publicReadableId
            }
            settings
            content
            createdAt
          }
        }
        createdAt
        updatedAt
      }

      reviews {
        study {
          title
        }
        settings
        content
        createdAt
      }
    }
  }
`;

// get public profile by username
export const GET_PUBLIC_PROFILE = gql`
  query GET_PUBLIC_PROFILE($username: String) {
    profile(where: { username: $username }) {
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

// query the full profile of the user
export const GET_PROFILE = gql`
  query {
    authenticatedItem {
      ... on Profile {
        id
        firstName
        lastName
        username
        email
        pronouns
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
        studentIn {
          id
        }
        teacherIn {
          id
        }
        mentorIn {
          id
        }
        profileType
        bio
        bioInformal
        location
        languages
        introVideo
        occupation
        education
        mentorPreferGrade
        mentorPreferGroup
        mentorPreferClass
        interests {
          id
        }
      }
    }
  }
`;
