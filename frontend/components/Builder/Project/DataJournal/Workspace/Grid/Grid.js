// components/DataJournal/Workspace/Grid/Grid.js
import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useMutation } from "@apollo/client";
import { debounce } from "lodash";
import GridLayout from "react-grid-layout";

import {
  CREATE_DATA_COMPONENT,
  DELETE_DATA_COMPONENT,
  UPDATE_DATA_COMPONENT,
} from "../../../../../Mutations/DataComponent";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

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
} from "../../styles/StyledDataJournal";

import SideNavigation from "../../SideNav/Main";
import TopNavigation from "../../TopNav/Main";
import Datasets from "../../Datasets/Main";
import ComponentEditor from "../../Editors/ComponentEditor";
import ComponentPanel from "./ComponentPanel/Main";
import Widget from "../../Widgets/Widget";

import { useDataJournal } from "../../Context/DataJournalContext";

export default function Grid({
  journalCollections,
  dataJournals,
  journal,
  journalId,
  selectJournalById,
  workspaces,
  workspaceId,
  selectWorkspaceById,
}) {
  const gridRef = useRef(null);
  const [gridWidth, setGridWidth] = useState(1200); // fallback

  const {
    workspace,
    updateWorkspace,
    pyodide,
    data,
    variables,
    settings,
    activeComponent,
    setActiveComponent,
    area,
    setArea,
    sidebarVisible,
    setSidebarVisible,
    isAddComponentPanelOpen,
    setIsAddComponentPanelOpen,
  } = useDataJournal();

  const layout = useMemo(() => workspace?.layout || [], [workspace]);
  const components = useMemo(() => workspace?.vizSections || [], [workspace]);

  // Measure the actual width of the canvas/container
  useEffect(() => {
    const updateWidth = () => {
      if (gridRef.current) {
        setGridWidth(gridRef.current.offsetWidth);
      }
    };

    updateWidth(); // initial

    const resizeObserver = new ResizeObserver(updateWidth);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    if (activeComponent) {
      const freshComponent = components.find(
        (comp) => comp.id === activeComponent.id
      );
      if (
        freshComponent &&
        JSON.stringify(freshComponent) !== JSON.stringify(activeComponent)
      ) {
        setActiveComponent(freshComponent);
      }
    }
  }, [components, activeComponent, setActiveComponent]);

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

  const handleSaveComponent = useCallback(
    async (componentId) => {
      const component = components.find((comp) => comp.id === componentId);
      if (component) {
        await updateComponent({
          variables: {
            id: componentId,
            input: {
              title: component.title,
              type: component.type,
              content: component.content,
            },
          },
        });
      }
    },
    [components, updateComponent]
  );

  const debouncedSave = useCallback(
    debounce((componentId) => {
      handleSaveComponent(componentId);
    }, 3000),
    [handleSaveComponent]
  );

  const handleLayoutChange = useCallback(
    (newLayout) => {
      updateWorkspace({ layout: newLayout });
    },
    [updateWorkspace]
  );

  const handleComponentSelect = useCallback(
    (component) => {
      if (activeComponent?.id === component?.id) {
        handleSaveComponent(component?.id);
        setActiveComponent(null); // Close the component editor
      } else {
        setActiveComponent(component); // Open the component editor
      }
    },
    [activeComponent, setActiveComponent, handleSaveComponent]
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
      const newComponent = res?.data?.createVizSection; // Assuming correct response field
      if (newComponent) {
        // Update local workspace
        updateWorkspace({
          vizSections: [...components, newComponent],
        });
        setIsAddComponentPanelOpen(false);
      }
    },
    [
      createComponent,
      workspace?.id,
      components,
      updateWorkspace,
      setIsAddComponentPanelOpen,
    ]
  );

  const handleUpdateComponent = useCallback(
    ({ componentId, newContent }) => {
      const updatedComponents = components.map((comp) =>
        comp.id === componentId
          ? { ...comp, content: { ...comp?.content, ...newContent } }
          : comp
      );
      updateWorkspace({ vizSections: updatedComponents });
      debouncedSave(componentId);
    },
    [components, updateWorkspace, debouncedSave]
  );

  const handleRemoveComponent = useCallback(
    async (componentId) => {
      await deleteComponent({
        variables: { id: componentId },
      });
      // Update local workspace
      const updatedComponents = components.filter(
        (comp) => comp.id !== componentId
      );
      updateWorkspace({ vizSections: updatedComponents });
      if (activeComponent?.id === componentId) {
        setActiveComponent(null);
      }
    },
    [
      deleteComponent,
      components,
      updateWorkspace,
      activeComponent,
      setActiveComponent,
    ]
  );

  return (
    <StyledDataWorkspace>
      <TopNavigation />

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
                journalCollections={journalCollections}
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
              <div className="canvas" ref={gridRef}>
                <GridLayout
                  className="layout"
                  layout={layout}
                  cols={12}
                  rowHeight={30}
                  width={gridWidth}
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
                          widget={widget}
                          id={widget.id}
                          type={widget.type}
                          content={widget.content}
                          isActive={widget.id === activeComponent?.id}
                          onSelect={handleComponentSelect}
                          onChange={handleUpdateComponent}
                          // handleRemoveComponent={handleRemoveComponent} // If needed, uncomment
                        />
                      </div>
                    );
                  })}
                </GridLayout>
              </div>
            </SidebarPusher>
          </SidebarPushable>
          {activeComponent && (
            <StyledRightPanel>
              <ComponentEditor
                onChange={handleUpdateComponent}
                onSave={() => handleSaveComponent(activeComponent?.id)}
                onDelete={() => handleRemoveComponent(activeComponent?.id)}
              />
            </StyledRightPanel>
          )}
          {isAddComponentPanelOpen && (
            <ComponentPanel handleAddComponent={handleAddComponent} />
          )}
        </div>
      )}

      {area === "datasets" && <Datasets />}
    </StyledDataWorkspace>
  );
}
