import { useState, useEffect } from "react";
import sortBy from "lodash/sortBy";

import ChapterHeader from "./ChapterHeader";
import CreateSection from "./CreateSection";
import Section from "./Section";

import Grid from "./Grid/Main";

const prepareDataCode = ``;

import filterData, { renameData } from "../Helpers/Filter";

export default function Document({
  user,
  projectId,
  studyId,
  part,
  chapter,
  pyodide,
  data,
  variables,
  settings,
  handleLayoutChange,
  handleWidgetSelect,
}) {
  // register data relevant for this part
  useEffect(() => {
    async function registerData() {
      if (pyodide && data) {
        // delete the previous data if they are registered
        const sys = pyodide.pyimport("sys");
        if (sys.modules.get("js_workspace")) {
          sys.modules.delete("js_workspace");
        }
        const filteredData = filterData({ data, settings });
        const renamedData = renameData({ data: filteredData, variables });
        pyodide?.registerJsModule("js_workspace", [...renamedData]);
        // make data available as data and df (pandas dataframe)
        await pyodide.runPythonAsync(prepareDataCode);
      }
    }
    registerData();
  }, [pyodide, data, settings]);

  if (!chapter) {
    if (part?.vizChapters && part?.vizChapters.length) {
      return (
        <div className="emptyDocument">
          Select a workspace in the menu on the left
        </div>
      );
    } else {
      return <div className="emptyDocument">Create a new Journal to begin</div>;
    }
  }

  return (
    <div className="document">
      <Grid
        chapter={chapter}
        user={user}
        projectId={projectId}
        studyId={studyId}
        pyodide={pyodide}
        data={data}
        variables={variables}
        settings={settings}
        handleLayoutChange={handleLayoutChange}
        handleWidgetSelect={handleWidgetSelect}
      />
      {/* <ChapterHeader
        user={user}
        projectId={projectId}
        studyId={studyId}
        part={part}
        chapter={chapter}
      /> */}
      {/* <div>
        {sortBy(chapter?.vizSections, [
          (section) =>
            section?.position || new Date(section?.createdAt).getTime(),
        ]).map((section) => (
          <Section
            key={section?.id}
            user={user}
            projectId={projectId}
            studyId={studyId}
            chapter={chapter}
            section={section}
            pyodide={pyodide}
            data={data}
            variables={variables}
            settings={settings}
          />
        ))}
      </div>
      <br /> */}
      {/* <div className="createSectionButton">
        <CreateSection
          projectId={projectId}
          studyId={studyId}
          chapterId={chapter?.id}
        />
      </div> */}
    </div>
  );
}
