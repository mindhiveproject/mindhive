import gql from "graphql-tag";

// The bank grid. Deliberately does NOT ask for `codeFiles` or `docs` — the
// whole point of moving source text onto a child list was to keep it off the
// rows a list view projects.
export const MY_VISUALS = gql`
  query MY_VISUALS($where: VisualWhereInput) {
    visuals(where: $where, orderBy: [{ lastTimeEdited: desc }, { createdAt: desc }]) {
      id
      title
      description
      privacy
      published
      participationMode
      createdAt
      lastTimeEdited
      cover {
        url
      }
      author {
        id
        username
        firstName
        lastName
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
      }
      collaborators {
        id
        username
      }
      viewers {
        id
        username
      }
      likes {
        id
      }
    }
  }
`;

// Everything the builder shell needs in one round trip.
export const VISUAL = gql`
  query VISUAL($id: ID!) {
    visual(where: { id: $id }) {
      id
      title
      description
      privacy
      published
      participationMode
      includeInStudies
      docs
      docsVisible
      parameters
      createdAt
      lastTimeEdited
      cover {
        url
      }
      code {
        url
      }
      author {
        id
        username
      }
      collaborators {
        id
        username
      }
      viewers {
        id
        username
      }
      codeFiles {
        id
        name
        language
        role
        order
        content
        lastTimeEdited
      }
    }
  }
`;

// Powers the collaborator search in the Settings tab's Editing section.
export const SEARCH_PROFILES = gql`
  query SEARCH_PROFILES($search: String!) {
    profiles(where: { username: { contains: $search } }, take: 8) {
      id
      username
    }
  }
`;

// Authored visuals offered to studies, for the study builder's block bank. The
// caller narrows it: published ones and your own, or the ones you've starred.
// Each runs as the p5 Task the Visual hook keeps for it, which is what a flow
// node points at; the data sources are shown so a researcher knows which
// devices the study has to link.
export const STUDY_VISUALS = gql`
  query STUDY_VISUALS($where: VisualWhereInput) {
    visuals(where: $where, orderBy: [{ title: asc }]) {
      id
      title
      description
      author {
        id
      }
      tasks(
        where: { runtimeType: { equals: P5 } }
        orderBy: [{ createdAt: asc }]
        take: 1
      ) {
        id
        title
        description
        taskType
        runtimeType
        author {
          id
        }
        collaborators {
          id
        }
      }
      dataSources(orderBy: [{ order: asc }]) {
        id
        label
        block {
          id
          title
        }
      }
    }
  }
`;
