import styled from "styled-components";

import { describeFigmaUrl, parseFigmaUrl } from "../../../lib/figmaUrl";
import Chip from "../../DesignSystem/Chip";
import CopyButton from "../../DesignSystem/CopyButton";
import { ArrowOutwardIcon } from "../../DesignSystem/Icons";

/**
 * A compact link to where a ticket's intended design lives.
 *
 * Used in the filing panel's open-ticket rows and on the ticket page, so the
 * same link looks the same in both. The Figma mark does the recognising, which
 * is what lets the chip stay small; the file and node it points at are in the
 * tooltip and the accessible name rather than taking up the row (or, with
 * `detail`, in the label — where it is the thing being confirmed).
 *
 * Always opens in a new tab — in the panel you are part-way through filing,
 * and on the ticket page you almost certainly want both side by side.
 *
 * Renders nothing for an empty or non-Figma URL, so callers can pass the field
 * straight through without guarding it.
 *
 * `copyable` adds a "Copy link" chip beside it. Figma often will not open from a
 * click — a file the browser cannot hand to the desktop app, a link that has to
 * be pasted into a fresh tab — so copying the link this points at is sometimes
 * the only way to use it.
 *
 * Two variants, because the two places want opposite things:
 *   - "chip" (default): the filing panel's rows, where it must stay small
 *     beside the status and assignee
 *   - "card": the ticket page, where for a design ticket the intended design
 *     IS the argument, so it should be the first thing under the title
 */
export default function FigmaLink({ url, detail = false, copyable = false, variant = "chip" }) {
  const description = describeFigmaUrl(url);
  if (!description) return null;

  if (variant === "card") {
    const parsed = parseFigmaUrl(url);
    return (
      <CardRow>
        {/* The whole card is the link — a larger target than a button inside it,
            and nothing else in the card is interactive, so there is no nesting.
            The copy chip sits beside it, not inside, for the same reason. */}
        <Card
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open the intended design in Figma: ${description} — opens in a new tab`}
        >
          <MarkTile aria-hidden="true">
            <FigmaMark size={22} />
          </MarkTile>
          <CardText>
            <CardEyebrow>Intended design</CardEyebrow>
            <CardName>{parsed?.name || parsed?.fileKey}</CardName>
            {parsed?.nodeId ? (
              <CardSub>Frame {parsed.nodeId}</CardSub>
            ) : (
              <CardSub data-tone="warn">
                Links to the whole file, not a specific frame
              </CardSub>
            )}
          </CardText>
          <CardAction aria-hidden="true" data-card-action>
            Open in Figma <ArrowOutwardIcon width={18} height={18} />
          </CardAction>
        </Card>
        {copyable && <CopyLink url={url} />}
      </CardRow>
    );
  }

  // The design system's chip is a button, not an anchor, so the link is opened
  // from onClick — in a new tab, for the reason in the note above.
  return (
    <>
      <Chip
        label={detail ? description : "Figma"}
        leading={<FigmaMark size={18} />}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        title={`Intended design — ${description}`}
        ariaLabel={`Intended design in Figma: ${description} — opens in a new tab`}
      />
      {copyable && <CopyLink url={url} />}
    </>
  );
}

function CopyLink({ url }) {
  return (
    <CopyButton value={url} ariaLabel="Copy the Figma link">
      Copy link
    </CopyButton>
  );
}

/** Figma's mark, drawn at icon size. Brand colours, so deliberately not tokens. */
function FigmaMark({ size = 13 }) {
  // Figma's mark is 38x57; keep the ratio whatever height is asked for.
  const width = Math.round((size * 38) / 57);
  return (
    <svg width={width} height={size} viewBox="0 0 38 57" aria-hidden="true" focusable="false">
      <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
      <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
      <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
      <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
    </svg>
  );
}

/* ---- card variant ------------------------------------------------------ */

const CardRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 24px;
`;

const Card = styled.a`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1 1 auto;
  min-width: 0;
  padding: 16px 20px;
  border-radius: 12px;
  background: var(--MH-Theme-Primary-Light, #def8fb);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  text-decoration: none;
  transition: background-color 0.2s;

  /* A fill, not an outline: the card has no border, and hover deepens the fill
     (the same step as a selected chip's) rather than adding one. */
  &:hover {
    background: #c0eaef;
  }
  /* A data attribute rather than a component reference to CardAction: it is declared
     below, so interpolating it here would read it before it exists and throw
     when the module loads. */
  &:hover [data-card-action] {
    background: var(--MH-Theme-Tertiary-Dark, #0d3944);
  }
  &:focus-visible {
    outline: 2px solid var(--MH-Theme-Primary-Dark, #336f8a);
    outline-offset: 3px;
  }

  @media (max-width: 560px) {
    flex-wrap: wrap;
  }
`;

const MarkTile = styled.span`
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
`;

const CardText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
`;

const CardEyebrow = styled.span`
  font: var(--MH-Type-Label-Small);
  color: var(--MH-Theme-Primary-Dark, #336f8a);
`;

const CardName = styled.span`
  font: var(--MH-Type-Title-Base);
  color: var(--MH-Theme-Neutrals-Black, #171717);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardSub = styled.span`
  font: var(--MH-Type-Body-Small);
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);

  &[data-tone="warn"] {
    color: var(--MH-Theme-Warning-Dark, #8f1f14);
  }
`;

/* Looks like a button so the card reads as an action, but it is a span — the
   whole card is the link, and a real button inside an anchor is invalid. */
const CardAction = styled.span`
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 100px;
  background: var(--MH-Theme-Primary-Dark, #336f8a);
  color: var(--MH-Theme-Neutrals-White, #ffffff);
  font: var(--MH-Type-Label-Base);
  white-space: nowrap;
  transition: background 0.15s;
`;
