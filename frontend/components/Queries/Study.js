import gql from "graphql-tag";

// get featured studies
export const FEATURED_STUDIES = gql`
  query FEATURED_STUDIES {
    studies(where: { featured: { equals: true } }) {
      id
      title
      slug
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      description
    }
  }
`;

// get public studies
export const PUBLIC_STUDIES = gql`
  query PUBLIC_STUDIES {
    studies(where: { public: { equals: true } }) {
      id
      title
      slug
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      description
    }
  }
`;

// get my studies
export const MY_STUDIES = gql`
  query MY_STUDIES($id: ID!) {
    studies(
      where: {
        isHidden: { equals: false }
        OR: [
          { author: { id: { equals: $id } } }
          { collaborators: { some: { id: { equals: $id } } } }
        ]
      }
    ) {
      id
      title
      slug
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      description
      author {
        id
        username
      }
    }
  }
`;

// get my study
export const MY_STUDY = gql`
  query MY_STUDY($id: ID!) {
    study(where: { id: $id }) {
      id
      title
      slug
      info
      settings
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      shortDescription
      description
      proposal {
        id
        title
      }
      author {
        id
        username
      }
      collaborators {
        id
        username
      }
      classes {
        id
      }
      consent {
        id
      }
      talks {
        id
      }
      diagram
      components
      flow
      descriptionInProposalCard {
        id
        title
        description
        section {
          id
          board {
            id
            title
          }
        }
      }
      tags {
        id
        title
      }
    }
  }
`;

// get study to see the information about the study
export const STUDY_TO_DISCOVER = gql`
  query STUDY_TO_DISCOVER($slug: String!) {
    study(where: { slug: $slug }) {
      id
      title
      slug
      settings
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      description
      info
      flow
    }
  }
`;

// get study to join it
export const STUDY_TO_JOIN = gql`
  query STUDY_TO_JOIN($id: ID!) {
    study(where: { id: $id }) {
      id
      title
      slug
      description
      settings
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      info
      collaborators {
        id
        username
      }
      author {
        id
      }
      consent {
        id
        title
        organization
        info
        settings
        studies {
          id
          title
          public
        }
        tasks {
          id
          title
        }
      }
      components
      flow
    }
  }
`;

// get study to clone
export const STUDY_TO_CLONE = gql`
  query STUDY_TO_CLONE($slug: String!) {
    study(where: { slug: $slug }) {
      id
      title
      slug
      image {
        id
        image {
          publicUrlTransformed
        }
      }
      description
    }
  }
`;
