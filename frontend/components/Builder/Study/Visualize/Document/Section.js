import useForm from "../../../../../lib/useForm";

import Paragraph from "./Sections/Paragraph";
import Table from "./Sections/Table";

import SaveSection from "./SaveSection";
import Statistics from "./Sections/Statistics";
import Graph from "./Sections/Graph/Main";
import SectionHeader from "./SectionHeader";

export default function Section({ studyId, chapter, section, results }) {
  const { inputs, handleChange } = useForm({
    ...(section || {}),
  });

  const { type } = section;

  const handleContentChange = ({ name, content }) => {
    handleChange({
      target: {
        name: "content",
        value: { ...inputs.content, [name]: content },
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
          results={results}
        />
      )}

      {type === "STATISTICS" && (
        <Statistics
          content={inputs?.content}
          handleContentChange={handleContentChange}
          results={results}
        />
      )}

      {type === "GRAPH" && (
        <Graph
          content={inputs?.content}
          handleContentChange={handleContentChange}
          results={results}
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
