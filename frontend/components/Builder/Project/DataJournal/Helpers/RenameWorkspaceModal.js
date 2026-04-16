// Rename VizChapter (workspace) from the data journal side nav

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { UPDATE_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";
import { GET_WORKSPACE } from "../../../../Queries/DataWorkspace";

import {
  StyledModalOverlay,
  StyledModalContent,
  StyledModalHeader,
  StyledModalBody,
  StyledModalFooter,
  StyledModalButton,
} from "../styles/StyledDataSourceModal";

const inputStyle = {
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  lineHeight: 1.4,
  color: "#1a1a1a",
  border: "1px solid #e6e6e6",
  borderRadius: 6,
  padding: "10px 12px",
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
};

const labelStyle = {
  display: "block",
  fontFamily: "Inter, sans-serif",
  fontSize: 13,
  fontWeight: 500,
  color: "#333",
  marginBottom: 6,
};

export default function RenameWorkspaceModal({
  open,
  onOpenChange,
  journal,
  workspace,
}) {
  const { t } = useTranslation("builder");
  const { t: tCommon } = useTranslation("common");
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    if (open && workspace) {
      setDraftTitle(typeof workspace.title === "string" ? workspace.title : "");
    }
  }, [open, workspace?.id, workspace?.title]);

  const [updateVizChapter, { loading }] = useMutation(UPDATE_VIZCHAPTER);

  const handleClose = () => {
    if (!loading) onOpenChange(false);
  };

  const handleSave = async () => {
    const trimmed = draftTitle.trim();
    if (!workspace?.id || !journal?.id) {
      handleClose();
      return;
    }
    const current = typeof workspace.title === "string" ? workspace.title : "";
    if (!trimmed || trimmed === current) {
      handleClose();
      return;
    }
    try {
      await updateVizChapter({
        variables: {
          id: workspace.id,
          input: { title: trimmed },
        },
        refetchQueries: [
          { query: GET_DATA_JOURNAL, variables: { id: journal.id } },
          { query: GET_WORKSPACE, variables: { id: workspace.id } },
        ],
      });
      handleClose();
    } catch (error) {
      console.error("Error updating workspace title:", error);
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <StyledModalOverlay
      style={{ zIndex: 20050 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <StyledModalContent
        style={{ maxWidth: 440, width: "90%" }}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
      >
        {/* <StyledModalHeader>
          <h2 style={{ margin: 0 }}>
            {t("dataJournal.sideNav.renameWorkspaceModalTitle", {}, {
              default: "Rename workspace",
            })}
          </h2>
        </StyledModalHeader> */}
        <StyledModalBody>
          <label htmlFor="rename-workspace-title-input" style={labelStyle}>
            {t("dataJournal.sideNav.renameWorkspaceModalTitle", {}, {
              default: "Rename workspace",
            })}
          </label>
          <input
            id="rename-workspace-title-input"
            type="text"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
              if (e.key === "Escape" && !loading) {
                e.preventDefault();
                handleClose();
              }
            }}
            disabled={loading}
            autoFocus
            style={{
              ...inputStyle,
              outline: "none",
            }}
            aria-label={t("dataJournal.sideNav.renameWorkspaceLabel", {}, {
              default: "Workspace name",
            })}
          />
        </StyledModalBody>
        <StyledModalFooter>
          <StyledModalButton
            type="button"
            className="cancel"
            disabled={loading}
            onClick={handleClose}
          >
            {tCommon("cancel", {}, { default: "Cancel" })}
          </StyledModalButton>
          <StyledModalButton
            type="button"
            className="save"
            disabled={loading}
            onClick={handleSave}
          >
            {loading
              ? t("dataJournal.sideNav.renameWorkspaceSaving", {}, {
                  default: "Saving…",
                })
              : tCommon("save", {}, { default: "Save" })}
          </StyledModalButton>
        </StyledModalFooter>
      </StyledModalContent>
    </StyledModalOverlay>,
    document.body,
  );
}
