import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";

import { SUPPORT_TICKET_PREVIEWS } from "../../Queries/Ticket";
import { SET_TICKET_SUPPORT_TICKETS } from "../../Mutations/Ticket";
import { parseNotionPageUrl, sameNotionPage } from "../../../lib/notionUrl";
import Button from "../../DesignSystem/Button";

/**
 * The support tickets a ticket answers: pages in the Notion Support tickets
 * database, which the Help Center's support form feeds.
 *
 * Linked by pasting a support ticket's Notion link, at filing time in the
 * panel or later here on the ticket page. The backend mirrors them onto the
 * ticket's Notion page as the "Support tickets" relation, which shows from the
 * other side as "Platform tickets" on each support ticket.
 *
 * Every pasted link is checked with Notion, so one that will not link — a page
 * outside the support database, or one the integration cannot see — is
 * flagged while the person who pasted it is still looking.
 */

/** Titles and states for a set of links, in one request. */
export function useSupportTicketPreviews(urls) {
  const valid = urls.filter((url) => parseNotionPageUrl(url));
  const { data, loading } = useQuery(SUPPORT_TICKET_PREVIEWS, {
    variables: { urls: valid },
    skip: valid.length === 0,
  });
  const byUrl = new Map((data?.supportTicketPreviews ?? []).map((p) => [p.url, p]));
  return { byUrl, loading };
}

/**
 * The line under a pasted link: what it points at, or why it will not link.
 * `{ tone, text }`, or null when there is nothing to say yet.
 */
export function supportTicketHint(url, preview, loading) {
  const trimmed = (url || "").trim();
  if (!trimmed) return null;
  const parsed = parseNotionPageUrl(trimmed);
  if (!parsed) {
    return {
      tone: "warn",
      text: "That is not a link to a Notion page. Open the support ticket in Notion and copy its link.",
    };
  }
  if (!preview) return loading ? { tone: "neutral", text: "Checking with Notion…" } : null;
  const name = preview.title || parsed.label;
  switch (preview.state) {
    case "ok":
      return { tone: "neutral", text: `Links to “${name || "Untitled"}”` };
    case "not-support":
      return {
        tone: "warn",
        text: `${name ? `“${name}”` : "That page"} is not in the Support tickets database, so Notion will not link it.`,
      };
    case "not-visible":
      return {
        tone: "warn",
        text: "Notion cannot find that page from here. It may be in the trash, or not shared with the integration.",
      };
    default:
      // "unchecked": the Support tickets database is not connected (or Notion
      // is not configured at all). Said outright — a plain "Links to …" here
      // read as done, and people went looking for the link in Notion.
      return {
        tone: "neutral",
        text: `Links to ${name ? `“${name}”` : "a Notion page"} here. Not in Notion yet: the Support tickets database is not connected to the platform.`,
      };
  }
}

/** The ticket page's list of linked support tickets, with add and unlink. */
export default function SupportTickets({ ticket }) {
  const links = Array.isArray(ticket.supportTickets) ? ticket.supportTickets : [];
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);
  const trimmed = draft.trim();
  const { byUrl, loading } = useSupportTicketPreviews(trimmed ? [...links, trimmed] : links);
  // Returns the new list, which Apollo writes into the cached ticket, so the
  // page updates without refetching.
  const [save, { loading: saving }] = useMutation(SET_TICKET_SUPPORT_TICKETS);

  const duplicate = !!trimmed && links.some((link) => sameNotionPage(link, trimmed));
  const draftHint = duplicate
    ? { tone: "warn", text: "Already linked." }
    : supportTicketHint(trimmed, byUrl.get(trimmed), loading);
  const canAdd = !!parseNotionPageUrl(trimmed) && !duplicate && !saving;
  // The backend reports "unchecked" for every link while the Support tickets
  // database is not connected, so any one of them says it for all.
  const notConnected = links.some((link) => byUrl.get(link)?.state === "unchecked");

  async function write(next) {
    setError(null);
    try {
      await save({ variables: { id: ticket.id, supportTickets: next } });
      return true;
    } catch (saveError) {
      setError(saveError.message || "The support tickets could not be saved.");
      return false;
    }
  }

  return (
    <div>
      {links.length > 0 ? (
        <List>
          {links.map((link) => {
            const preview = byUrl.get(link);
            const name = preview?.title || parseNotionPageUrl(link)?.label || "Support ticket";
            const problem = preview && !["ok", "unchecked"].includes(preview.state);
            return (
              <Item key={link}>
                <ItemLink
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name}, opens in Notion in a new tab`}
                >
                  <span aria-hidden="true">🎟️</span>
                  <ItemName>{name}</ItemName>
                  <span aria-hidden="true">↗</span>
                </ItemLink>
                <Unlink
                  type="button"
                  disabled={saving}
                  onClick={() => write(links.filter((l) => l !== link))}
                  aria-label={`Unlink ${name}`}
                >
                  Unlink
                </Unlink>
                {problem && (
                  <ItemProblem>{supportTicketHint(link, preview, false)?.text}</ItemProblem>
                )}
              </Item>
            );
          })}
        </List>
      ) : (
        <Caption>None linked yet.</Caption>
      )}
      {notConnected && (
        <NotConnected role="status">
          <strong>Not in Notion yet.</strong> The Support tickets database is not
          connected to the platform, so these links are saved here only. They are
          added to the ticket&apos;s Notion page once it is connected.
        </NotConnected>
      )}

      <AddForm
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canAdd) return;
          if (await write([...links, trimmed])) setDraft("");
        }}
      >
        <label htmlFor="mh-support-link">Link a support ticket</label>
        <AddRow>
          <input
            id="mh-support-link"
            type="url"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Paste the support ticket's Notion link"
            aria-describedby="mh-support-link-hint"
            aria-invalid={(!!trimmed && !parseNotionPageUrl(trimmed)) || undefined}
          />
          <Button type="submit" variant="outline" disabled={!canAdd}>
            {saving ? "Saving…" : "Link"}
          </Button>
        </AddRow>
        {draftHint && (
          <Hint id="mh-support-link-hint" data-tone={draftHint.tone}>
            {draftHint.text}
          </Hint>
        )}
      </AddForm>
      {error && <ErrorLine role="alert">{error}</ErrorLine>}
      {!notConnected && (
        <Caption>
          Shown on the ticket&apos;s Notion page, and on each support ticket as
          “Platform tickets”. Links added directly in Notion stay there, but do not
          show here.
        </Caption>
      )}
    </div>
  );
}

/* --- styles ------------------------------------------------------------- */

const List = styled.ul`
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const ItemLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
  font: var(--MH-Type-Label-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 2px;
  }
`;

const ItemName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/* Its own line under the link, so a problem never squeezes the title. */
const ItemProblem = styled.span`
  flex-basis: 100%;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Warning-Dark, #8f1f14);
`;

const Unlink = styled.button`
  border: none;
  background: none;
  padding: 0;
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: var(--MH-Theme-Warning-Dark, #8f1f14);
  }
  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const AddForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font: var(--MH-Type-Label-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const AddRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  input {
    flex: 1 1 18rem;
    min-width: 0;
    padding: 8px 12px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 8px;
    font: var(--MH-Type-Body-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
    background: var(--MH-Theme-Neutrals-White, #ffffff);
  }
  input[aria-invalid="true"] {
    border-color: var(--MH-Theme-Warning-Dark, #8f1f14);
  }
`;

const Hint = styled.p`
  margin: 2px 0 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  &[data-tone="warn"] {
    color: var(--MH-Theme-Warning-Dark, #8f1f14);
  }
`;

/* Informational, not an error: nothing the person did is wrong. Accent-tinted
   like the filing panel's open-ticket callout, so it is seen rather than
   skimmed past as another caption. */
const NotConnected = styled.p`
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--MH-Theme-Accent-Light, #fdf2d0);
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);

  strong {
    font: var(--MH-Type-Label-Small);
  }
`;

const ErrorLine = styled.p`
  margin: 8px 0 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Warning-Dark, #8f1f14);
`;

const Caption = styled.p`
  margin: 8px 0 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;
