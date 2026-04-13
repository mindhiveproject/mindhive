import { useMutation } from "@apollo/client";
import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { ADD_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";

const ADD_NEW_WORKSPACE_VALUE = "__add_new_workspace__";
const ADD_TEMPLATE_WORKSPACE_VALUE = "__add_template_workspace__";

const WORKSPACE_DROPDOWN_TRIGGER_STYLE = {
  backgroundColor: "#F6F9F8",
  border: "none",
  fontWeight: 600,
  fontSize: "16px",
  color: "#5D5763",
};

export default function AddWorkspace({ journalId }) {
  const { t } = useTranslation("builder");
  const [workspaceDropdownValue, setWorkspaceDropdownValue] = useState(
    undefined
  );

  const [addChapter, { loading, error }] = useMutation(ADD_VIZCHAPTER, {
    refetchQueries: [
      {
        query: GET_DATA_JOURNAL,
        variables: {
          id: journalId,
        },
      },
    ],
  });

  const addNewWorkspace = () => {
    addChapter({
      variables: {
        input: {
          title: t("dataJournal.sideNav.defaultWorkspaceTitle", {}, {
            default: "Unnamed workspace",
          }),
          vizPart: {
            connect: {
              id: journalId,
            },
          },
        },
      },
    });
  };

  const addNewWorkspaceFromTemplate = () => {
    console.log("addNewWorkspaceFromTemplate");
  };

  const handleWorkspaceDropdownChange = (next) => {
    if (loading || !journalId) return;
    if (next === ADD_NEW_WORKSPACE_VALUE) {
      addNewWorkspace();
      setWorkspaceDropdownValue(undefined);
      return;
    }
    if (next === ADD_TEMPLATE_WORKSPACE_VALUE) {
      addNewWorkspaceFromTemplate();
      setWorkspaceDropdownValue(undefined);
      return;
    }
    setWorkspaceDropdownValue(next);
  };

  const workspaceDropdownOptions = [
    {
      value: ADD_NEW_WORKSPACE_VALUE,
      label: t("dataJournal.sideNav.addWorkspaceScratch", {}, {
        default: "Create a workspace from scratch",
      }),
    },
    // {
    //   value: ADD_TEMPLATE_WORKSPACE_VALUE,
    //   label: t("dataJournal.sideNav.addWorkspaceTemplate", {}, {
    //     default: "Add a workspace template",
    //   }),
    // },
  ];

  const blocked = loading || !journalId;

  if (error) {
    return (
      <div className="addWorkspaceError" style={{ marginTop: 8 }}>
        {t("dataJournal.sideNav.addWorkspaceError", {}, {
          default: "Error adding workspace",
        })}
      </div>
    );
  }

  return (
    <div className="addWorkspaceBtn" style={{ marginTop: 8 }}>
      <DropdownSelect
        value={workspaceDropdownValue}
        options={workspaceDropdownOptions}
        onChange={handleWorkspaceDropdownChange}
        ariaLabel={t("dataJournal.sideNav.addWorkspaceDropdown", {}, {
          default: "Workspace",
        })}
        placeholder={t("dataJournal.sideNav.addWorkspaceDropdown", {}, {
          default: "Workspace",
        })}
        icon="+"
        triggerStyle={{
          ...WORKSPACE_DROPDOWN_TRIGGER_STYLE,
          ...(blocked
            ? {
                opacity: 0.55,
                pointerEvents: "none",
                cursor: "not-allowed",
              }
            : {}),
        }}
      />
    </div>
  );
}
