// components/DataJournal/Context/DataJournalContext.js
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useMutation } from "@apollo/client";

import { UPDATE_WORKSPACE } from "../../../../Mutations/DataWorkspace";

const DataJournalContext = createContext();

export const DataJournalProvider = ({ children, initialProps = {} }) => {
  // Workspace state (layout, components/vizSections)
  const [workspace, setWorkspace] = useState(
    initialProps.workspace || { id: null, layout: [], vizSections: [] },
  );

  // Merged data from datasources
  const [data, setData] = useState(initialProps.initData || []);

  // Variables (columns) from data
  const [variables, setVariables] = useState(initialProps.initVariables || []);

  // Settings (e.g., filters)
  const [settings, setSettings] = useState(initialProps.initSettings || {});

  // Pyodide instance
  const [pyodide, setPyodide] = useState(initialProps.pyodide || null);

  // Selected journal (for Journals.js)
  const [selectedJournal, setSelectedJournal] = useState(
    initialProps.selectedJournal || null,
  );

  // Selected workspace (for Journal.js)
  const [selectedWorkspace, setSelectedWorkspace] = useState(
    initialProps.selectedWorkspace || null,
  );

  // Active component (for editing in Grid.js)
  const [activeComponent, setActiveComponent] = useState(null);

  // Other UI states (e.g., from Grid.js)
  const [area, setArea] = useState("journals"); // e.g., 'journals' or 'datasets'
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isAddComponentPanelOpen, setIsAddComponentPanelOpen] = useState(false);

  // Additional states for user, projectId, studyId
  const [user, setUser] = useState(initialProps.user || null);
  const [projectId, setProjectId] = useState(initialProps.projectId || null);
  const [studyId, setStudyId] = useState(initialProps.studyId || null);
  const [figureReadinessByComponentId, setFigureReadinessByComponentId] =
    useState({});

  // Apollo mutation for updating workspace on server
  const [updateWorkspaceOnServer] = useMutation(UPDATE_WORKSPACE, {
    onError: (error) => console.error("Error updating workspace:", error),
  });

  // Update workspace locally and on server
  const updateWorkspace = (updates) => {
    const newWorkspace = { ...workspace, ...updates };
    setWorkspace(newWorkspace);

    // Sync with server if ID exists
    if (newWorkspace.id) {
      updateWorkspaceOnServer({
        variables: {
          id: newWorkspace.id,
          input: {
            layout: newWorkspace.layout,
            // Add other fields as needed, e.g., vizSections if mutable
          },
        },
      });
    }
  };

  const setComponentFigureReady = useCallback((componentId, isReady) => {
    if (typeof componentId !== "string" || !componentId.trim()) return;
    const safeComponentId = componentId.trim();
    const nextValue = Boolean(isReady);
    setFigureReadinessByComponentId((prev) => {
      if (prev[safeComponentId] === nextValue) return prev;
      return { ...prev, [safeComponentId]: nextValue };
    });
  }, []);

  const clearComponentFigureReady = useCallback((componentId) => {
    if (typeof componentId !== "string" || !componentId.trim()) return;
    const safeComponentId = componentId.trim();
    setFigureReadinessByComponentId((prev) => {
      if (!(safeComponentId in prev)) return prev;
      const next = { ...prev };
      delete next[safeComponentId];
      return next;
    });
  }, []);

  const resetFigureReadiness = useCallback(() => {
    setFigureReadinessByComponentId({});
  }, []);

  useEffect(() => {
    resetFigureReadiness();
  }, [workspace?.id, resetFigureReadiness]);

  // Provide value to children
  const value = {
    workspace,
    setWorkspace,
    updateWorkspace,
    data,
    setData,
    variables,
    setVariables,
    settings,
    setSettings,
    pyodide,
    setPyodide,
    selectedJournal,
    setSelectedJournal,
    selectedWorkspace,
    setSelectedWorkspace,
    activeComponent,
    setActiveComponent,
    area,
    setArea,
    sidebarVisible,
    setSidebarVisible,
    isAddComponentPanelOpen,
    setIsAddComponentPanelOpen,
    user,
    projectId,
    studyId,
    figureReadinessByComponentId,
    setComponentFigureReady,
    clearComponentFigureReady,
    resetFigureReadiness,
  };

  return (
    <DataJournalContext.Provider value={value}>
      {children}
    </DataJournalContext.Provider>
  );
};

export const useDataJournal = () => {
  const context = useContext(DataJournalContext);
  if (!context) {
    throw new Error("useDataJournal must be used within a DataJournalProvider");
  }
  return context;
};
