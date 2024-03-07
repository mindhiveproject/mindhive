import gql from "graphql-tag";

// get all part templates for cloning
export const VIZPART_TEMPLATES = gql`
  query VIZPART_TEMPLATES {
    vizParts(where: { isTemplate: { equals: true } }) {
      id
      title
      description
      dataOrigin
      isTemplate
      settings
      content
      vizChapters {
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
      createdAt
      updatedAt
    }
  }
`;
