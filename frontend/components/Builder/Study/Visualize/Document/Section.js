import useForm from "../../../../../lib/useForm";

import Paragraph from "./Sections/Paragraph";
import Table from "./Sections/Table";
import Statistics from "./Sections/Statistics/Main";
import Graph from "./Sections/Graph/Main";

import SaveSection from "./SaveSection";
import SectionHeader from "./SectionHeader";

export default function Section({
  studyId,
  chapter,
  section,
  pyodide,
  data,
  variables,
}) {
  const { inputs, handleChange } = useForm({
    ...(section || {}),
  });

  console.log({ inputs });

  const { type } = section;

  // const handleContentChange = ({ name, content }) => {
  //   handleChange({
  //     target: {
  //       name: "content",
  //       value: { ...inputs.content, [name]: content },
  //     },
  //   });
  // };

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

      <div>
        <SaveSection
          studyId={studyId}
          sectionId={section?.id}
          inputs={inputs}
        />
      </div>
    </div>
  );
}
