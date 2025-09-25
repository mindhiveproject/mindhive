import { useState, useMemo, useCallback, useEffect } from "react";
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

import Datasets from "../Datasets/Main";
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
import ComponentPanel from "./ComponentPanel/Main";

export default function Grid({
  user,
  projectId,
  studyId,
  dataJournals,
  journal,
  journalId,
  selectJournalById,
  workspaces,
  workspace,
  updateWorkspace,
  selectWorkspaceById,
  pyodide,
  initData,
  initVariables,
  initSettings,
}) {
  const [area, setArea] = useState("journals");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeComponentId, setActiveComponentId] = useState(null);
  const [isAddComponentPanelOpen, setIsAddComponentPanelOpen] = useState(false);

  const layout = useMemo(() => workspace?.layout || [], [workspace]);
  const components = useMemo(() => workspace?.vizSections || [], [workspace]);

  // data, variables, and settings
  // the data to be displayed
  const [data, setData] = useState([...initData]);
  const [variables, setVariables] = useState([...initVariables]);
  const [settings, setSettings] = useState(initSettings || {});

  useEffect(() => {
    async function getData() {
      setData([...initData]);
    }
    getData();
  }, [initData]);

  useEffect(() => {
    async function getColumns() {
      setVariables([...initVariables]);
    }
    if (initVariables?.length) {
      getColumns();
    }
  }, [initVariables]);

  useEffect(() => {
    async function getSettings() {
      setSettings({ ...initSettings });
    }
    if (initSettings) {
      getSettings();
    }
  }, [initSettings]);

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
      updateWorkspace({ layout: newLayout });
    },
    [updateWorkspace]
  );

  const handleComponentSelect = useCallback(
    (componentId) => {
      setActiveComponentId((prev) =>
        prev === componentId ? null : componentId
      );
    },
    [activeComponentId]
  );

  const handleAddComponent = useCallback(
    async ({ title, type, content }) => {
      const res = await createComponent({
        variables: {
          input: {
            title: title,
            type: type,
            content: content,
            vizChapter: {
              connect: {
                id: workspace?.id,
              },
            },
          },
        },
      });
      const newComponentId = res?.data?.createVizSection?.id;

      const newComponent = { id: newComponentId, title, type, content };
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
      // close the add component panel
      setIsAddComponentPanelOpen(false);
      // open the panel
      handleComponentSelect(newComponentId);
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

  // const handleUpdateComponent = useCallback(
  //   ({ componentId, field, value }) => {
  //     const updatedComponents = components.map((comp) =>
  //       comp.id === componentId
  //         ? {
  //             ...comp,
  //             content: { ...comp?.content, [field]: value },
  //           }
  //         : comp
  //     );
  //     updateWorkspace({ vizSections: updatedComponents });
  //   },
  //   [components, updateWorkspace]
  // );

  const handleUpdateComponent = useCallback(
    ({ componentId, newContent }) => {
      const updatedComponents = components.map((comp) =>
        comp.id === componentId
          ? {
              ...comp,
              content: { ...comp?.content, ...newContent },
            }
          : comp
      );
      updateWorkspace({ vizSections: updatedComponents });
    },
    [components, updateWorkspace]
  );

  const handleSaveComponent = useCallback(
    async (componentId) => {
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

  const toggleComponentPanel = () => {
    setIsAddComponentPanelOpen(!isAddComponentPanelOpen);
  };

  return (
    <StyledDataWorkspace>
      <TopNavigation
        area={area}
        journal={journal}
        workspace={workspace}
        activeComponent={components.find(
          (comp) => comp.id === activeComponentId
        )}
        handleAddComponent={handleAddComponent}
        toggleComponentPanel={toggleComponentPanel}
        setArea={setArea}
      />

      {area === "journals" && (
        <div className="dashboard">
          <div>
            {!sidebarVisible && (
              <div
                className="openPanelBtn"
                onClick={() => setSidebarVisible(true)}
              >
                <img src="/assets/dataviz/openPanel.png" />
              </div>
            )}
          </div>

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
                projectId={projectId}
                studyId={studyId}
                dataJournals={dataJournals}
                selectedJournal={journal}
                selectedJournalId={journalId}
                selectJournalById={selectJournalById}
                workspaces={workspaces}
                selectedWorkspace={workspace}
                selectWorkspaceById={selectWorkspaceById}
                collapsePanel={() => setSidebarVisible(false)}
              />
            </Sidebar>

            <SidebarPusher>
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
                  draggableHandle=".widget-header"
                  draggableCancel=".widget-button" // Exclude buttons from dragging
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
                          onChange={handleUpdateComponent}
                          handleRemoveComponent={handleRemoveComponent}
                          pyodide={pyodide}
                          data={data}
                          variables={variables}
                          settings={settings}
                        />
                      </div>
                    );
                  })}
                </GridLayout>
              </div>
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
                pyodide={pyodide}
                data={data}
                variables={variables}
              />
            </StyledRightPanel>
          )}
          {isAddComponentPanelOpen && (
            <ComponentPanel handleAddComponent={handleAddComponent} />
          )}
        </div>
      )}

      {area === "datasets" && (
        <Datasets user={user} projectId={projectId} studyId={studyId} />
      )}
    </StyledDataWorkspace>
  );
}
