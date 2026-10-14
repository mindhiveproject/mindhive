import { useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../DesignSystem/DropdownSelect";
import {
  getClassTemplateBoards,
  getPrimaryTemplateBoardId,
} from "../../../../lib/classTemplateBoards";
import { readClassPrefs, writeClassPrefs } from "./classPagePrefs";

// Class project board picker shown between the class header and the tabs on
// every tab. Only the Dashboard filters by it for now: there the choice lives in
// `?template=`; on other tabs it's saved to the class prefs the Dashboard
// restores from.
export default function ClassTemplateBoardPicker({ myclass, page }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const [storedChoice, setStoredChoice] = useState(null);

  const boards = getClassTemplateBoards(myclass).filter((board) => board?.id);
  if (boards.length < 2) return null;

  const isKnown = (id) => Boolean(id) && boards.some((b) => b.id === id);
  // On the Dashboard, mirror what it's showing (it may still be asking the
  // teacher to choose); elsewhere show the remembered choice.
  const value =
    page === "dashboard"
      ? [router.query?.template].find(isKnown) || ""
      : [
          storedChoice,
          readClassPrefs(myclass?.id)?.dashboard?.template,
          getPrimaryTemplateBoardId(myclass),
        ].find(isKnown) || "";

  const onChange = (boardId) => {
    if (!isKnown(boardId)) return;
    if (page === "dashboard") {
      // The Dashboard drops milestone columns that aren't on the new board.
      router.replace(
        { pathname: router.pathname, query: { ...router.query, template: boardId } },
        undefined,
        { shallow: true }
      );
      return;
    }
    writeClassPrefs(myclass.id, { dashboard: { template: boardId } });
    setStoredChoice(boardId);
  };

  const options = boards.map((board) => ({
    value: board.id,
    label:
      board.title ||
      t("dashboard.untitledTemplateBoard", {}, { default: "Untitled template" }),
  }));
  const label = t("main.projectBoards", {}, { default: "Project boards" });

  return (
    <StyledPicker>
      <span className="projectBoardsLabel">{label}:</span>
      <DropdownSelect
        value={value}
        onChange={onChange}
        options={options}
        ariaLabel={label}
        placeholder={t("dashboard.selectTemplateBoard", {}, {
          default: "Select a template board",
        })}
        fitContent
        triggerStyle={{ background: "var(--MH-Theme-Neutrals-White, #ffffff)" }}
      />
    </StyledPicker>
  );
}

const StyledPicker = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  .projectBoardsLabel {
    font: var(--MH-Type-Label-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    white-space: nowrap;
  }
`;
