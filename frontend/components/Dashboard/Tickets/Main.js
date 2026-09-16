import TicketsList from "./TicketsList";
import TicketPage from "./TicketPage";

/**
 * The ticket board. Follows the `Dashboard/Updates` shape: this switches on
 * `selector`, so /dashboard/tickets is the board and
 * /dashboard/tickets/<id> is one ticket.
 *
 * Access is enforced on the Keystone `Ticket` list via `canManageTickets`, so
 * a viewer without the flag gets an empty board rather than a leak — but the
 * nav entry is hidden from them too, in `navigationConfig.js`.
 */
export default function TicketsMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return <TicketsList user={user} />;
  }
  return <TicketPage id={selector} user={user} />;
}
