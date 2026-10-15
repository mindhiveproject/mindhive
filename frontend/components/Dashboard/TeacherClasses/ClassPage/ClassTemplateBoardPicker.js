import { useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../DesignSystem/Button";
import SplitButton from "../../../DesignSystem/SplitButton";
import { EditIcon, SettingsIcon } from "../../../DesignSystem/Icons";
import {
  getClassTemplateBoards,
  getPrimaryTemplateBoardId,
} from "../../../../lib/classTemplateBoards";
import { readClassPrefs, writeClassPrefs } from "./classPagePrefs";

// Class project board bar shown between the class header and the tabs on every
// tab. Each board is a split button: the main part picks the board the
// Dashboard shows, the small right part opens its editor. Managing boards
// (settings, library, new templates) lives in the Settings tab.
export default function ClassTemplateBoardPicker({ myclass, page }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const [storedChoice, setStoredChoice] = useState(null);

  const boards = getClassTemplateBoards(myclass).filter((board) => board?.id);
  if (!boards.length) return null;

  const classId = myclass?.id;
  const isKnown = (id) => Boolean(id) && boards.some((b) => b.id === id);
  // On the Dashboard, mirror what it shows (`?template=`); elsewhere show the
  // remembered choice the Dashboard restores from.
  const selectedId =
    page === "dashboard"
      ? [router.query?.template].find(isKnown) ||
        (boards.length === 1 ? boards[0].id : null)
      : [
          storedChoice,
          readClassPrefs(classId)?.dashboard?.template,
          getPrimaryTemplateBoardId(myclass),
        ].find(isKnown) || boards[0].id;

  const goTo = (query) =>
    router.push({ pathname: `/dashboard/myclasses/${myclass?.code}`, query });

  const select = (boardId) => {
    if (page === "dashboard") {
      // The Dashboard drops milestone columns that aren't on the new board.
      router.replace(
        { pathname: router.pathname, query: { ...router.query, template: boardId } },
        undefined,
        { shallow: true }
      );
      return;
    }
    writeClassPrefs(classId, { dashboard: { template: boardId } });
    setStoredChoice(boardId);
  };

  return (
    <StyledBar
      role="group"
      aria-label={t("main.projectBoards", {}, { default: "Project boards" })}
    >
      {boards.map((board) => {
        const title =
          board.title ||
          t("dashboard.untitledTemplateBoard", {}, {
            default: "Untitled template",
          });
        const isSelected = board.id === selectedId;
        return (
          <SplitButton
            key={board.id}
            label={title}
            variant={isSelected ? "filled" : "outline"}
            selected={isSelected}
            title={t("main.showOnDashboard", { board: title }, {
              default: "Show {{board}} on the dashboard",
            })}
            onClick={() => select(board.id)}
            trailingIcon={<EditIcon />}
            trailingAriaLabel={t("main.editBoardNamed", { board: title }, {
              default: "Edit {{board}}",
            })}
            onTrailingClick={() => goTo({ page, editBoard: board.id })}
          />
        );
      })}
      <Button
        variant="text"
        className="classBoardSettingsButton"
        trailingIcon={<SettingsIcon />}
        style={{ color: "#171717" }}
        onClick={() => goTo({ page: "settings" })}
      >
        {t("main.classBoardSettings", {}, {
          default: "Class board settings",
        })}
      </Button>
    </StyledBar>
  );
}

const StyledBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;

  .classBoardSettingsButton {
    margin-left: auto;
  }
`;
