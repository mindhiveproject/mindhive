import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";
import { ADD_VIZCHAPTER } from "../../../../Mutations/VizChapter";
import { GET_DATA_JOURNAL } from "../../../../Queries/DataJournal";

export default function AddWorkspace({ journalId }) {
  const { t } = useTranslation("builder");

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

  const blocked = loading || !journalId;

  const label = t(
    "dataJournal.sideNav.addWorkspaceDropdown",
    {},
    { default: "Workspace" },
  );
  const ariaLabel = t(
    "dataJournal.sideNav.addWorkspaceAria",
    {},
    { default: "Add a workspace to this journal" },
  );

  const menuItems = [
    {
      key: "scratch",
      label: t("dataJournal.sideNav.addWorkspaceScratch", {}, {
        default: "Create a workspace from scratch",
      }),
      onClick: addNewWorkspace,
    },
    // {
    //   key: "template",
    //   label: t("dataJournal.sideNav.addWorkspaceTemplate", {}, {
    //     default: "Add a workspace template",
    //   }),
    //   onClick: addNewWorkspaceFromTemplate,
    // },
  ];

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
    <div className="addWorkspaceBtn">
      <DropdownMenu
        ariaLabel={ariaLabel}
        renderTrigger={({ onClick, open, ariaLabel: triggerAriaLabel }) => (
          <Button
            variant="subtle"
            leadingIcon={<img src="/assets/icons/plus.svg" alt="" />}
            type="button"
            aria-label={triggerAriaLabel}
            aria-expanded={open}
            aria-haspopup="menu"
            onClick={onClick}
            disabled={blocked}
          >
            {label}
          </Button>
        )}
        items={menuItems}
      />
    </div>
  );
}
