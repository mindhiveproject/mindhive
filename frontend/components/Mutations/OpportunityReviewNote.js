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
  }
  round {
    id
    title
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
