import gql from "graphql-tag";

// get a post
export const STUDY_SPECS = gql`
  query STUDY_SPECS($studyId: ID!) {
    specs(where: { 
      studies: { some: { id: { equals: $studyId } } }
    }) {
      id
      title
      description
      content
      settings
      isPublic
      isTemplate
      isFeatured
    }
  }
`;
