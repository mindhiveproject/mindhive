import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { CLASS_TEMPLATE_PROJECTS_QUERY } from "../../../Queries/Proposal";
import { UPDATE_PROPOSAL_BOARD } from "../../../Mutations/Proposal";
import {
  classHasExplicitTemplateVisibility,
  getVisibleTemplateBoards,
  isTemplateVisibleToStudents,
  setTemplateVisibilityForClass,
} from "../../../../lib/classTemplateBoards";
import {
  getBoardAssignableToStudents,
  getBoardCurriculumType,
  getBoardStudentsCanAssignToCards,
  mergeBoardSettings,
} from "../../../../lib/proposalBoardSettings";
import { normalizeCurriculumType } from "../../../../lib/curriculumTypes";

function readBoardSettings(board) {
  return board?.settings && typeof board.settings === "object"
    ? board.settings
    : {};
}

export default function useTemplateBoardSettings({
  open,
  board,
  myclass,
  classTemplates,
}) {
  const { t } = useTranslation("classes");
  const classId = myclass?.id;
  const boardId = board?.id;

  const classContext = useMemo(
    () => ({
      ...myclass,
      classTemplateBoards: classTemplates,
    }),
    [myclass, classTemplates]
  );

  const [curriculumType, setCurriculumType] = useState("mindhive");
  const [assignableToStudents, setAssignableToStudents] = useState(false);
  const [studentsCanAssignToCards, setStudentsCanAssignToCards] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);

  const latestSettingsRef = useRef(null);
  const wasOpenRef = useRef(false);
  const prevBoardIdRef = useRef(null);

  const [updateProposalBoard, { loading: updating }] = useMutation(
    UPDATE_PROPOSAL_BOARD,
    {
      refetchQueries: classId
        ? [{ query: CLASS_TEMPLATE_PROJECTS_QUERY, variables: { classId } }]
        : [],
    }
  );

  // Initialize local state only when the modal opens or the target board changes.
  // Avoid re-syncing on query refetches, which would overwrite in-flight edits.
  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    const boardChanged =
      open && boardId && boardId !== prevBoardIdRef.current;
    wasOpenRef.current = open;
    prevBoardIdRef.current = boardId ?? null;

    if (!open || !board) {
      if (!open) {
        latestSettingsRef.current = null;
        prevBoardIdRef.current = null;
      }
      return;
    }

    if (!justOpened && !boardChanged && latestSettingsRef.current !== null) {
      return;
    }

    latestSettingsRef.current = { ...readBoardSettings(board) };
    setCurriculumType(getBoardCurriculumType(board, myclass));
    setAssignableToStudents(getBoardAssignableToStudents(board, myclass));
    setStudentsCanAssignToCards(
      getBoardStudentsCanAssignToCards(board, myclass)
    );
    setCopyVisible(
      isTemplateVisibleToStudents(board, classId, classContext)
    );
  }, [open, boardId, board, classId, classContext, myclass]);

  const persistBoardSettings = useCallback(
    async (patch) => {
      if (!boardId) return false;
      const nextSettings = mergeBoardSettings(
        latestSettingsRef.current ?? readBoardSettings(board),
        patch
      );
      latestSettingsRef.current = nextSettings;

      try {
        await updateProposalBoard({
          variables: {
            id: boardId,
            settings: nextSettings,
          },
        });
        return true;
      } catch (err) {
        alert(
          err?.message
            || t("failedToUpdateSettings", {}, {
              default: "Failed to update settings",
            })
        );
        return false;
      }
    },
    [board, boardId, updateProposalBoard, t]
  );

  const setCopyVisibility = async (nextVisible) => {
    if (!classId || !boardId || updating) return;

    const isVisible = isTemplateVisibleToStudents(board, classId, classContext);
    if (isVisible && !nextVisible) {
      const visibleCount = getVisibleTemplateBoards(classContext).length;
      if (visibleCount <= 1) {
        const confirmed = window.confirm(
          t(
            "projects.confirmHideLastTemplate",
            {},
            {
              default:
                "This is the only template students can copy. Prevent copy anyway? Students will not be able to start new projects until you allow copy for at least one template.",
            }
          )
        );
        if (!confirmed) return;
      }
    }

    const previousVisible = copyVisible;
    setCopyVisible(nextVisible);

    try {
      const enteringExplicitMode =
        !classHasExplicitTemplateVisibility(classContext);
      const currentBoardSettings =
        latestSettingsRef.current ?? readBoardSettings(board);

      const boardsToUpdate = enteringExplicitMode
        ? classTemplates.map((templateBoard) => ({
            id: templateBoard.id,
            settings: setTemplateVisibilityForClass(
              templateBoard.id === boardId
                ? currentBoardSettings
                : templateBoard.settings,
              classId,
              templateBoard.id === boardId
                ? nextVisible
                : isTemplateVisibleToStudents(
                    templateBoard,
                    classId,
                    classContext
                  )
            ),
          }))
        : [
            {
              id: boardId,
              settings: setTemplateVisibilityForClass(
                currentBoardSettings,
                classId,
                nextVisible
              ),
            },
          ];

      await Promise.all(
        boardsToUpdate.map((item) =>
          updateProposalBoard({
            variables: {
              id: item.id,
              settings: item.settings,
            },
          })
        )
      );

      if (boardsToUpdate.length === 1) {
        latestSettingsRef.current = boardsToUpdate[0].settings;
      } else {
        const currentBoardUpdate = boardsToUpdate.find(
          (item) => item.id === boardId
        );
        if (currentBoardUpdate) {
          latestSettingsRef.current = currentBoardUpdate.settings;
        }
      }
    } catch (err) {
      setCopyVisible(previousVisible);
      alert(
        err?.message
          || t("projects.toggleVisibilityError", {}, {
            default: "Failed to update template copy setting.",
          })
      );
    }
  };

  return {
    updating,
    curriculumType,
    assignableToStudents,
    studentsCanAssignToCards,
    copyVisible,
    onCurriculumTypeChange: async (value) => {
      const normalized = normalizeCurriculumType(value);
      const previous = curriculumType;
      setCurriculumType(normalized);
      const saved = await persistBoardSettings({ curriculumType: normalized });
      if (!saved) setCurriculumType(previous);
    },
    onAssignableChange: async (value) => {
      const previousAssignable = assignableToStudents;
      const previousStudentsCanAssign = studentsCanAssignToCards;
      setAssignableToStudents(value);
      const patch = { assignableToStudents: value };
      if (value) {
        patch.studentsCanAssignToCards = false;
        setStudentsCanAssignToCards(false);
      }
      const saved = await persistBoardSettings(patch);
      if (!saved) {
        setAssignableToStudents(previousAssignable);
        setStudentsCanAssignToCards(previousStudentsCanAssign);
      }
    },
    onStudentsCanAssignChange: async (value) => {
      const previous = studentsCanAssignToCards;
      setStudentsCanAssignToCards(value);
      const saved = await persistBoardSettings({ studentsCanAssignToCards: value });
      if (!saved) setStudentsCanAssignToCards(previous);
    },
    onCopyVisibilityChange: setCopyVisibility,
  };
}
