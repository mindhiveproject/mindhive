import gql from "graphql-tag";

// Filing comes in two documents rather than one with an optional variable.
//
// Keystone's `ImageFieldInput.upload` is `Upload!`, so a nullable `$screenshot`
// cannot be passed to it — and GraphQL has no way to omit an input field
// conditionally. Attempting it fails validation before the request is even
// executed:
//
//   Variable "$screenshot" of type "Upload" used in position expecting "Upload!"
//
// So the with-screenshot case is its own mutation, and TicketOverlay picks
// whichever one it has a file for. Filing must work without an image — a
// refused or failed capture never blocks the written report.

const CREATE_VARS = `
  $surface: String!
  $title: String!
  $kind: TicketKindType
  $priority: TicketPriorityType
  $body: JSON
  $evidence: JSON
  $reporterId: ID!
  $figmaDesignUrl: String
  $supportTickets: JSON
`;

const CREATE_FIELDS = `
  surface: $surface
  title: $title
  kind: $kind
  priority: $priority
  body: $body
  evidence: $evidence
  reporter: { connect: { id: $reporterId } }
  figmaDesignUrl: $figmaDesignUrl
  supportTickets: $supportTickets
`;

const CREATED = `
  id
  surface
  status
`;

export const CREATE_TICKET = gql`
  mutation CREATE_TICKET(${CREATE_VARS}) {
    createTicket(data: { ${CREATE_FIELDS} }) {
      ${CREATED}
    }
  }
`;

export const CREATE_TICKET_WITH_SCREENSHOT = gql`
  mutation CREATE_TICKET_WITH_SCREENSHOT(${CREATE_VARS} $screenshot: Upload!) {
    createTicket(
      data: { ${CREATE_FIELDS} screenshot: { upload: $screenshot } }
    ) {
      ${CREATED}
    }
  }
`;

export const SET_TICKET_STATUS = gql`
  mutation SET_TICKET_STATUS($id: ID!, $status: TicketStatusType!) {
    updateTicket(where: { id: $id }, data: { status: $status }) {
      id
      status
      resolvedAt
    }
  }
`;

// Claim or release a ticket. Two documents for the same reason CREATE_TICKET
// has two: a relationship is set with `connect` and cleared with
// `disconnect: true`, and GraphQL cannot choose between input shapes from a
// variable. Passing `connect: { id: null }` is not a way to clear it.
export const ASSIGN_TICKET = gql`
  mutation ASSIGN_TICKET($id: ID!, $assigneeId: ID!) {
    updateTicket(
      where: { id: $id }
      data: { assignee: { connect: { id: $assigneeId } } }
    ) {
      id
      assignee {
        id
        username
      }
    }
  }
`;

export const UNASSIGN_TICKET = gql`
  mutation UNASSIGN_TICKET($id: ID!) {
    updateTicket(where: { id: $id }, data: { assignee: { disconnect: true } }) {
      id
      assignee {
        id
        username
      }
    }
  }
`;

// The whole list, not an add or a remove: a json field is replaced whole. The
// backend works out what changed, and applies only that to the Notion page's
// relation, so links made directly in Notion survive.
export const SET_TICKET_SUPPORT_TICKETS = gql`
  mutation SET_TICKET_SUPPORT_TICKETS($id: ID!, $supportTickets: JSON) {
    updateTicket(where: { id: $id }, data: { supportTickets: $supportTickets }) {
      id
      supportTickets
    }
  }
`;

export const EDIT_TICKET = gql`
  mutation EDIT_TICKET($id: ID!, $input: TicketUpdateInput!) {
    updateTicket(where: { id: $id }, data: $input) {
      id
    }
  }
`;

export const DELETE_TICKET = gql`
  mutation DELETE_TICKET($id: ID!) {
    deleteTicket(where: { id: $id }) {
      id
    }
  }
`;

// One collaborator's markup. The image is required: a markup with nothing drawn
// is just a note, and the ticket already has a description for those.
export const CREATE_TICKET_ANNOTATION = gql`
  mutation CREATE_TICKET_ANNOTATION(
    $ticketId: ID!
    $authorId: ID!
    $note: String
    $image: Upload!
  ) {
    createTicketAnnotation(
      data: {
        ticket: { connect: { id: $ticketId } }
        author: { connect: { id: $authorId } }
        note: $note
        image: { upload: $image }
      }
    ) {
      id
    }
  }
`;

export const DELETE_TICKET_ANNOTATION = gql`
  mutation DELETE_TICKET_ANNOTATION($id: ID!) {
    deleteTicketAnnotation(where: { id: $id }) {
      id
    }
  }
`;
