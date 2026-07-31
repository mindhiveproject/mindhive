import { gql } from "@apollo/client";

// Shared fields for OpportunityReviewNote create/update responses.
const REVIEW_NOTE_FIELDS = `
  id
  kind
  body
  payload
  createdAt
  updatedAt
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
  round {
    id
    title
  }
  readBy {
    id
  }
`;

// Schema author hook always assigns the current session user on create.
// Callers supply opportunity + round + body (+ optional kind/payload).
export const CREATE_REVIEW_NOTE = gql`
  mutation CREATE_REVIEW_NOTE($input: OpportunityReviewNoteCreateInput!) {
    createOpportunityReviewNote(data: $input) {
      ${REVIEW_NOTE_FIELDS}
    }
  }
`;

export const UPDATE_REVIEW_NOTE = gql`
  mutation UPDATE_REVIEW_NOTE($id: ID!, $input: OpportunityReviewNoteUpdateInput!) {
    updateOpportunityReviewNote(where: { id: $id }, data: $input) {
      ${REVIEW_NOTE_FIELDS}
    }
  }
`;

export const DELETE_REVIEW_NOTE = gql`
  mutation DELETE_REVIEW_NOTE($id: ID!) {
    deleteOpportunityReviewNote(where: { id: $id }) {
      id
    }
  }
`;

export const MARK_OPPORTUNITY_REVIEW_NOTES_READ = gql`
  mutation MARK_OPPORTUNITY_REVIEW_NOTES_READ($noteIds: [ID!]!) {
    markOpportunityReviewNotesRead(noteIds: $noteIds) {
      id
      kind
      round {
        id
      }
      readBy {
        id
      }
    }
  }
`;
