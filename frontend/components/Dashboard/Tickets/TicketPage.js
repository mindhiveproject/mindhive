import { useContext, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import styled from "styled-components";

import { GET_TICKET, GET_TICKETS, GET_TICKET_ASSIGNEES } from "../../Queries/Ticket";
import {
  SET_TICKET_STATUS,
  ASSIGN_TICKET,
  UNASSIGN_TICKET,
  CREATE_TICKET_ANNOTATION,
  DELETE_TICKET_ANNOTATION,
} from "../../Mutations/Ticket";
import { UserContext } from "../../Global/Authorized";
import { getSurface } from "../../../lib/surfaces";
import FigmaLink from "./FigmaLink";
import ScreenshotAnnotator from "./ScreenshotAnnotator";
import SupportTickets from "./SupportTickets";
import DeleteTicket from "./DeleteTicket";
import BeehiveLoading from "../../DesignSystem/BeehiveLoading";
import Button from "../../DesignSystem/Button";
import CopyButton from "../../DesignSystem/CopyButton";

/**
 * One ticket, with the evidence captured when it was filed.
 *
 * The evidence block is deliberately verbatim rather than prettified: the
 * viewport, locale and role at filing time are often the whole explanation for
 * a bug that nobody else can reproduce.
 */

const STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "WONTFIX", label: "Won't fix" },
];

const CLOSEABLE = ["OPEN", "ACCEPTED", "IN_PROGRESS"];

const KIND_LABELS = {
  BUG: "Bug",
  DESIGN_DRIFT: "Design drift",
  MISSING: "Missing",
  COPY: "Copy",
  IDEA: "Idea",
};

/**
 * Notion page URL from the id the mirror stores. `notion.so/<32 hex>` resolves
 * to the page wherever it lives in the workspace, so there is no need to store
 * the full URL — which Notion rewrites whenever the page title changes.
 */
function notionUrl(pageId) {
  return pageId ? `https://www.notion.so/${pageId.replace(/-/g, "")}` : null;
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

export default function TicketPage({ id }) {
  const { user } = useContext(UserContext);
  const { data, loading, error } = useQuery(GET_TICKET, { variables: { id } });
  const { data: assigneeData } = useQuery(GET_TICKET_ASSIGNEES);
  const refetch = { refetchQueries: [{ query: GET_TICKETS }] };
  const [setStatus, { loading: saving }] = useMutation(SET_TICKET_STATUS, refetch);
  const [assign, { loading: assigning }] = useMutation(ASSIGN_TICKET, refetch);
  const [unassign, { loading: unassigning }] = useMutation(UNASSIGN_TICKET, refetch);
  const assignees = assigneeData?.profiles ?? [];
  const refetchTicket = { refetchQueries: [{ query: GET_TICKET, variables: { id } }] };
  const [createAnnotation, { loading: savingAnnotation }] = useMutation(
    CREATE_TICKET_ANNOTATION,
    refetchTicket
  );
  const [deleteAnnotation] = useMutation(DELETE_TICKET_ANNOTATION, refetchTicket);
  const [annotating, setAnnotating] = useState(false);
  const [annotationError, setAnnotationError] = useState(null);

  if (loading && !data) return <BeehiveLoading />;
  if (error) return <Wrapper>Could not load this ticket: {error.message}</Wrapper>;

  const ticket = data?.ticket;
  if (!ticket) {
    return (
      <Wrapper>
        <p>No such ticket, or you do not have access to it.</p>
        <Link href="/dashboard/tickets">Back to the board</Link>
      </Wrapper>
    );
  }

  const surface = getSurface(ticket.surface);
  const evidence = ticket.evidence ?? {};
  const description = ticket.body?.text ?? null;

  return (
    <Wrapper>
      <Back>
        <Link href="/dashboard/tickets">← Board</Link>
      </Back>

      <h1 className="MH-Type-Heading-Small">{ticket.title}</h1>
      {/* Seen first rather than buried in the facts grid below: for a design
          ticket, where the intended design lives is the argument. */}
      <FigmaLink url={ticket.figmaDesignUrl} variant="card" />

      <Facts>
        <Fact>
          <dt>Surface</dt>
          <dd>
            {surface?.label ?? "Unregistered"}
            <SurfaceKey>{ticket.surface}</SurfaceKey>
          </dd>
        </Fact>
        <Fact>
          <dt>Kind</dt>
          <dd>{KIND_LABELS[ticket.kind] ?? ticket.kind}</dd>
        </Fact>
        <Fact>
          <dt>Priority</dt>
          <dd>{ticket.priority?.toLowerCase()}</dd>
        </Fact>
        <Fact>
          <dt>Reported by</dt>
          <dd>{ticket.reporter?.username ?? "unknown"}</dd>
        </Fact>
        <Fact>
          <dt>Filed</dt>
          <dd>{formatDate(ticket.createdAt)}</dd>
        </Fact>
        {ticket.resolvedAt && (
          <Fact>
            <dt>Resolved</dt>
            <dd>{formatDate(ticket.resolvedAt)}</dd>
          </Fact>
        )}
        {surface?.root && (
          <Fact>
            <dt>Code</dt>
            <dd>
              <Mono>{surface.root}</Mono>
            </dd>
          </Fact>
        )}
        {surface?.figmaNodeId && (
          <Fact>
            <dt>Figma frame</dt>
            <dd>
              <Mono>{surface.figmaNodeId}</Mono>
            </dd>
          </Fact>
        )}
        {ticket.notionPageId && (
          <Fact>
            <dt>Notion</dt>
            <dd>
              <a href={notionUrl(ticket.notionPageId)} target="_blank" rel="noopener noreferrer">
                Open the mirrored page ↗
              </a>
            </dd>
          </Fact>
        )}
      </Facts>

      <StatusBar>
        <label htmlFor="mh-ticket-status">Status</label>
        <select
          id="mh-ticket-status"
          value={ticket.status}
          disabled={saving}
          onChange={(event) =>
            setStatus({ variables: { id: ticket.id, status: event.target.value } })
          }
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        {evidence.url && (
          <Button
            variant="outline"
            onClick={() => window.open(evidence.url, "_blank", "noopener")}
          >
            Open the page it was filed from
          </Button>
        )}
      </StatusBar>

      {/* Who is working on it. The point is to prevent two people fixing the
          same thing — so the claim is one click, and taking over someone
          else's ticket asks first rather than silently overwriting them. */}
      <AssigneeBar>
        <label htmlFor="mh-ticket-assignee">Working on it</label>
        <select
          id="mh-ticket-assignee"
          value={ticket.assignee?.id ?? ""}
          disabled={assigning || unassigning}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) {
              unassign({ variables: { id: ticket.id } });
              return;
            }
            const current = ticket.assignee;
            if (current && current.id !== next && current.id !== user?.id) {
              const taker = assignees.find((a) => a.id === next)?.username ?? "them";
              // eslint-disable-next-line no-alert
              if (!window.confirm(`${current.username} is on this. Reassign it to ${taker}?`)) {
                return;
              }
            }
            assign({ variables: { id: ticket.id, assigneeId: next } });
          }}
        >
          <option value="">Nobody yet</option>
          {assignees.map((person) => (
            <option key={person.id} value={person.id}>
              {person.id === user?.id ? `${person.username} (you)` : person.username}
            </option>
          ))}
        </select>
        {user?.id && ticket.assignee?.id !== user.id && !ticket.assignee && (
          <Button
            variant="outline"
            disabled={assigning}
            onClick={() => assign({ variables: { id: ticket.id, assigneeId: user.id } })}
          >
            I&apos;m taking this
          </Button>
        )}
        {ticket.assignee && ticket.assignee.id !== user?.id && (
          <Caption>
            {ticket.assignee.username} has claimed this — check with them before starting.
          </Caption>
        )}
      </AssigneeBar>

      <Section>
        <h2 className="MH-Type-Title-Base">Support tickets</h2>
        <SupportTickets ticket={ticket} />
      </Section>

      {CLOSEABLE.includes(ticket.status) && (
        <Section>
          <h2 className="MH-Type-Title-Base">Close it from the commit that fixes it</h2>
          <TrailerRow>
            <Trailer>{`Fixes-Ticket: ${ticket.id}`}</Trailer>
            <CopyButton value={`Fixes-Ticket: ${ticket.id}`}>Copy trailer</CopyButton>
          </TrailerRow>
          <Caption>
            Paste this line into the commit message. On merge to main the ticket moves
            to Shipped here and in Notion, and the commit sha is recorded below — so
            the board empties in step with the work rather than by hand.
          </Caption>
        </Section>
      )}

      {description && (
        <Section>
          <h2 className="MH-Type-Title-Base">What should happen</h2>
          <Description>{description}</Description>
        </Section>
      )}

      {ticket.screenshot?.url && (
        <Section>
          <h2 className="MH-Type-Title-Base">At filing time</h2>
          <Shot
            src={ticket.screenshot.url}
            alt={`Screenshot captured when "${ticket.title}" was filed`}
            width={ticket.screenshot.width}
            height={ticket.screenshot.height}
          />
          <ShotActions>
            <Button variant="outline" onClick={() => setAnnotating(true)} disabled={savingAnnotation}>
              {savingAnnotation ? "Saving…" : "Add annotation"}
            </Button>
            {/* 90 days mirrors SCREENSHOT_RETENTION_DAYS in the backend's
                mutations/pruneTicketScreenshots.ts — keep the two in step. */}
            <Caption>
              Draw on it to show what should change. Everything here is also copied
              to the ticket&apos;s Notion page, and deleted automatically 90 days
              after the ticket is resolved.
            </Caption>
          </ShotActions>
          {annotationError && <ErrorLine role="alert">{annotationError}</ErrorLine>}
        </Section>
      )}

      {ticket.annotations?.length > 0 && (
        <Section>
          <h2 className="MH-Type-Title-Base">Annotations ({ticket.annotations.length})</h2>
          <Annotations>
            {ticket.annotations.map((annotation) => (
              <AnnotationCard key={annotation.id}>
                {annotation.image?.url ? (
                  <a href={annotation.image.url} target="_blank" rel="noopener noreferrer"
                     aria-label={`Open ${annotation.author?.username ?? "this"} markup full size — new tab`}>
                    <AnnotationImage src={annotation.image.url} alt={annotation.note || "Annotated screenshot"} />
                  </a>
                ) : (
                  // The prune removed the image with the screenshot; the note stays.
                  <Expired>Image removed with the screenshot</Expired>
                )}
                <AnnotationMeta>
                  <strong>{annotation.author?.username ?? "unknown"}</strong>
                  <span>{formatDate(annotation.createdAt)}</span>
                  {annotation.author?.id === user?.id && (
                    <DeleteLink
                      type="button"
                      onClick={() => {
                        // eslint-disable-next-line no-alert
                        if (window.confirm("Delete your annotation?")) {
                          deleteAnnotation({ variables: { id: annotation.id } });
                        }
                      }}
                    >
                      Delete
                    </DeleteLink>
                  )}
                </AnnotationMeta>
                {annotation.note && <AnnotationNote>{annotation.note}</AnnotationNote>}
              </AnnotationCard>
            ))}
          </Annotations>
        </Section>
      )}

      {annotating && ticket.screenshot?.url && (
        <ScreenshotAnnotator
          // Each person marks up the ORIGINAL, not someone else's markup, so no
          // one draws over — or has to work around — anyone else's marks.
          source={ticket.screenshot.url}
          withNote
          title="Annotate the screenshot"
          onCancel={() => setAnnotating(false)}
          onDone={async (file, _shapes, note) => {
            setAnnotating(false);
            setAnnotationError(null);
            try {
              await createAnnotation({
                variables: { ticketId: ticket.id, authorId: user.id, note, image: file },
              });
            } catch (saveError) {
              setAnnotationError(saveError.message || "The annotation could not be saved.");
            }
          }}
        />
      )}

      <Section>
        <h2 className="MH-Type-Title-Base">Evidence</h2>
        <Evidence>
          {Object.entries(evidence).map(([key, value]) => (
            <EvidenceRow key={key}>
              <EvidenceKey>{key}</EvidenceKey>
              <EvidenceValue>
                {typeof value === "object" && value !== null
                  ? JSON.stringify(value)
                  : String(value)}
              </EvidenceValue>
            </EvidenceRow>
          ))}
          {Object.keys(evidence).length === 0 && <Caption>Nothing captured.</Caption>}
        </Evidence>
      </Section>

      <DeleteTicket ticket={ticket} />
    </Wrapper>
  );
}

/* --- styles ------------------------------------------------------------- */

const Wrapper = styled.div`
  padding: 24px;
  max-width: 800px;

  h1 {
    margin: 0 0 16px;
  }
  h2 {
    margin: 0 0 8px;
  }
`;


const Back = styled.p`
  margin: 0 0 12px;
  font: var(--MH-Type-Label-Base);

  a {
    color: var(--MH-Theme-Primary-Dark, #336f8a);
  }
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px 24px;
  margin: 0 0 20px;
  padding: 16px;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
`;

const Fact = styled.div`
  dt {
    font: var(--MH-Type-Label-Small);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    margin-bottom: 2px;
  }
  dd {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const SurfaceKey = styled.span`
  display: block;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Grey-2, #5f6871);
`;

const Mono = styled.span`
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 13px;
  word-break: break-all;
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  label {
    font: var(--MH-Type-Label-Base);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
  select {
    padding: 8px 12px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    border-radius: 8px;
    font: var(--MH-Type-Body-Base);
    background: var(--MH-Theme-Neutrals-White, #ffffff);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const TrailerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Trailer = styled.code`
  flex: 1 1 20rem;
  padding: 8px 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 8px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 13px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  word-break: break-all;
`;

const AssigneeBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 0 0 24px;

  label {
    font: var(--MH-Type-Label-Base);
  }
  select {
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
    font: var(--MH-Type-Body-Base);
  }
`;

const ShotActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const Annotations = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
`;

const AnnotationCard = styled.figure`
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const AnnotationImage = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  object-position: top left;
  border-radius: 8px;
  border: 1px solid var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
`;

const Expired = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  background: var(--MH-Theme-Neutrals-Lighter, #f3f3f3);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  font: var(--MH-Type-Body-Small);
`;

const AnnotationMeta = styled.figcaption`
  display: flex;
  align-items: baseline;
  gap: 8px;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  strong {
    font: var(--MH-Type-Label-Small);
    color: var(--MH-Theme-Neutrals-Black, #171717);
  }
`;

const AnnotationNote = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const DeleteLink = styled.button`
  margin-left: auto;
  border: none;
  background: none;
  padding: 0;
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Warning-Dark, #8f1f14);
  text-decoration: underline;
  cursor: pointer;
`;

const ErrorLine = styled.p`
  margin: 8px 0 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Warning-Dark, #8f1f14);
`;

const Section = styled.section`
  margin-bottom: 24px;
`;

const Description = styled.p`
  margin: 0;
  white-space: pre-wrap;
  font: var(--MH-Type-Body-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const Shot = styled.img`
  display: block;
  max-width: 100%;
  height: auto;
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 8px;
`;

const Caption = styled.p`
  margin: 8px 0 0;
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const Evidence = styled.div`
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 8px;
  overflow: hidden;
`;

const EvidenceRow = styled.div`
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);

  &:last-child {
    border-bottom: none;
  }
`;

const EvidenceKey = styled.span`
  flex: 0 0 120px;
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

const EvidenceValue = styled.span`
  flex: 1;
  font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace;
  font-size: 12px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  word-break: break-all;
`;
