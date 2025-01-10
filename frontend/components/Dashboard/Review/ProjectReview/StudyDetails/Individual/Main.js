import { Dropdown } from "semantic-ui-react";
import { useState } from "react";
import StudentWork from "./StudentWork";
import CollectivePresentation from "../Collective";

export default function IndividualPresentationMain({ project }) {
  const [studentId, setStudentId] = useState("collective");

  const { author, collaborators } = project;

  const studentFilterOptions = collaborators.map((collaborator) => ({
    key: collaborator?.id,
    text: collaborator?.username,
    value: collaborator?.id,
  }));

  const filterOptions = [
    {
      key: "collective",
      text: "Show collective work",
      value: "collective",
    },
    ...studentFilterOptions,
  ];

  return (
    <>
      <h2>Select the student</h2>
      <Dropdown
        placeholder="Select student"
        fluid
        selection
        options={filterOptions}
        onChange={(event, data) => setStudentId(data?.value)}
        value={studentId}
      />
      <StudentWork studentId={studentId} project={project} />

      {studentId === "collective" && (
        <CollectivePresentation project={project} />
      )}
    </>
  );
}
