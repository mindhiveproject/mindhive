import gql from "graphql-tag";

// Lightweight onboarding state for sponsor accounts. Used by the dashboard
// home to show setup guidance until the user has completed profile, org,
// network, and opportunity steps.
export const SPONSOR_ONBOARDING_STATE = gql`
  query SPONSOR_ONBOARDING_STATE {
    authenticatedItem {
      ... on Profile {
        id
        email
        firstName
        lastName
        profileType
        organization
        bio
        permissions {
          name
        }
        organizations {
          id
          name
          memberOfClassNetworks {
            id
            title
          }
        }
        adminOfOrganizations {
          id
          name
        }
        organizationsCreated {
          id
          name
        }
        memberOfClassNetworks {
          id
          publicId
          title
        }
        adminOfClassNetworks {
          id
          publicId
          title
        }
        classNetworksCreated {
          id
          publicId
          title
        }
        opportunitiesCreated {
          id
        }
      }
    }
  }
`;

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
          canManageForms
        }
        image {
          id
          keystoneImage {
            id
            url
          }
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
        classNetworksCreated {
          id
          publicId
          title
        }
        adminOfClassNetworks {
          id
          publicId
          title
        }
        adminOfOrganizations {
          id
          name
        }
        memberOfClassNetworks {
          id
          publicId
          title
        }
        connectRoundsReviewing {
          id
        }
        favoriteTasks {
          id
        }
        favoritePeople {
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
          createdAt
          networks {
            classes {
              id
              title
              code
            }
          }
          templateProposal {
            id
            title
            settings
          }
          classTemplateBoards {
            id
            title
            settings
          }
        }
        teacherIn {
          id
          title
          code
          createdAt
          networks {
            classes {
              id
              title
              code
            }
          }
          templateProposal {
            id
          }
          classTemplateBoards {
            id
            title
          }
        }
        mentorIn {
          id
          title
          code
          createdAt
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
        keystoneImage {
          id
          url
        }
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
      authorOfProposal {
        id
        title
        isMain
        isHidden
        createdAt
        updatedAt
      }
      collaboratorInProposal {
        id
        title
        isMain
        isHidden
        createdAt
        updatedAt
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
        studyStatus
        studyVersion
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
        studyStatus
        studyVersion
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
        keystoneImage {
          id
          url
        }
        image {
          publicUrlTransformed
        }
      }
      studiesInfo
      participantIn {
        id
      }
      pronouns
      bio
      location
      organization
      department
      tagline
      introVideo
      passion
      involvement
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
        title
        slug
        description
      }
      organizations {
        id
        name
        tagline
        logo {
          url
        }
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
        AND: [{ isPublic: { equals: true } }]
        OR: [
          { username: { contains: $search } }
          { publicReadableId: { contains: $search } }
          { publicId: { contains: $search } }
          { firstName: { contains: $search } }
          { lastName: { contains: $search } }
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
        keystoneImage {
          id
          url
        }
        image {
          publicUrlTransformed
        }
      }
      location
      organization
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

// Shared search filter for Connect Bank list + pagination count queries.
const CONNECT_USERS_SEARCH_OR = `
        OR: [
          { username: { contains: $search, mode: insensitive } }
          { publicReadableId: { contains: $search, mode: insensitive } }
          { publicId: { contains: $search, mode: insensitive } }
          { firstName: { contains: $search, mode: insensitive } }
          { lastName: { contains: $search, mode: insensitive } }
          { location: { contains: $search, mode: insensitive } }
          { organization: { contains: $search, mode: insensitive } }
          { bio: { contains: $search, mode: insensitive } }
          { bioInformal: { contains: $search, mode: insensitive } }
          { interests: { some: { title: { contains: $search, mode: insensitive } } } }
        ]`;

// query to get public non-student users for Connect Bank
export const GET_CONNECT_USERS = gql`
  query GET_CONNECT_USERS($skip: Int, $take: Int, $search: String) {
    profiles(
      skip: $skip
      take: $take
      where: {
        AND: [
          { isPublic: { equals: true } }
          {
            permissions: {
              some: {
                name: { in: ["ADMIN", "TEACHER", "SCIENTIST", "MENTOR"] }
              }
            }
          }
        ]
        ${CONNECT_USERS_SEARCH_OR}
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
        keystoneImage {
          id
          url
        }
        image {
          publicUrlTransformed
        }
      }
      location
      organization
      occupation
      tagline
      organizations {
        id
        name
        logo {
          url
        }
      }
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

// count public non-student users for Connect Bank pagination
export const PAGINATION_CONNECT_USERS_QUERY = gql`
  query PAGINATION_CONNECT_USERS_QUERY($search: String) {
    profilesCount(
      where: {
        AND: [
          { isPublic: { equals: true } }
          { NOT: { permissions: { some: { name: { equals: "STUDENT" } } } } }
        ]
        ${CONNECT_USERS_SEARCH_OR}
      }
    )
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
        keystoneImage {
          id
          url
        }
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

// query all users that a user follows
export const MY_FAVORITE_PEOPLE = gql`
  query {
    authenticatedItem {
      ... on Profile {
        id
        favoritePeople {
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
            keystoneImage {
              id
              url
            }
            image {
              publicUrlTransformed
            }
          }
          location
          organization
          occupation
          tagline
          organizations {
            id
            name
            logo {
              url
            }
          }
          interests {
            id
            title
          }
          bioInformal
          firstName
          lastName
        }
      }
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
              keystoneImage {
                id
                url
              }
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
        keystoneImage {
          id
          url
        }
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
          keystoneImage {
            id
            url
          }
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
          keystoneImage {
            id
            url
          }
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
        website
        publicMail
        bio
        bioInformal
        location
        organization
        department
        primaryDomain
        timeCommitment
        tagline
        passion
        involvement
        languages
        introVideo
        occupation
        education
        mentorPreferGrade
        mentorPreferGroup
        mentorPreferClass
        publicMail
        interests {
          id
        }
        organizations {
          id
          name
          tagline
          department
          website
          location
          mission
          primaryDomain
          verified
          memberOfClassNetworks {
            id
            title
          }
          logo {
            url
          }
          interests {
            id
          }
          members {
            id
            username
            firstName
            lastName
            email
            image {
              keystoneImage {
                url
              }
              image {
                publicUrlTransformed
              }
            }
          }
        }
        memberOfClassNetworks {
          id
          title
        }
        organizationsCreated {
          id
          name
          tagline
          department
          website
          location
          mission
          primaryDomain
          verified
          logo {
            url
          }
          interests {
            id
          }
        }
        adminOfOrganizations {
          id
          name
          tagline
          department
          website
          location
          mission
          primaryDomain
          verified
          logo {
            url
          }
          interests {
            id
          }
          members {
            id
            username
            firstName
            lastName
            email
            image {
              keystoneImage {
                url
              }
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
