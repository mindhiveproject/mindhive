import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  BreadcrumbSection,
  BreadcrumbDivider,
  Breadcrumb,
} from "semantic-ui-react";

import { StyledTopNavigation } from "../styles/StyledDataJournal";
// import SaveWorkspace from "../Workspace/Save";

import { UPDATE_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { GET_WORKSPACE } from "../../../../Queries/DataWorkspace";

export default function TopNavigation({
  area,
  setArea,
  journal,
  workspace,
  activeComponent,
  handleAddComponent,
  toggleComponentPanel,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(workspace?.title || "");
  const [updateVizChapter] = useMutation(UPDATE_VIZCHAPTER, {
    refetchQueries: [
      {
        query: GET_WORKSPACE,
        variables: { id: workspace?.id },
      },
    ],
  });

  const handleEditClick = () => {
    setIsEditing(true);
    setNewTitle(workspace?.title || "");
  };

  const handleTitleChange = (e) => {
    setNewTitle(e.target.value);
  };

  const handleTitleSubmit = async () => {
    if (newTitle.trim() && newTitle !== workspace?.title) {
      try {
        await updateVizChapter({
          variables: {
            id: workspace?.id,
            input: { title: newTitle },
          },
        });
        // Update local state or refetch data if needed
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating workspace title:", error);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleTitleSubmit();
    }
  };

  return (
    <StyledTopNavigation>
      <div className="leftIconNav">
        <div
          className={`titleArea ${area === "journals" && "active"}`}
          onClick={() => setArea("journals")}
        >
          <div className="icon">
            {area === "journals" ? (
              <img src="/assets/dataviz/journalsSelected.png" />
            ) : (
              <img src="/assets/dataviz/journals.png" />
            )}
          </div>
          <div>Journals</div>
        </div>

        <div
          className={`titleArea ${area === "datasets" && "active"}`}
          onClick={() => setArea("datasets")}
        >
          <div className="icon">
            {area === "datasets" ? (
              <img src="/assets/dataviz/datasetSelected.png" />
            ) : (
              <img src="/assets/dataviz/dataset.png" />
            )}
          </div>
          <div>Datasets</div>
        </div>
      </div>

      <div>
        {area === "journals" && journal?.id && (
          <Breadcrumb size="massive">
            <BreadcrumbSection link>{journal?.title}</BreadcrumbSection>
            <BreadcrumbDivider icon="right angle" />
            <BreadcrumbSection link>
              {isEditing ? (
                <input
                  type="text"
                  value={newTitle}
                  onChange={handleTitleChange}
                  onKeyPress={handleKeyPress}
                  onBlur={handleTitleSubmit}
                  autoFocus
                />
              ) : (
                <>
                  {workspace?.title}
                  <img
                    src="/assets/dataviz/edit.png"
                    onClick={handleEditClick}
                    style={{ cursor: "pointer", marginLeft: "5px" }}
                  />
                </>
              )}
            </BreadcrumbSection>
            <BreadcrumbDivider icon="right angle" />
            <BreadcrumbSection active>
              {activeComponent?.title}
            </BreadcrumbSection>
          </Breadcrumb>
        )}
        {area === "journals" && !journal?.id && (
          <div>Select a Journal to start ...</div>
        )}
      </div>
      <div className="buttons">
        {area === "journals" && workspace?.id && (
          <div>
            <button
              className="custonBtn"
              onClick={() => toggleComponentPanel(true)}
            >
              Add a Component
            </button>
          </div>
        )}
        {/* <SaveWorkspace workspace={workspace} /> */}
      </div>
    </StyledTopNavigation>
  );
}
