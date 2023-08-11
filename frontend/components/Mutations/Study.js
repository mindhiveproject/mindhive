import gql from "graphql-tag";

// create new study
export const CREATE_STUDY = gql`
  mutation CREATE_STUDY(
    $title: String!
    $slug: String
    $shortDescription: String
    $description: String
    $settings: JSON
    $info: JSON
    $diagram: String
    $classes: [ClassWhereUniqueInput!]
    $file: Upload
  ) {
    createStudy(
      data: {
        title: $title
        slug: $slug
        shortDescription: $shortDescription
        description: $description
        settings: $settings
        info: $info
        diagram: $diagram
        classes: { connect: $classes }
        image: { create: { image: $file, altText: $title } }
      }
    ) {
      id
    }
  }
`;

export const UPDATE_STUDY = gql`
  mutation UPDATE_STUDY($id: ID!, $input: StudyUpdateInput!) {
    updateStudy(where: { id: $id }, data: $input) {
      id
    }
  }
`;

// update a study
// export const UPDATE_STUDY = gql`
//   mutation UPDATE_STUDY(
//     $id: ID!
//     $title: String
//     $slug: String
//     $shortDescription: String
//     $description: String
//     $settings: JSON
//     $info: JSON
//     $collaborators: [ProfileWhereUniqueInput!]
//     $classes: [ClassWhereUniqueInput!]
//     $consent: [ConsentWhereUniqueInput!]
//     $diagram: String
//     $components: JSON
//     $file: Upload
//   ) {
//     updateStudy(
//       where: { id: $id }
//       data: {
//         title: $title
//         slug: $slug
//         shortDescription: $shortDescription
//         description: $description
//         settings: $settings
//         info: $info
//         collaborators: { set: $collaborators }
//         classes: { set: $classes }
//         consent: { set: $consent }
//         diagram: $diagram
//         components: $components
//         image: { create: { image: $file, altText: $title } }
//       }
//     ) {
//       id
//     }
//   }
// `;

// change the author of a study
export const CHANGE_STUDY_AUTHOR = gql`
  mutation CHANGE_STUDY_AUTHOR($studyId: ID!, $authorId: ID!) {
    updateStudy(
      where: { id: $studyId }
      data: { author: { connect: { id: $authorId } } }
    ) {
      id
    }
  }
`;

// remove (hide) study by author
export const HIDE_STUDY = gql`
  mutation HIDE_STUDY($id: ID!) {
    updateStudy(where: { id: $id }, data: { isHidden: true }) {
      id
    }
  }
`;

// archive the study
export const ARCHIVE_STUDY = gql`
  mutation ARCHIVE_STUDY($study: ID!, $isArchived: Boolean!) {
    archiveStudy(study: $study, isArchived: $isArchived) {
      id
    }
  }
`;
