// components/DataJournal/Workspace/Grid/Grid.js
import { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { useMutation } from "@apollo/client";
import { debounce } from "lodash";
import GridLayout from "react-grid-layout";
import useTranslation from "next-translate/useTranslation";

import {
  CREATE_DATA_COMPONENT,
  DELETE_DATA_COMPONENT,
  UPDATE_DATA_COMPONENT,
} from "../../../../../Mutations/DataComponent";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { StyledDataWorkspace } from "../../styles/StyledDataJournal";
import Button from "../../../../../DesignSystem/Button";

import SideNavigation from "../../SideNav/Main";
import TopNavigation from "../../TopNav/Main";
import Datasets from "../../Datasets/Main";
import ComponentEditor from "../../Editors/ComponentEditor";
import ComponentPanel from "./ComponentPanel/Main";
import CreateJournal from "../../Helpers/CreateJournal";
import Widget from "../../Widgets/Widget";

import { useDataJournal } from "../../Context/DataJournalContext";

export default function Grid({
  user,
  studyId,
  journalCollections,
  dataJournals,
  journal,
  journalId,
  selectJournalById,
  workspaces,
  selectWorkspaceById,
}) {
  const gridRef = useRef(null);
  const [gridWidth, setGridWidth] = useState(1200); // fallback
  const [pendingFocusComponentId, setPendingFocusComponentId] = useState(null);
  const { t } = useTranslation("builder");

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
    leftPanelMode,
    setLeftPanelMode,
    projectId,
    studyId: contextStudyId,
  } = useDataJournal();
  const resolvedStudyId = studyId || contextStudyId;

  const layout = useMemo(() => workspace?.layout || [], [workspace]);
  const components = useMemo(() => workspace?.vizSections || [], [workspace]);
  const dashboardClassName = `dashboard ${
    sidebarVisible ? "hasLeftSidebar" : "noLeftSidebar"
  }`;

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
  }, [sidebarVisible]);

  useEffect(() => {
    if (activeComponent) {
      const freshComponent = components.find(
        (comp) => comp.id === activeComponent.id,
      );
      if (
        freshComponent &&
        JSON.stringify(freshComponent) !== JSON.stringify(activeComponent)
      ) {
        setActiveComponent(freshComponent);
      }
    }
  }, [components, activeComponent, setActiveComponent]);

  useEffect(() => {
    const componentId = typeof pendingFocusComponentId === "string"
      ? pendingFocusComponentId.trim()
      : "";
    if (!componentId) return;
    const raf = window.requestAnimationFrame(() => {
      const target = document.querySelector(
        `[data-widget-id="${componentId}"]`,
      );
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
      setPendingFocusComponentId(null);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pendingFocusComponentId]);

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
    async ({ componentId, updatedComponents }) => {
      const component = updatedComponents.find(
        (comp) => comp.id === componentId,
      );
      // console.log({ component });
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
    [components, updateComponent],
  );

  const debouncedSave = useCallback(
    debounce(({ componentId, updatedComponents }) => {
      handleSaveComponent({ componentId, updatedComponents });
    }, 1000),
    [handleSaveComponent],
  );

  const handleLayoutChange = useCallback(
    (newLayout) => {
      updateWorkspace({ layout: newLayout });
    },
    [updateWorkspace],
  );

  const handleComponentSelect = useCallback(
    (component) => {
      if (activeComponent?.id === component?.id) {
        handleSaveComponent({
          componentId: component?.id,
          updatedComponents: components,
        });
        setActiveComponent(null);
        setIsAddComponentPanelOpen(false);
        setLeftPanelMode("journal");
      } else {
        setIsAddComponentPanelOpen(false);
        setActiveComponent(component);
        setLeftPanelMode("editor");
        setSidebarVisible(true);
        setPendingFocusComponentId(component?.id || null);
      }
    },
    [
      activeComponent,
      setActiveComponent,
      handleSaveComponent,
      setIsAddComponentPanelOpen,
      setLeftPanelMode,
      setSidebarVisible,
      setPendingFocusComponentId,
    ],
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
        setActiveComponent(newComponent);
        setLeftPanelMode("editor");
        setSidebarVisible(true);
      }
    },
    [
      createComponent,
      workspace?.id,
      components,
      updateWorkspace,
      setIsAddComponentPanelOpen,
      setActiveComponent,
      setLeftPanelMode,
      setSidebarVisible,
    ],
  );

  const handleUpdateComponent = useCallback(
    ({ componentId, newContent, newTitle }) => {
      const updatedComponents = components.map((comp) =>
        comp.id === componentId
          ? {
              ...comp,
              ...(newContent != null
                ? { content: { ...comp?.content, ...newContent } }
                : {}),
              ...(newTitle !== undefined ? { title: newTitle } : {}),
            }
          : comp,
      );
      updateWorkspace({ vizSections: updatedComponents });
      // Keep activeComponent aligned with workspace on the same tick so TipTap (and
      // other controlled props) never see stale content and re-hydrate over the user.
      if (activeComponent?.id === componentId) {
        setActiveComponent((prev) => {
          if (!prev || prev.id !== componentId) return prev;
          return {
            ...prev,
            ...(newContent != null
              ? { content: { ...prev.content, ...newContent } }
              : {}),
            ...(newTitle !== undefined ? { title: newTitle } : {}),
          };
        });
      }
      debouncedSave({ componentId, updatedComponents });
    },
    [
      components,
      updateWorkspace,
      debouncedSave,
      activeComponent?.id,
      setActiveComponent,
    ],
  );

  const handleRemoveComponent = useCallback(
    async (componentId) => {
      await deleteComponent({
        variables: { id: componentId },
      });
      // Update local workspace
      const updatedComponents = components.filter(
        (comp) => comp.id !== componentId,
      );
      updateWorkspace({ vizSections: updatedComponents });
      if (activeComponent?.id === componentId) {
        setActiveComponent(null);
        setLeftPanelMode("journal");
      }
    },
    [
      deleteComponent,
      components,
      updateWorkspace,
      activeComponent,
      setActiveComponent,
      setLeftPanelMode,
    ],
  );

  const handleOpenLeftPanel = useCallback(() => {
    if (activeComponent) {
      setActiveComponent(null);
    }
    if (isAddComponentPanelOpen) {
      setIsAddComponentPanelOpen(false);
    }
    setLeftPanelMode("journal");
    setSidebarVisible(true);
  }, [
    activeComponent,
    isAddComponentPanelOpen,
    setActiveComponent,
    setIsAddComponentPanelOpen,
    setLeftPanelMode,
    setSidebarVisible,
  ]);

  const handleResetToJournal = useCallback(() => {
    setIsAddComponentPanelOpen(false);
    setActiveComponent(null);
    setLeftPanelMode("journal");
    setSidebarVisible(true);
  }, [
    setIsAddComponentPanelOpen,
    setActiveComponent,
    setLeftPanelMode,
    setSidebarVisible,
  ]);

  const handleCanvasClick = useCallback((event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".widgetContainer")) return;
    setIsAddComponentPanelOpen(false);
    setActiveComponent(null);
    setLeftPanelMode("journal");
    setSidebarVisible(false);
  }, [
    setIsAddComponentPanelOpen,
    setActiveComponent,
    setLeftPanelMode,
    setSidebarVisible,
  ]);

  const renderSidebarHeader = () => {
    const isJournalMode = leftPanelMode === "journal";
    return (
      <div className="navigationPanelHeader sidebarModeHeader">
        <div className="collapsePanelBtn">
          <Button
            type="button"
            variant="text"
            style={{ color: "#5D5763", fontWeight: 400 }}
            onClick={() => setSidebarVisible(false)}
            leadingIcon={<img src="/assets/dataviz/openPanel.svg" alt="" aria-hidden className="collapsePanelBtnIcon" />}
          >
            {t("dataJournal.sideNav.collapsePanel", {}, { default: "Close" })}
          </Button>
        </div>
        <div>
          {isJournalMode ? (
            <CreateJournal
              projectId={projectId}
              studyId={resolvedStudyId}
              createNewJournalCollection={journalCollections.length === 0}
              journalCollections={journalCollections}
            />
          ) : (
            <Button 
              type="button" 
              variant="tonal" 
              onClick={handleResetToJournal}
              style={{ backgroundColor: "#F3F3F3", color: "#171717" }}
            >
              {t("dataJournal.sideNav.backToJournal", {}, { default: "Back to Journal" })}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderLeftSidebarContent = () => {
    if (leftPanelMode === "editor" && activeComponent) {
      return (
        <ComponentEditor
          user={user}
          studyId={resolvedStudyId}
          onChange={handleUpdateComponent}
          onSave={async () => {
            await handleSaveComponent({
              componentId: activeComponent?.id,
              updatedComponents: components,
            });
            setActiveComponent(null);
            setLeftPanelMode("journal");
          }}
          onDelete={() => handleRemoveComponent(activeComponent?.id)}
          onClose={() => {
            setActiveComponent(null);
            setLeftPanelMode("journal");
          }}
        />
      );
    }

    if (leftPanelMode === "addComponent" || isAddComponentPanelOpen) {
      return (
        <ComponentPanel
          handleAddComponent={handleAddComponent}
          onClose={() => {
            setIsAddComponentPanelOpen(false);
            setLeftPanelMode("journal");
          }}
        />
      );
    }

    return (
      <SideNavigation
        journalCollections={journalCollections}
        dataJournals={dataJournals}
        selectedJournal={journal}
        selectedJournalId={journalId}
        selectJournalById={selectJournalById}
        workspaces={workspaces}
        selectedWorkspace={workspace}
        selectWorkspaceById={selectWorkspaceById}
      />
    );
  };

  return (
    <StyledDataWorkspace>
      <TopNavigation />

      {area === "journals" && (
        <div className={dashboardClassName}>
          <div className="dashboardMain">
            {!sidebarVisible && (
              <div className="openPanelBtnSlot">
                <div className="openPanelBtn" onClick={handleOpenLeftPanel}>
                  <img
                    src="/assets/dataviz/openPanel.svg"
                    style={{ rotate: "180deg" }}
                  />
                </div>
              </div>
            )}

            <div className="journalShell">
              <aside
                className="journalLeftRail"
                aria-hidden={!sidebarVisible}
                inert={!sidebarVisible ? true : undefined}
              >
                <div className="sidebarModeShell">
                  {renderSidebarHeader()}
                  <div className="sidebarModeBody">{renderLeftSidebarContent()}</div>
                </div>
              </aside>
              <div className="journalCanvasColumn">
                <div className="canvas" ref={gridRef} onClick={handleCanvasClick}>
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
                    draggableHandle=".widget-content-handle"
                    draggableCancel=".widget-button,button,input,textarea,select,option,[contenteditable='true'],.react-resizable-handle"
                  >
                    {components.map((widget) => {
                      const layoutItem = layout.find(
                        (l) => l.i === widget.id,
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
                          data-widget-id={widget.id}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {area === "datasets" && <Datasets />}
    </StyledDataWorkspace>
  );
}
