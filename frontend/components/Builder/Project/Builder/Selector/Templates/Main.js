import { STUDY_TEMPLATES } from "../../../../../Queries/Study";
import { useQuery } from "@apollo/client";

import StudyCard from "./StudyCard";

export default function StudyTemplates({
  user,
  addFunctions,
  createdBy,
  search,
}) {
  const { data, error, loading } = useQuery(STUDY_TEMPLATES, {
    variables: { id: user?.id },
  });

  const studies = data?.studies || [];
  const filteredStudies = studies
    .filter((study) => !!study.diagram)
    .filter(
      (study) =>
        (study?.slug?.includes(search) || study?.title?.includes(search)) &&
        ((createdBy === "anyone" && study?.public) ||
          (createdBy === "me" &&
            (study?.author?.id === user?.id ||
              study?.collaborators
                ?.map((collaborator) => collaborator?.id)
                .includes(user?.id))))
    );

  return (
    <div className="blocksMenuContent">
      {filteredStudies.map((study, num) => (
        <StudyCard key={num} study={study} addFunctions={addFunctions} />
      ))}
    </div>
  );
}
