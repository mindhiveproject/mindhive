import { Dropdown } from "semantic-ui-react";
import { useState } from "react";
import StudentWork from "./StudentWork";
import CollectivePresentation from "../Collective";
import useTranslation from "next-translate/useTranslation";

export default function IndividualPresentationMain({ project }) {
  const { t } = useTranslation("builder");
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
      text: t("reviewDetail.showCollectiveWork"),
      value: "collective",
    },
    ...studentFilterOptions,
  ];

  return (
    <>
      <h2>{t("reviewDetail.selectStudent")}</h2>
      <Dropdown
        placeholder={t("reviewDetail.selectStudentPlaceholder")}
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
