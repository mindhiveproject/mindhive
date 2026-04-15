// components/DataJournal/SideNav/Workspace.js
import { useState } from "react";
import { createPortal } from "react-dom";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";

import { useDataJournal } from "../Context/DataJournalContext";
import { useDeleteWorkspace } from "../Helpers/DeleteWorkspace";
import RenameWorkspaceModal from "../Helpers/RenameWorkspaceModal";
import getVizComponentIconSrc from "../Helpers/getVizComponentIconSrc";
import {
  StyledModalBody,
  StyledModalButton,
  StyledModalContent,
  StyledModalFooter,
  StyledModalHeader,
  StyledModalOverlay,
} from "../styles/StyledDataSourceModal";

export default function WorkspaceNavigation({
  journal,
  workspace,
  isWorkspaceSelected,
  selectedWorkspace,
  selectWorkspaceById,
}) {
  const { t } = useTranslation("builder");
  const { t: tCommon } = useTranslation("common");
  const { setSelectedWorkspace } = useDataJournal();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const { runDeleteWorkspace, deleting } = useDeleteWorkspace({
    journal,
    workspace,
    t,
    onDeleted: () => setSelectedWorkspace(null),
  });

  const menuItems = [
    {
      key: "rename",
      label: t("dataJournal.sideNav.renameWorkspace", {}, {
        default: "Rename workspace",
      }),
      onClick: () => setRenameOpen(true),
    },
    {
      key: "delete",
      label: t("dataJournal.sideNav.deleteWorkspace", {}, {
        default: "Delete workspace",
      }),
      danger: true,
      onClick: () => {
        setDeleteError(null);
        setDeleteConfirmOpen(true);
      },
    },
  ];

  return (
    <>
      {!isWorkspaceSelected ? (
        <div className="workspace">
          <div style={{ minWidth: 0, width: "100%" }}>
            <Button
              type="button"
              variant="text"
              className="dataJournalWorkspaceRowBtn"
              style={{
                color: "#5D5763",
                fontWeight: 400,
                height: "auto",
                minHeight: "32px",
                padding: "4px 8px",
                justifyContent: "flex-start",
                width: "100%",
              }}
              onClick={() => selectWorkspaceById({ id: workspace?.id })}
              leadingIcon={
                <img
                  src={"/assets/dataviz/sidebar/workspace.svg"}
                  alt=""
                  width={20}
                  height={20}
                  aria-hidden
                  style={{ flexShrink: 0 }}
                />
              }
            >
              <span className="workspaceRowLabel">{workspace?.title}</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="selectedWorkspace">
          <div className="titleHeader">
            <div style={{ minWidth: 0 }}>
              <Button
                type="button"
                variant="text"
                className="dataJournalWorkspaceRowBtn"
                style={{
                  color: "#5D5763",
                  fontWeight: 700,
                  height: "auto",
                  minHeight: "32px",
                  padding: "4px 8px",
                  justifyContent: "flex-start",
                  width: "100%",
                  minWidth: 0,
                }}
                onClick={() => selectWorkspaceById({ id: workspace?.id })}
                leadingIcon={
                  <img
                    src={"/assets/dataviz/sidebar/workspace.svg"}
                    alt=""
                    width={20}
                    height={20}
                    aria-hidden
                    style={{ flexShrink: 0 }}
                  />
                }
              >
                <span className="workspaceRowLabel" style={{ fontWeight: 700 }}>
                  {workspace?.title}
                </span>
              </Button>
            </div>
            <DropdownMenu
              ariaLabel={t("dataJournal.sideNav.workspaceMore", {}, {
                default: "Workspace options",
              })}
              trigger={
                <img src="/assets/dataviz/three-dots.svg" alt="" width={18} height={18} />
              }
              items={menuItems}
            />
          </div>

          {selectedWorkspace?.vizSections?.length ? (
            <div className="components">
              {selectedWorkspace?.vizSections?.map((component) => (
                <div key={component.id} className="component">
                  <div>
                    <img
                      src={getVizComponentIconSrc(component)}
                      alt=""
                      width={20}
                      height={20}
                      aria-hidden
                    />
                  </div>
                  <div>
                    {component?.title ||
                      t("dataJournal.sideNav.componentFallbackName", {}, {
                        default: "Component name",
                      })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <RenameWorkspaceModal
        open={renameOpen}
        onOpenChange={setRenameOpen}
        journal={journal}
        workspace={workspace}
      />

      {deleteConfirmOpen && typeof document !== "undefined"
        ? createPortal(
            <StyledModalOverlay
              style={{ zIndex: 20050 }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !deleting) setDeleteConfirmOpen(false);
              }}
            >
              <StyledModalContent
                style={{ maxWidth: 440, width: "90%" }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              >
                <StyledModalHeader>
                  <h2 style={{ margin: 0 }}>
                    {t("dataJournal.sideNav.deleteWorkspaceModalTitle", {}, {
                      default: "Delete workspace",
                    })}
                  </h2>
                </StyledModalHeader>
                <StyledModalBody>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "#333",
                    }}
                  >
                    {t("dataJournal.sideNav.deleteWorkspaceConfirm", {}, {
                      default:
                        "Are you sure you want to delete this workspace? All components in this workspace will be deleted as well.",
                    })}
                  </p>
                  {deleteError ? (
                    <p
                      role="alert"
                      style={{
                        marginTop: 12,
                        marginBottom: 0,
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: "#c62828",
                      }}
                    >
                      {deleteError}
                    </p>
                  ) : null}
                </StyledModalBody>
                <StyledModalFooter>
                  <StyledModalButton
                    type="button"
                    className="cancel"
                    disabled={deleting}
                    onClick={() => {
                      if (!deleting) setDeleteConfirmOpen(false);
                    }}
                  >
                    {tCommon("cancel", {}, { default: "Cancel" })}
                  </StyledModalButton>
                  <StyledModalButton
                    type="button"
                    disabled={deleting}
                    style={{
                      marginLeft: 8,
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: 6,
                      cursor: deleting ? "not-allowed" : "pointer",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      background: "#c62828",
                      color: "#fff",
                    }}
                    onClick={async () => {
                      setDeleteError(null);
                      const result = await runDeleteWorkspace();
                      if (result.ok) {
                        setDeleteConfirmOpen(false);
                      } else if (result.message) {
                        setDeleteError(result.message);
                      }
                    }}
                  >
                    {t("dataJournal.sideNav.deleteWorkspace", {}, {
                      default: "Delete workspace",
                    })}
                  </StyledModalButton>
                </StyledModalFooter>
              </StyledModalContent>
            </StyledModalOverlay>,
            document.body,
          )
        : null}
    </>
  );
}
