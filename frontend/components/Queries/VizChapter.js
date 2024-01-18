import gql from "graphql-tag";

// get all chapter templates for cloning
export const VIZCHAPTER_TEMPLATES = gql`
  query VIZCHAPTER_TEMPLATES {
    vizChapters(where: { isTemplate: { equals: true } }) {
      id
      title
      description
      vizSections {
        id
        title
        description
        type
        content
      }
    }
  }
`;
