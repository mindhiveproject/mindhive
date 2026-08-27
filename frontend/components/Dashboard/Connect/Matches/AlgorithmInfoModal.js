import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

// Portal modal with the full technical description of the three matching
// algorithms. Kept out of the main RoundMatches page body so the actual
// workspace stays uncluttered; the teacher opens it via the "?" button next
// to the algorithm dropdown.
//
// Descriptions are grounded in matchingAlgorithm.js; when the algorithm
// implementation changes, update this file too.

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 20040,
  background: "rgba(23, 23, 23, 0.35)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle = {
  width: "min(760px, 92vw)",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  border: "1px solid #A1A1A1",
  borderRadius: 16,
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.18)",
  padding: 32,
  font: 'var(--MH-Type-Body-Base, 400 16px/24px "Inter", sans-serif)',
  letterSpacing: 0,
  color: "#171717",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 20,
};

const titleStyle = {
  margin: 0,
  font: 'var(--MH-Type-Title-Large, 600 22px/28px "Inter", sans-serif)',
  letterSpacing: 0,
  color: "#171717",
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 4,
  fontSize: 24,
  lineHeight: 1,
  color: "#625b71",
  flexShrink: 0,
};

const sectionStyle = {
  marginTop: 20,
  paddingTop: 20,
  borderTop: "1px solid #e6e6e6",
};

const h3Style = {
  margin: "0 0 8px",
  font: 'var(--MH-Type-Title-Base, 600 16px/24px "Inter", sans-serif)',
  letterSpacing: 0,
  color: "#171717",
};

// Genuine monospace need: displays the literal scoring formula/expressions,
// not styled prose. Font-family is intentionally kept off the Inter token;
// size/line-height are tokenized to the nearest scale value (body/small).
const kbdStyle = {
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  background: "#f2f4f6",
  border: "1px solid #d3dae0",
  borderRadius: 4,
  padding: "1px 6px",
  fontSize: 12,
  lineHeight: "16px",
  letterSpacing: 0,
  color: "#5f6871",
};

const chipStyle = {
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: 100,
  background: "#eef5f9",
  color: "#336f8a",
  font: 'var(--MH-Type-Label-Base, 500 14px/20px "Inter", sans-serif)',
  letterSpacing: 0,
  marginBottom: 8,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 12,
  font: 'var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif)',
  letterSpacing: 0,
};

const thTdBase = {
  border: "1px solid #d3dae0",
  padding: "8px 10px",
  verticalAlign: "top",
  textAlign: "left",
};

export default function AlgorithmInfoModal({ open, onClose }) {
  const { t } = useTranslation("connect");

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      style={overlayStyle}
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="algo-info-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={headerStyle}>
          <h2 id="algo-info-title" style={titleStyle}>
            {t(
              "matchingRound.algorithmInfoTitle",
              {},
              { default: "How the matching algorithms work" }
            )}
          </h2>
          <button
            type="button"
            style={closeButtonStyle}
            onClick={onClose}
            aria-label={t("main.close", {}, { default: "Close" })}
          >
            ×
          </button>
        </div>

        <p style={{ marginTop: 0 }}>
          Three modes are available. All three share the same scoring
          foundation; they differ in <em>how</em> they assign students to
          opportunities once every pair has a score.
        </p>

        <div style={sectionStyle}>
          <h3 style={h3Style}>Shared foundation</h3>
          <p>
            Every student-opportunity pair gets a score from the student&apos;s
            submitted preference:
          </p>
          <p style={{ marginLeft: 12 }}>
            <span style={kbdStyle}>
              score = rankBonus × 10 + starRating × 2
            </span>
          </p>
          <p>
            <strong>rankBonus</strong> = <span style={kbdStyle}>max(0, totalOpps − rank + 1)</span>.
            In a 5-opportunity round, rank #1 gives a bonus of 5, #2 gives 4,
            unranked gives 0. Star rating is 0-5. So an opportunity ranked{" "}
            <strong>#1 with 5★</strong> scores <span style={kbdStyle}>5×10 + 5×2 = 60</span>;
            the same opportunity ranked <strong>#3 with 3★</strong> scores{" "}
            <span style={kbdStyle}>36</span>. Rank dominates stars by roughly
            5:1.
          </p>
          <p>
            <strong>Team coherence bonus:</strong> both automatic algorithms
            add <strong>+5</strong> per mutual team-preference pair already
            placed on the same opportunity. Both students must nominate each
            other for the same opportunity for the bonus to apply. Nudges the
            matcher to keep mutual pairs together on team projects without
            forcing it.
          </p>
        </div>

        <div style={sectionStyle}>
          <span style={chipStyle}>Stable matching</span>
          <h3 style={h3Style}>Gale-Shapley, many-to-one</h3>
          <p>
            <strong>Guarantee:</strong> the assignment is <em>stable</em>. No
            student-opportunity pair would <em>both</em> rather be matched to
            each other than to their current partners.
          </p>
          <p>
            <strong>How it runs:</strong>
          </p>
          <ol style={{ marginTop: 4, paddingLeft: 22 }}>
            <li>Sort each student&apos;s opportunities by their own preference score, highest first.</li>
            <li>
              Every unassigned student proposes to their next unproposed
              opportunity.
            </li>
            <li>
              Each opportunity keeps the top <em>studentCapacity</em>{" "}
              proposers by score and rejects the rest.
            </li>
            <li>
              Rejected students return to the worklist and propose to their
              next choice. Repeat until nobody has a pending proposal.
            </li>
          </ol>
          <p>
            <strong>Micro-example</strong> — Alice, Bob, Carol; Opps X and Y
            (each cap 1). All three rank X first, Y second.
          </p>
          <ul style={{ marginTop: 4, paddingLeft: 22 }}>
            <li>Round 1: all three propose to X. X keeps the highest scorer (Bob, 60), rejects Alice (55) and Carol (50).</li>
            <li>Round 2: Alice and Carol propose to Y. Y keeps Alice (44), rejects Carol (40).</li>
            <li>Round 3: Carol has no more options → unmatched.</li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            Result: <strong>Bob→X, Alice→Y, Carol unmatched.</strong>
          </p>
          <p>
            <strong>Pick this when</strong> you want a defensible answer if a
            student asks &ldquo;why didn&apos;t I get X?&rdquo; — the answer is
            always &ldquo;someone ranked X higher, and we couldn&apos;t offer
            you your second choice without displacing them.&rdquo; Best for
            contested opportunities with heavy preference overlap.
          </p>
        </div>

        <div style={sectionStyle}>
          <span style={chipStyle}>Score-based</span>
          <h3 style={h3Style}>Greedy, one pass</h3>
          <p>
            <strong>Guarantee:</strong> each individual placement maximizes
            score at the moment it&apos;s made. Does <em>not</em> guarantee
            stability — you can end up with pairs that would both rather swap.
          </p>
          <p>
            <strong>How it runs:</strong>
          </p>
          <ol style={{ marginTop: 4, paddingLeft: 22 }}>
            <li>Flatten every (student, opportunity, score) triple into one list.</li>
            <li>Sort by descending score. Tie-break by lower preference rank.</li>
            <li>
              Walk the sorted list: skip if the student is already matched or
              the opportunity is full; otherwise place them.
            </li>
          </ol>
          <p>
            <strong>Micro-example</strong> — same three students and opps as
            above. Sorted global list:{" "}
            <span style={kbdStyle}>
              (Bob,X,60) → (Alice,X,55) → (Carol,X,50) → (Carol,Y,45) → …
            </span>
            . Bob→X. Alice/Carol at X skipped (full). Carol→Y. Alice already
            skipped for X, and now Y is full → unmatched.
          </p>
          <p style={{ marginBottom: 0 }}>
            Result: <strong>Bob→X, Carol→Y, Alice unmatched.</strong>{" "}
            <em>
              Note this differs from stable matching — Alice ended up unmatched
              here even though she would have preferred Y.
            </em>
          </p>
          <p>
            <strong>Pick this when</strong> you want maximum transparency —
            every placement is defensible with a single number. Simple, fast,
            deterministic. Slightly less stable than Gale-Shapley in edge cases.
          </p>
        </div>

        <div style={sectionStyle}>
          <span style={chipStyle}>Teacher-curated</span>
          <h3 style={h3Style}>No auto-assignment</h3>
          <p>
            The algorithm intentionally produces zero matches. Every student
            with submitted preferences appears in the &ldquo;Unmatched&rdquo;
            pane on the left; you assign them by hand.
          </p>
          <p>
            <strong>What still runs:</strong> the same scoring formula powers
            the ranked dropdowns (&ldquo;Alice — rank 1, 5★&rdquo;) and the{" "}
            <em>Propose top candidates</em> button on each opportunity. You see
            the same numbers the auto-matchers would use, so the ranking is not
            hidden — just not enforced.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Pick this when</strong> you have context the algorithm
            can&apos;t see (a specific mentor requested a specific student, an
            accessibility accommodation, a prior collaboration), OR when you
            want to run one of the automatic algorithms first, then flip to
            teacher-curated to hand-adjust the wrong placements. Switching does
            not delete existing matches.
          </p>
        </div>

        <div style={sectionStyle}>
          <h3 style={h3Style}>At a glance</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thTdBase, background: "#f7f9f8" }}></th>
                <th style={{ ...thTdBase, background: "#f7f9f8" }}>Stable matching</th>
                <th style={{ ...thTdBase, background: "#f7f9f8" }}>Score-based</th>
                <th style={{ ...thTdBase, background: "#f7f9f8" }}>Teacher-curated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...thTdBase, font: 'var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif)', letterSpacing: 0 }}>Fairness guarantee</td>
                <td style={thTdBase}>Stable (best)</td>
                <td style={thTdBase}>None</td>
                <td style={thTdBase}>Teacher decides</td>
              </tr>
              <tr>
                <td style={{ ...thTdBase, font: 'var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif)', letterSpacing: 0 }}>Determinism</td>
                <td style={thTdBase}>Yes</td>
                <td style={thTdBase}>Yes</td>
                <td style={thTdBase}>N/A</td>
              </tr>
              <tr>
                <td style={{ ...thTdBase, font: 'var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif)', letterSpacing: 0 }}>Team coherence</td>
                <td style={thTdBase}>Applied automatically</td>
                <td style={thTdBase}>Applied automatically</td>
                <td style={thTdBase}>Shown as ranking hint only</td>
              </tr>
              <tr>
                <td style={{ ...thTdBase, font: 'var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif)', letterSpacing: 0 }}>Order</td>
                <td style={thTdBase}>Student preference</td>
                <td style={thTdBase}>Global score</td>
                <td style={thTdBase}>Teacher&apos;s choice</td>
              </tr>
              <tr>
                <td style={{ ...thTdBase, font: 'var(--MH-Type-Label-Small, 600 12px/16px "Inter", sans-serif)', letterSpacing: 0 }}>Best for</td>
                <td style={thTdBase}>Large, contested rounds</td>
                <td style={thTdBase}>Small transparent runs</td>
                <td style={thTdBase}>Small rounds or algorithm override</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p
          style={{
            marginTop: 20,
            font: 'var(--MH-Type-Body-Small, 400 12px/16px "Inter", sans-serif)',
            letterSpacing: 0,
            color: "#5f6871",
          }}
        >
          You can switch between algorithms at any time using the dropdown at
          the top of this page — existing proposed and active matches are
          preserved either direction.
        </p>
      </div>
    </div>,
    document.body
  );
}
