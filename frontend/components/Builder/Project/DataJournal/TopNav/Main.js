// components/DataJournal/TopNav/Main.js
import { useState } from "react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { StyledTopNavigation } from "../styles/StyledDataJournal"; // Adjust path
import Chip from "../../../../DesignSystem/Chip";
import Button from "../../../../DesignSystem/Button";
import Breadcrumbs from "./Breadcrumbs/Main";

import { UPDATE_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { GET_WORKSPACE } from "../../../../Queries/DataWorkspace";

import { useDataJournal } from "../Context/DataJournalContext"; // Adjust path

const LEFT_NAV_SELECTED_BG = "#EDF4F5";

export default function TopNavigation() {
  const { t } = useTranslation("dataviz");
  const {
    area,
    setArea,
    selectedJournal: journal,
    workspace,
    setIsAddComponentPanelOpen,
    setActiveComponent,
  } = useDataJournal();

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

  const toggleComponentPanel = () => {
    setIsAddComponentPanelOpen((wasOpen) => {
      if (!wasOpen) {
        setActiveComponent(null);
      }
      return !wasOpen;
    });
  };

  return (
    <StyledTopNavigation>
      <div className="leftIconNav">
        <Chip
          className="leftNavChip"
          label={t("dataJournal.topNav.journals", "Journals")}
          selected={area === "journals"}
          onClick={() => setArea("journals")}
          shape="square"
          style={{
            border: "none",
            background: area === "journals" ? LEFT_NAV_SELECTED_BG : "transparent",
            backgroundColor:
              area === "journals" ? LEFT_NAV_SELECTED_BG : "transparent",
          }}
          leading={
            <img
              src={
                area === "journals"
                  ? "/assets/dataviz/journalsSelected.svg"
                  : "/assets/dataviz/journals.svg"
              }
              alt=""
              width="24"
              height="24"
            />
          }
        />

        <Chip
          className="leftNavChip"
          label={t("dataJournal.topNav.datasets", "Datasets")}
          selected={area === "datasets"}
          onClick={() => setArea("datasets")}
          shape="square"
          style={{
            border: "none",
            background: area === "datasets" ? LEFT_NAV_SELECTED_BG : "transparent",
            backgroundColor:
              area === "datasets" ? LEFT_NAV_SELECTED_BG : "transparent",
          }}
          leading={
            <img
              src={
                area === "datasets"
                  ? "/assets/dataviz/datasetSelected.svg"
                  : "/assets/dataviz/dataset.svg"
              }
              alt=""
              width="24"
              height="24"
            />
          }
        />
      </div>

      <div>
        {area === "journals" && journal?.id && (
          <Breadcrumbs
            journalTitle={journal?.title}
            workspaceTitle={workspace?.title}
            isEditing={isEditing}
            newTitle={newTitle}
            onTitleChange={handleTitleChange}
            onKeyPress={handleKeyPress}
            onTitleSubmit={handleTitleSubmit}
            onEditClick={handleEditClick}
            editWorkspaceLabel={t(
              "dataJournal.topNav.editWorkspaceName",
              "Edit workspace name"
            )}
          />
        )}
        {area === "journals" && !journal?.id && (
          <div>{t("dataJournal.topNav.selectJournal", "Select a Journal to start ...")}</div>
        )}
      </div>
      <div className="buttons">
        {area === "journals" && workspace?.id && (
          <div>
            <Button variant="filled" onClick={toggleComponentPanel}>
              {t("dataJournal.topNav.addComponent", "Add a Component")}
            </Button>
          </div>
        )}
        {/* <SaveWorkspace workspace={workspace} /> */}
      </div>
    </StyledTopNavigation>
  );
}
