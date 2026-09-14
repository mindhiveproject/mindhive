import gql from "graphql-tag";

// The catalog of reusable real-time data sources (yq-data pipeline graphs).
// Distinct from Queries/Datasource.js, which is the Data-Tool tabular list.
export const DATA_SOURCE_BLOCKS = gql`
  query DATA_SOURCE_BLOCKS {
    dataSourceBlocks(
      where: { published: { equals: true } }
      orderBy: [{ title: asc }]
    ) {
      id
      title
      slug
      description
      requirementLabel
      isOfficial
      inputs
      outputs
      settingsSchema
      version
      author {
        id
      }
      favoritedBy {
        id
      }
    }
  }
`;

// The data sources linked into one study, in the order they run.
export const STUDY_DATA_SOURCES = gql`
  query STUDY_DATA_SOURCES($studyId: ID!) {
    studyDataSources(
      where: { study: { id: { equals: $studyId } } }
      orderBy: [{ order: asc }]
    ) {
      id
      label
      order
      inputBindings
      settings
      scope
      block {
        id
        title
        slug
        description
        requirementLabel
        inputs
        outputs
        settingsSchema
        graph
        version
        author {
          id
        }
        favoritedBy {
          id
        }
      }
    }
  }
`;
