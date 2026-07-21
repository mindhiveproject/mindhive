// Right pane: live preview of the form being edited. Mounts the same
// DefinitionForm in readOnly mode, against the same scope+key the admin
// is editing. The form re-fetches its definition after each save so the
// preview reflects the latest persisted state.
//
// We bypass the public resolver to avoid the published-only filter:
// admins want to preview drafts too. Instead the preview hydrates from
// the in-memory definition we already loaded for the editor.
import { useMemo } from "react";
import styled from "styled-components";

import CardRenderer from "../../../Forms/DefinitionForm/CardRenderer";

const Shell = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f7f9f8;
  border-radius: 16px;
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);

  h3 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #5f6871;
  }

  .preview-disclaimer {
    color: #888;
    font-size: 12px;
    line-height: 1.5;
    margin: 0;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  pointer-events: none;
  opacity: 0.95;
`;

export default function PreviewPanel({ definition, locale }) {
  const cards = useMemo(() => definition?.cards || [], [definition]);

  return (
    <Shell>
      <h3>Live preview</h3>
      <p className="preview-disclaimer">
        Previewing as <strong>admin</strong>. Cards with role gating are
        shown unconditionally here so you can verify their content.
        Submit and validation are disabled.
      </p>
      <Stack>
        {cards.map((card) => (
          <CardRenderer
            key={card.id}
            card={card}
            locale={locale}
            viewerRoles={["admin"]}
            entityStatus={null}
            values={{}}
            errors={{}}
            onFieldChange={() => {}}
            disabled
            specialCardComponents={{}}
          />
        ))}
      </Stack>
    </Shell>
  );
}
