import gql from "graphql-tag";

// create new consent
export const CREATE_CONSENT = gql`
  mutation CREATE_CONSENT($input: ConsentCreateInput!) {
    createConsent(data: $input) {
      id
      code
    }
  }
`;

// edit consent
export const EDIT_CONSENT = gql`
  mutation EDIT_CONSENT(
    $id: ID!
    $title: String
    $description: String
    $info: JSON
    $settings: JSON
    $class: ClassRelateToOneForUpdateInput
    $collaborators: ProfileRelateToManyForUpdateInput
  ) {
    updateConsent(
      where: { id: $id }
      data: {
        title: $title
        description: $description
        info: $info
        settings: $settings
        class: $class
        collaborators: $collaborators
      }
    ) {
      id
    }
  }
`;

// delete consent
export const DELETE_CONSENT = gql`
  mutation DELETE_CONSENT($id: ID!) {
    deleteConsent(where: { id: $id }) {
      id
    }
  }
`;

// mark a protocol ready for teacher review (saves the forms first)
export const SUBMIT_CONSENT_FOR_REVIEW = gql`
  mutation SUBMIT_CONSENT_FOR_REVIEW($consentId: ID!, $info: JSON) {
    submitConsentForReview(consentId: $consentId, info: $info) {
      id
    }
  }
`;

// teaching team decision: "approve" or "reopen" (with a note)
export const REVIEW_CONSENT = gql`
  mutation REVIEW_CONSENT($consentId: ID!, $decision: String!, $note: String) {
    reviewConsent(consentId: $consentId, decision: $decision, note: $note) {
      id
    }
  }
`;
