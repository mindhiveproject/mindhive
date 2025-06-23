import { useState, useEffect } from "react";

import TopNav from "./Overview/TopNav/Main";
import Overview from "./Overview/Main";
import Document from "./Document/Main";

import { StyledDataViz } from "./styles/StyledDataviz";
import Preprocessor from "./Process/Main";

export default function ProcessManager({
  user,
  projectId,
  studyId,
  pyodide,
  journal,
  part,
  initData,
  initVariables,
  initSettings,
  components,
  page,
  setPage,
  chapter,
  selectChapter,
  handleLayoutChange,
  handleWidgetSelect,
  handleAddWidget,
}) {
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

  // to update the dataset
  const updateDataset = ({
    updatedVariables,
    updatedData,
    updatedSettings,
  }) => {
    if (updatedVariables) {
      setVariables(updatedVariables);
    }
    if (updatedData) {
      setData(updatedData);
    }
    if (updatedSettings) {
      setSettings(updatedSettings);
    }
  };

  // to propogate changes from a variable to a whole dataset
  const onVariableChange = ({ variable, property, value }) => {
    if (property === "isDeleted") {
      const updatedVariables = variables?.filter(
        (column) => column?.field !== variable
      );
      const updatedData = data.map((row) => {
        delete row[variable];
        return row;
      });
      updateDataset({
        updatedVariables,
        updatedData,
      });
    } else {
      const updatedColumns = variables.map((col) => {
        if (col.field === variable) {
          const newCol = { ...col, [property]: value };
          return newCol;
        } else {
          return col;
        }
      });
      setVariables(updatedColumns);
    }
  };

  return (
    <StyledDataViz>
      <TopNav
        projectId={projectId}
        studyId={studyId}
        chapter={chapter}
        handleAddWidget={handleAddWidget}
        part={part}
      />
      <div className="main">
        <div
          className={`vizMenu ${page === "browse" ? "navigation-mode" : ""}`}
        >
          <Overview
            user={user}
            page={page}
            setPage={setPage}
            projectId={projectId}
            studyId={studyId}
            journal={journal}
            part={part}
            chapterId={chapter?.id}
            selectChapter={selectChapter}
            data={data}
            variables={variables}
            settings={settings}
            components={components}
            updateDataset={updateDataset}
            onVariableChange={onVariableChange}
          />
        </div>
        {page === "browse" && (
          <Document
            user={user}
            page={page}
            projectId={projectId}
            studyId={studyId}
            pyodide={pyodide}
            chapter={chapter}
            part={part}
            data={data}
            settings={settings}
            variables={variables}
            handleLayoutChange={handleLayoutChange}
            handleWidgetSelect={handleWidgetSelect}
          />
        )}

        {page === "database" && (
          <Preprocessor
            data={data}
            variables={variables}
            settings={settings}
            updateDataset={updateDataset}
          />
        )}
      </div>
    </StyledDataViz>
  );
}
