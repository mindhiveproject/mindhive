import { useQuery } from "@apollo/client";
import { PUBLIC_STUDIES } from "../../Queries/Study";
import StudyCard from "./StudyCard";

import { StyledSelector } from "../../styles/StyledSelector";
import { StyledBank } from "../../styles/StyledBank";

export default function CloneStudyBank({ user }) {
  const { data, error, loading } = useQuery(PUBLIC_STUDIES);
  const studies = data?.studies || [];

  return (
    <StyledSelector>
      <div className="selectionBody">
        <div className="selectHeader">
          <h1>Clone & modify a study</h1>
          <p>Select which study you would like to clone below.</p>
        </div>
        <StyledBank>
          {studies.map((study) => (
            <StudyCard
              user={user}
              key={study?.id}
              study={study}
              url="/builder/cloneofstudy/"
              id="id"
              name="selector"
            />
          ))}
        </StyledBank>
      </div>
    </StyledSelector>
  );
}
