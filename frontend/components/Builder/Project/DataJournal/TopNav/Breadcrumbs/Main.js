import styled from "styled-components";

const StyledBreadcrumbs = styled.div`
  display: flex;
  align-items: center;
  justify-content: left;
  gap: 8px;
  font-family: "Inter";
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 20px;


  .crumbRow {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 23px;
  }

  .journalTitleWrap {
    display: inline-flex;
    align-items: center;
    max-width: 350px;
    min-height: 28px;
    padding: 0;
    border-bottom: 2px solid transparent;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .crumbClickable {
    cursor: pointer;
    padding: 0 4px;
    border-radius: 0px;
  }

  .crumbClickable:hover:not(.isEditing) {
    background-color: rgba(23, 23, 23, 0.06);
  }

  .journalTitleWrap.crumbClickable:hover:not(.isEditing) {
    border-bottom-color: #f2be42;
  }

  .journalTitle {
    max-width: 350px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .crumbChevron {
    width: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .workspaceRow {
    display: flex;
    align-items: center;
    padding: 2px 0 2px 0;
    gap: 8px;
    height: 40px;
    color: #171717;
  }

  .workspaceTitle {
    max-width: 350px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .workspaceTitleWrap {
    display: flex;
    align-items: center;
    border-bottom: 2px solid #f2be42;
    height: 100%;
    padding: 0;
    border-radius: 4px;
    transition: background-color 0.15s ease;
  }

  .workspaceTitleWrap.crumbClickable:hover:not(.isEditing) {
    background-color: rgba(23, 23, 23, 0.06);
  }

  .workspaceInput {
    width: 240px;
    max-width: 350px;
    border: none;
    outline: none;
    padding: 0;
    margin: 0;
    background: transparent;
  }
`;

function Separator() {
  return (
    <span aria-hidden="true" style={{ color: "#A1A1A1" }}>/</span>
  );
}

export default function Breadcrumbs({
  journalTitle,
  workspaceTitle,
  editingTarget,
  draftTitle,
  onDraftChange,
  onJournalTitleClick,
  onWorkspaceTitleClick,
  onSubmit,
  onKeyDown,
  editJournalLabel,
  editWorkspaceLabel,
  workspaceEditable,
}) {
  const editingJournal = editingTarget === "journal";
  const editingWorkspace = editingTarget === "workspace";

  return (
    <StyledBreadcrumbs>
      <div className="crumbRow">
        {editingJournal ? (
          <div className={`journalTitleWrap isEditing`}>
            <input
              type="text"
              className="workspaceInput"
              value={draftTitle}
              onChange={onDraftChange}
              onKeyDown={onKeyDown}
              onBlur={onSubmit}
              autoFocus
              aria-label={editJournalLabel}
            />
          </div>
        ) : (
          <div
            className="journalTitleWrap crumbClickable"
            onClick={onJournalTitleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onJournalTitleClick();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={editJournalLabel}
          >
            <span className="journalTitle">{journalTitle}</span>
          </div>
        )}
      </div>

      <div className="workspaceRow">
        <span className="crumbChevron">
          <Separator />
        </span>
        {editingWorkspace ? (
          <div className={`workspaceTitleWrap isEditing`}>
            <input
              type="text"
              className="workspaceInput"
              value={draftTitle}
              onChange={onDraftChange}
              onKeyDown={onKeyDown}
              onBlur={onSubmit}
              autoFocus
              aria-label={editWorkspaceLabel}
            />
          </div>
        ) : (
          <div
            className={`workspaceTitleWrap${
              workspaceEditable ? " crumbClickable" : ""
            }`}
            onClick={workspaceEditable ? onWorkspaceTitleClick : undefined}
            onKeyDown={
              workspaceEditable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onWorkspaceTitleClick();
                    }
                  }
                : undefined
            }
            role={workspaceEditable ? "button" : undefined}
            tabIndex={workspaceEditable ? 0 : undefined}
            aria-label={workspaceEditable ? editWorkspaceLabel : undefined}
            style={!workspaceEditable ? { cursor: "default" } : undefined}
          >
            <span className="workspaceTitle">{workspaceTitle}</span>
          </div>
        )}
      </div>
    </StyledBreadcrumbs>
  );
}
