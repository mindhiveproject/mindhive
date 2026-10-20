import styled from "styled-components";

import IconButton from "../../../DesignSystem/IconButton";
import { CloseIcon } from "../../../DesignSystem/Icons";

// Shared shell for the class Assignments / Resources sub-pages (create, copy,
// edit, preview): a sticky header bar with the title on the left and the page
// actions plus a close button on the right, over a single readable column.

export const EditorPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 0 48px;
  box-sizing: border-box;
`;

const HeaderBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 16px;
  padding: 12px 12px 12px 24px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 8px;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  flex: 1 1 240px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: var(--MH-Type-Title-Large);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

/**
 * @param {React.ReactNode} title - Page title.
 * @param {() => void} onClose - Leaves the page.
 * @param {string} closeLabel - Accessible name / tooltip for the close button.
 * @param {React.ReactNode} [actions] - Buttons left of the close button (e.g. Save).
 */
export function EditorHeader({ title, onClose, closeLabel, actions = null }) {
  return (
    <HeaderBar>
      <HeaderTitle>{title}</HeaderTitle>
      <HeaderActions>
        {actions}
        <IconButton
          variant="text"
          icon={<CloseIcon />}
          onClick={onClose}
          ariaLabel={closeLabel}
          title={closeLabel}
        />
      </HeaderActions>
    </HeaderBar>
  );
}

export const EditorFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-width: 0;
`;

export const EditorField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
`;

export const EditorLabel = styled.label`
  font: var(--MH-Type-Label-Large);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
`;

export const EditorHint = styled.p`
  margin: 0;
  font: var(--MH-Type-Body-Small);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
`;

// Read-only block on the preview pages.
export const PreviewSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 8px;

  h2 {
    margin: 0;
    font: var(--MH-Type-Label-Large);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;
