import { useState } from "react";
import { useRouter } from "next/router";
import { useApolloClient, useMutation } from "@apollo/client";
import styled from "styled-components";

import { DELETE_TICKET } from "../../Mutations/Ticket";
import Modal from "../../DesignSystem/Modal";
import Button from "../../DesignSystem/Button";

/**
 * Delete a ticket completely, from its page.
 *
 * "Completely" is the backend's doing, not this component's. Deleting a Ticket
 * also deletes its annotations and every image file — the screenshot and each
 * markup — and moves its Notion page to Notion's trash (keystone/schemas/
 * Ticket.ts). This asks first, listing exactly what will go, then leaves the
 * page, which no longer has anything to show.
 *
 * There is no undo on the platform. The trashed Notion page, restorable there
 * for 30 days, is the only copy that survives.
 */
export default function DeleteTicket({ ticket }) {
  const router = useRouter();
  const client = useApolloClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTicket, { loading }] = useMutation(DELETE_TICKET);

  const annotations = ticket.annotations?.length ?? 0;
  const supportTickets = Array.isArray(ticket.supportTickets) ? ticket.supportTickets.length : 0;

  const confirm = async () => {
    setError(null);
    try {
      await deleteTicket({
        variables: { id: ticket.id },
        // Out of every cached list at once — the board, each page's list in
        // the filing panel, the Help Center count — without refetching them.
        update(cache) {
          cache.modify({
            fields: {
              tickets(existing, { readField }) {
                return (existing ?? []).filter((ref) => readField("id", ref) !== ticket.id);
              },
            },
          });
        },
      });
    } catch (deleteError) {
      setError(deleteError.message || "The ticket could not be deleted.");
      return;
    }
    await router.push("/dashboard/tickets");
    // Only once this page is gone: evicting sooner would flash "No such
    // ticket" here first. Evicting at all stops Back from showing a ticket
    // that no longer exists.
    client.cache.evict({ id: client.cache.identify({ __typename: "Ticket", id: ticket.id }) });
    client.cache.gc();
  };

  const close = () => {
    if (!loading) setOpen(false);
  };

  return (
    <>
      <Zone>
        <div>
          <h2 className="MH-Type-Title-Base">Delete this ticket</h2>
          <Caption>
            Removes the ticket and everything filed with it, here and in Notion. Meant
            for duplicates and tickets filed by mistake: one that simply will not be
            done is better set to Won&apos;t fix, which keeps the record.
          </Caption>
        </div>
        <TriggerButton type="button" onClick={() => setOpen(true)}>
          Delete ticket…
        </TriggerButton>
      </Zone>

      <Modal
        open={open}
        onClose={close}
        title={`Delete “${ticket.title}”?`}
        maxWidth={480}
        actions={
          <>
            <Button variant="text" onClick={close} disabled={loading}>
              Cancel
            </Button>
            <ConfirmButton type="button" onClick={confirm} disabled={loading}>
              {loading ? "Deleting…" : "Delete ticket"}
            </ConfirmButton>
          </>
        }
      >
        <Lead>This deletes, with no undo here:</Lead>
        <Gone>
          <li>the ticket, with its description and evidence</li>
          {ticket.screenshot && <li>its screenshot</li>}
          {annotations > 0 && (
            <li>
              {annotations === 1 ? "1 annotation" : `${annotations} annotations`} and
              their images
            </li>
          )}
          {ticket.notionPageId && (
            <li>
              its Notion page, moved to Notion&apos;s trash, where it can be restored
              for 30 days
            </li>
          )}
          {supportTickets > 0 && (
            <li>
              its {supportTickets === 1 ? "link to a support ticket" : `links to ${supportTickets} support tickets`}
              {" "}(the support tickets themselves stay)
            </li>
          )}
        </Gone>
        {error && <ErrorLine role="alert">{error}</ErrorLine>}
      </Modal>
    </>
  );
}

/* --- styles ------------------------------------------------------------- */

/* Set apart from everything above it, so it is never mistaken for a routine
   action on the way past. */
const Zone = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-top: 40px;
  padding: 16px 20px;
  border: 1px solid var(--MH-Theme-Warning-Light, #edcecd);
  border-radius: 12px;

  h2 {
    margin: 0 0 4px;
  }
  > div {
    flex: 1 1 20rem;
  }
`;

const Caption = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const TriggerButton = styled.button`
  flex: none;
  padding: 10px 18px;
  border-radius: 100px;
  border: 1px solid var(--MH-Theme-Warning-Base, #b9261a);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  color: var(--MH-Theme-Warning-Base, #b9261a);
  font: var(--MH-Type-Label-Base);
  cursor: pointer;

  &:hover {
    background: var(--MH-Theme-Warning-Light, #edcecd);
  }
  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Warning-Dark, #8f1f14);
    outline-offset: 2px;
  }
`;

const ConfirmButton = styled.button`
  padding: 10px 18px;
  border-radius: 100px;
  border: none;
  background: var(--MH-Theme-Warning-Base, #b9261a);
  color: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Label-Base);
  cursor: pointer;

  &:hover {
    background: var(--MH-Theme-Warning-Dark, #8f1f14);
  }
  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Warning-Dark, #8f1f14);
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const Lead = styled.p`
  margin: 0 0 8px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Gone = styled.ul`
  margin: 0;
  padding-left: 20px;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);

  li + li {
    margin-top: 4px;
  }
`;

const ErrorLine = styled.p`
  margin: 12px 0 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Warning-Dark, #8f1f14);
`;
