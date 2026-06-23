// Lightweight publish confirmation. Prompts for an optional changelog
// entry and warns when a sibling published version is about to be
// auto-archived. The actual publish is atomic on the backend
// (publishFormDefinition mutation).
import { useState } from "react";
import styled from "styled-components";

import { PrimaryButton, SecondaryButton } from "./EditorPanelStyles";

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Card = styled.div`
  width: min(520px, 90vw);
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0px 12px 64px rgba(0, 0, 0, 0.2);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 20px;
    color: #171717;
  }

  p {
    margin: 0;
    color: #5f6871;
    font-size: 14px;
    line-height: 1.5;
  }

  textarea {
    border: 1px solid #d3dae0;
    border-radius: 8px;
    padding: 10px 12px;
    font-family: "Lato", sans-serif;
    font-size: 14px;
    min-height: 80px;
    resize: vertical;
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
`;

const Warning = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff8e6;
  border: 1px solid #f0d39a;
  color: #6e5400;
  font-size: 13px;
  line-height: 1.5;
`;

const ValidationErrors = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  background: #fcebea;
  border: 1px solid #f5c2bf;
  color: #871b16;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  max-height: 240px;
  overflow-y: auto;

  strong {
    display: block;
    margin-bottom: 4px;
  }
`;

export default function PublishModal({
  definition,
  liveSibling,
  onCancel,
  onConfirm,
  busy,
  error,
}) {
  const [changelog, setChangelog] = useState("");

  return (
    <Backdrop onClick={onCancel}>
      <Card onClick={(e) => e.stopPropagation()}>
        <h2>Publish "{definition.title}" v{definition.version}?</h2>
        <p>
          The renderer will start serving this version at scope{" "}
          <code>{definition.scope}</code> immediately.
        </p>

        {liveSibling ? (
          <Warning>
            Heads up — the currently-live version{" "}
            <strong>v{liveSibling.version}</strong> will be auto-archived
            so only one published version per scope stays active.
          </Warning>
        ) : null}

        {error ? (
          <ValidationErrors>
            <strong>Couldn't publish:</strong>
            {error.message?.replace(/^Error: /, "") || String(error)}
          </ValidationErrors>
        ) : null}

        <label
          style={{ display: "flex", flexDirection: "column", gap: 6 }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#171717" }}>
            What changed? (optional)
          </span>
          <textarea
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            placeholder="e.g. Added IRB number field; reordered Project scope card."
          />
        </label>

        <div className="actions">
          <SecondaryButton type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => onConfirm(changelog.trim() || null)}
            disabled={busy}
          >
            {busy ? "Publishing…" : "Confirm publish"}
          </PrimaryButton>
        </div>
      </Card>
    </Backdrop>
  );
}
