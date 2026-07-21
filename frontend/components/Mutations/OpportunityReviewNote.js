import { gql } from "@apollo/client";

// Auto-generated Keystone mutations for OpportunityReviewNote. The
// schema's author hook auto-assigns the current session user on create,
// so callers only supply opportunity + round + body.
export const CREATE_REVIEW_NOTE = gql`
  mutation CREATE_REVIEW_NOTE($input: OpportunityReviewNoteCreateInput!) {
    createOpportunityReviewNote(data: $input) {
      id
      body
      createdAt
      author {
        id
        username
        firstName
        lastName
      }
    }
  }
`;

export const UPDATE_REVIEW_NOTE = gql`
  mutation UPDATE_REVIEW_NOTE($id: ID!, $input: OpportunityReviewNoteUpdateInput!) {
    updateOpportunityReviewNote(where: { id: $id }, data: $input) {
      id
      body
      updatedAt
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
