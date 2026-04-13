// components/DataJournal/SideNav/Workspace.js
import useTranslation from "next-translate/useTranslation";

import Button from "../../../../DesignSystem/Button";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";

import { useDataJournal } from "../Context/DataJournalContext";
import { useDeleteWorkspace } from "../Helpers/DeleteWorkspace";

export default function WorkspaceNavigation({
  journal,
  workspace,
  isWorkspaceSelected,
  selectedWorkspace,
  selectWorkspaceById,
}) {
  const { t } = useTranslation("builder");
  const { setSelectedWorkspace } = useDataJournal();

  const { confirmAndDelete } = useDeleteWorkspace({
    journal,
    workspace: selectedWorkspace,
    t,
    onDeleted: () => setSelectedWorkspace(null),
  });

  const menuItems = [
    {
      key: "delete",
      label: t("dataJournal.sideNav.deleteWorkspace", "Delete workspace"),
      danger: true,
      onClick: confirmAndDelete,
    },
  ];

  if (!isWorkspaceSelected) {
    return (
      <div className="workspace">
        <div style={{ minWidth: 0, width: "100%" }}>
        <Button
          type="button"
          variant="text"
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
            <img src={"/assets/dataviz/sidebar/workspace.svg"} alt="" width={20} height={20} aria-hidden style={{ flexShrink: 0 }} />
          }
        >
          <span className="workspaceRowLabel">{workspace?.title}</span>
        </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="selectedWorkspace">
      <div className="titleHeader">
        <div style={{ minWidth: 0 }}>
        <Button
          type="button"
          variant="text"
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
            <img src={"/assets/dataviz/sidebar/workspace.svg"} alt="" width={20} height={20} aria-hidden style={{ flexShrink: 0 }} />
          }
        >
          <span className="workspaceRowLabel" style={{ fontWeight: 700 }}>
            {workspace?.title}
          </span>
        </Button>
        </div>
        <DropdownMenu
          ariaLabel={t("dataJournal.sideNav.workspaceMore", "Workspace options")}
          trigger={<img src="/assets/dataviz/three-dots.svg" alt="" width={18} height={18} />}
          items={menuItems}
        />
      </div>

      {selectedWorkspace?.vizSections?.length ? (
        <div className="components">
          {selectedWorkspace?.vizSections?.map((component) => (
            <div key={component.id} className="component">
              <div>
                <img src="/assets/dataviz/sidebar/paragraph.svg" alt="" width={20} height={20} />
              </div>
              <div>
                {component?.title ||
                  t("dataJournal.sideNav.componentFallbackName", "Component name")}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
