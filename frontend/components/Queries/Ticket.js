import gql from "graphql-tag";

const TICKET_SUMMARY = `
  id
  surface
  title
  kind
  status
  priority
  createdAt
  reporter {
    id
    username
  }
  assignee {
    id
    username
  }
  figmaDesignUrl
`;

// The whole board. Ordered so open work sits at the top of each surface group.
export const GET_TICKETS = gql`
  query GET_TICKETS {
    tickets(orderBy: [{ createdAt: desc }]) {
      ${TICKET_SUMMARY}
    }
  }
`;

// The tickets on one surface. Powers the overlay's "already open here" list —
// so the same thing doesn't get reported twice — and the count shown on the
// Help Center launcher.
export const GET_TICKETS_FOR_SURFACE = gql`
  query GET_TICKETS_FOR_SURFACE($surface: String!) {
    tickets(
      where: { surface: { equals: $surface } }
      orderBy: [{ createdAt: desc }]
    ) {
      ${TICKET_SUMMARY}
    }
  }
`;

export const GET_TICKET = gql`
  query GET_TICKET($id: ID!) {
    ticket(where: { id: $id }) {
      ${TICKET_SUMMARY}
      body
      evidence
      figmaNodeId
      notionPageId
      supportTickets
      updatedAt
      resolvedAt
      screenshot {
        id
        url
        width
        height
      }
      annotations(orderBy: [{ createdAt: asc }]) {
        id
        note
        createdAt
        author {
          id
          username
        }
        image {
          id
          url
          width
          height
        }
      }
    }
  }
`;

// Everyone who could be working on a ticket: holders of canManageTickets. The
// same flag that gates the board, so an assignee is always someone who can see
// the ticket they are assigned to.
export const GET_TICKET_ASSIGNEES = gql`
  query GET_TICKET_ASSIGNEES {
    profiles(
      where: { permissions: { some: { canManageTickets: { equals: true } } } }
      orderBy: [{ username: asc }]
    ) {
      id
      username
    }
  }
`;

// What pasted support-ticket links point at: each one's title, and whether it
// is really a page in the Support tickets database (`state`, see
// SupportTickets.js). Checked with Notion by the backend, so it needs the
// integration to be able to see that database.
export const SUPPORT_TICKET_PREVIEWS = gql`
  query SUPPORT_TICKET_PREVIEWS($urls: [String!]!) {
    supportTicketPreviews(urls: $urls) {
      url
      pageId
      title
      state
    }
  }
`;
