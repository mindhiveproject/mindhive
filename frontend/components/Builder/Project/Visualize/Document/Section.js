import useForm from "../../../../../lib/useForm";

import Paragraph from "./Sections/Paragraph";
import Table from "./Sections/Table";
import Statistics from "./Sections/Statistics/Main";
import StatisticTest from "./Sections/StatsticalTests/Main";
import Graph from "./Sections/Graph/Main";
import HypVis from "./Sections/HypothesisVisualizer/Main";

import SaveSection from "./SaveSection";
import SectionHeader from "./SectionHeader";

export default function Section({
  user, 
  projectId,
  studyId,
  chapter,
  section,
  pyodide,
  data,
  variables,
  settings,
}) {
  const { inputs, handleChange } = useForm({
    ...(section || {}),
  });

  const { type } = section;

  const handleContentChange = ({ newContent }) => {
    handleChange({
      target: {
        name: "content",
        value: { ...inputs.content, ...newContent },
      },
    });
  };

  return (
    <div className="section">
      <SectionHeader
        projectId={projectId}
        studyId={studyId}
        section={section}
        description={inputs?.description}
        handleChange={handleChange}
      />

      {type === "PARAGRAPH" && (
        <Paragraph
          content={inputs?.content}
          handleContentChange={handleContentChange}
        />
      )}

      {type === "TABLE" && (
        <Table
          content={inputs?.content}
          handleContentChange={handleContentChange}
          data={data}
          variables={variables}
          settings={settings}
        />
      )}

      {type === "STATISTICS" && (
        <Statistics
          content={inputs?.content}
          handleContentChange={handleContentChange}
          pyodide={pyodide}
          sectionId={section?.id}
          data={data}
          variables={variables}
        />
      )}

      {type === "GRAPH" && (
        <Graph
          content={inputs?.content}
          handleContentChange={handleContentChange}
          pyodide={pyodide}
          sectionId={section?.id}
          data={data}
          variables={variables}
        />
      )}

      {type === "HYPVIS" && (
        <HypVis
          content={inputs?.content}
          handleContentChange={handleContentChange}
          pyodide={pyodide}
          sectionId={section?.id}
          data={data}
          variables={variables}
          user={user}
          studyId={studyId}
        />
      )}

      {type === "STATTEST" && (
        <StatisticTest
          content={inputs?.content}
          handleContentChange={handleContentChange}
          pyodide={pyodide}
          sectionId={section?.id}
          data={data}
          variables={variables}
        />
      )}

      <div>
        <SaveSection
          projectId={projectId}
          studyId={studyId}
          sectionId={section?.id}
          inputs={inputs}
        />
      </div>
    </div>
  );
}
