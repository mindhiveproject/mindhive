import { useState, useEffect } from "react";

import Menu from "./Menu/Main";
import Overview from "./Overview/Main";
import Document from "./Document/Main";

import { StyledDataViz } from "../../../styles/StyledDataviz";
import Preprocessor from "./Process/Main";

export default function ProcessManager({
  user,
  studyId,
  pyodide,
  journal,
  part,
  initData,
  initVariables,
  components,
  page,
  setPage,
  chapter,
  selectChapter,
}) {
  // the data to be displayed
  const [data, setData] = useState([...initData]);

  // TODO store custom data more efficiently
  // update data if data changed
  useEffect(() => {
    async function getData() {
      const customData = part?.content?.modified?.data || [];
      const extendedData = initData.map((row, index) => ({
        ...row,
        ...customData[index],
      }));
      if (customData && customData?.length) {
        setData([...extendedData]);
      } else {
        setData([...initData]);
      }
    }
    getData();
  }, [initData]);

  // variables to be displayed
  const [variables, setVariables] = useState([]);

  // update variables if variables changed
  useEffect(() => {
    async function getColumns() {
      // const customVariables =
      //   part?.content?.modified?.variables.filter(
      //     (variable) => variable?.type === "user"
      //   ) || [];
      // const mergedVariables = [...initVariablesProcessed, ...customVariables];
      // try custom variables first and (if there is nothing) initial variables
      const customVariables = part?.content?.modified?.variables;
      if (customVariables && customVariables?.length) {
        setVariables([...customVariables]);
      } else {
        setVariables([...initVariables]);
      }
    }
    if (initVariables?.length) {
      getColumns();
    }
  }, [initVariables]);

  // to update the dataset
  const updateDataset = ({ updatedVariables, updatedData }) => {
    if (updatedVariables) {
      setVariables(updatedVariables);
    }
    if (updatedData) {
      setData(updatedData);
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
    <>
      <StyledDataViz>
        <div className="vizMenu">
          <Menu page={page} setPage={setPage} />
          <Overview
            user={user}
            page={page}
            studyId={studyId}
            journal={journal}
            part={part}
            chapterId={chapter?.id}
            selectChapter={selectChapter}
            data={data}
            variables={variables}
            components={components}
            updateDataset={updateDataset}
            onVariableChange={onVariableChange}
          />
        </div>
        {page === "browse" && (
          <Document
            user={user}
            page={page}
            studyId={studyId}
            pyodide={pyodide}
            chapter={chapter}
            part={part}
            data={data}
            variables={variables}
          />
        )}

        {page === "database" && (
          <Preprocessor data={data} variables={variables} />
        )}
      </StyledDataViz>
    </>
  );
}
