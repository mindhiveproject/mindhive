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
    height: 23px;
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

  .editButton {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #a1a1a1;
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
  isEditing,
  newTitle,
  onTitleChange,
  onTitleSubmit,
  onEditClick,
  onKeyPress,
  editWorkspaceLabel,
}) {
  return (
    <StyledBreadcrumbs>
      <div className="crumbRow">
        <span>{journalTitle}</span>
      </div>

      <div className="workspaceRow">
        <span className="crumbChevron">
          <Separator />
        </span>
        {isEditing ? (
          <div className="workspaceTitleWrap">
            <input
              type="text"
              className="workspaceInput"
              value={newTitle}
              onChange={onTitleChange}
              onKeyPress={onKeyPress}
              onBlur={onTitleSubmit}
              autoFocus
            />
          </div>
        ) : (
          <>
            <div className="workspaceTitleWrap">
              <span className="workspaceTitle">{workspaceTitle}</span>
            </div>
            <button
              type="button"
              className="editButton"
              onClick={onEditClick}
              aria-label={editWorkspaceLabel}
            >
              <img src="/assets/icons/visualize/edit.svg" alt="" />
            </button>
          </>
        )}
      </div>
    </StyledBreadcrumbs>
  );
}
