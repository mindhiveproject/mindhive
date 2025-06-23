import { useState, useMemo, useCallback } from "react";
import { useMutation } from "@apollo/client";
import {
  CREATE_DATA_COMPONENT,
  DELETE_DATA_COMPONENT,
  UPDATE_DATA_COMPONENT,
} from "../../../../Mutations/DataComponent";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Widget from "./Widget";
import TopNavigation from "../TopNav/Main";
import SideNavigation from "../SideNav/Main";
import ComponentEditor from "../ComponentEditor/Main";
import {
  SidebarPusher,
  SidebarPushable,
  Checkbox,
  Segment,
  Sidebar,
} from "semantic-ui-react";
import {
  StyledDataWorkspace,
  StyledRightPanel,
} from "../styles/StyledDataJournal";

export default function Grid({
  dataJournals,
  journalId,
  selectJournalById,
  workspaces,
  workspace,
  updateWorkspace,
  selectWorkspaceById,
}) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeComponentId, setActiveComponentId] = useState(null);

  const layout = useMemo(() => workspace?.layout || [], [workspace]);
  const components = useMemo(() => workspace?.vizSections || [], [workspace]);

  const [createComponent] = useMutation(CREATE_DATA_COMPONENT, {
    variables: {},
    refetchQueries: [],
  });

  const [deleteComponent] = useMutation(DELETE_DATA_COMPONENT, {
    variables: {},
    refetchQueries: [],
  });

  const [updateComponent] = useMutation(UPDATE_DATA_COMPONENT, {
    refetchQueries: [],
  });

  const handleLayoutChange = useCallback(
    (newLayout) => {
      console.log("Grid handleLayoutChange:", newLayout);
      updateWorkspace({ layout: newLayout });
    },
    [updateWorkspace]
  );

  const handleComponentSelect = useCallback(
    (componentId) => {
      console.log(
        `Grid handleComponentSelect: ${componentId}, current active: ${activeComponentId}`
      );
      setActiveComponentId((prev) =>
        prev === componentId ? null : componentId
      );
    },
    [activeComponentId]
  );

  const handleAddComponent = useCallback(
    async (type) => {
      const res = await createComponent({
        variables: {
          input: {
            type: type,
            content: { text: "" },
            vizChapter: {
              connect: {
                id: workspace?.id,
              },
            },
          },
        },
      });
      const newComponentId = res?.data?.createVizSection?.id;
      const newComponent = { id: newComponentId, type, content: { text: "" } };
      const newLayoutItem = {
        i: newComponentId,
        x: (layout?.length * 2) % 12,
        y: 0,
        w: 4,
        h: 10,
        minW: 2,
        minH: 5,
        maxW: 12,
        maxH: 20,
      };

      const newComponents = [...components, newComponent];
      const newLayout = [...layout, newLayoutItem];
      updateWorkspace({ vizSections: newComponents, layout: newLayout });
    },
    [createComponent, workspace, layout, components, updateWorkspace]
  );

  const handleRemoveComponent = useCallback(
    async (componentId) => {
      await deleteComponent({
        variables: { id: componentId },
      });
      const newComponents = components.filter((w) => w.id !== componentId);
      const newLayout = layout.filter((l) => l.i !== componentId);
      updateWorkspace({ vizSections: newComponents, layout: newLayout });
      if (activeComponentId === componentId) setActiveComponentId(null);
    },
    [deleteComponent, components, layout, activeComponentId, updateWorkspace]
  );

  const handleUpdateComponent = useCallback(
    ({ componentId, field, value }) => {
      console.log("Grid handleUpdateComponent:", { componentId, field, value });
      const updatedComponents = components.map((comp) =>
        comp.id === componentId
          ? {
              ...comp,
              content: { ...comp.content, [field]: value },
            }
          : comp
      );
      updateWorkspace({ vizSections: updatedComponents });
    },
    [components, updateWorkspace]
  );

  const handleSaveComponent = useCallback(
    async (componentId) => {
      console.log("Grid handleSaveComponent:", componentId);
      const component = components.find((comp) => comp.id === componentId);
      if (component) {
        try {
          await updateComponent({
            variables: {
              id: componentId,
              input: {
                content: component.content,
              },
            },
          });
        } catch (err) {
          console.error("Error saving component:", err);
        }
      }
    },
    [components, updateComponent]
  );

  console.log("Grid rendering, activeComponentId:", activeComponentId);
  console.log("Grid components:", components);

  return (
    <StyledDataWorkspace>
      <TopNavigation
        journalId={journalId}
        workspace={workspace}
        activeComponentId={activeComponentId}
        handleAddComponent={handleAddComponent}
      />
      <div className="dashboard">
        <Checkbox
          checked={sidebarVisible}
          label={{ children: <code>visible</code> }}
          onChange={(e, data) => setSidebarVisible(data.checked)}
        />
        <SidebarPushable as={Segment}>
          <Sidebar
            animation="push"
            icon="labeled"
            inverted
            vertical
            visible={sidebarVisible}
            width="wide"
          >
            <SideNavigation
              dataJournals={dataJournals}
              selectedJournalId={journalId}
              selectJournalById={selectJournalById}
              workspaces={workspaces}
              selectedWorkspace={workspace}
              selectWorkspaceById={selectWorkspaceById}
            />
          </Sidebar>

          <SidebarPusher>
            <Segment basic>
              <div className="canvas">
                <GridLayout
                  className="layout"
                  layout={layout}
                  cols={12}
                  rowHeight={30}
                  width={920}
                  onLayoutChange={handleLayoutChange}
                  isDraggable={true}
                  isResizable={true}
                  compactType="vertical"
                  preventCollision={false}
                  margin={[16, 16]}
                >
                  {components.map((widget) => {
                    const layoutItem = layout.find(
                      (l) => l.i === widget.id
                    ) || {
                      i: widget.id,
                      x: 0,
                      y: 0,
                      w: 4,
                      h: 10,
                      minW: 2,
                      minH: 5,
                      maxW: 12,
                      maxH: 20,
                    };
                    return (
                      <div
                        key={widget.id}
                        data-grid={layoutItem}
                        className="widgetContainer"
                        style={{ position: "static" }}
                      >
                        <Widget
                          id={widget.id}
                          type={widget.type}
                          content={widget.content}
                          isActive={widget.id === activeComponentId}
                          onSelect={handleComponentSelect}
                          handleRemoveComponent={handleRemoveComponent}
                        />
                      </div>
                    );
                  })}
                </GridLayout>
              </div>
            </Segment>
          </SidebarPusher>
        </SidebarPushable>
        {activeComponentId && (
          <StyledRightPanel>
            <ComponentEditor
              component={components.find(
                (comp) => comp.id === activeComponentId
              )}
              onChange={handleUpdateComponent}
              onSave={() => handleSaveComponent(activeComponentId)}
              onDelete={() => handleRemoveComponent(activeComponentId)}
            />
          </StyledRightPanel>
        )}
      </div>
    </StyledDataWorkspace>
  );
}
