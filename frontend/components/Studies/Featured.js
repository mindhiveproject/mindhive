import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { FEATURED_STUDIES } from "../Queries/Study";

import FeaturedCard from "./FeaturedCard";
import { StyledFeaturedStudies } from "../styles/StyledFeatured";

function DisplayFeatured({ user, studies, isDashboard }) {
  const [study, setStudy] = useState(studies[0]);
  return (
    <StyledFeaturedStudies>
      <div className="featuredHeader">
        <h1>Discover studies, tasks and surveys</h1>
        <p>
          Browse our collection of studies, tasks and surveys created by high
          school students in the MindHive program and partner scientists.
          Participate in studies or preview tasks and surveys.
        </p>
      </div>

      <div className="featuredContainerWrapper">
        <div className="featuredContainer">
          <FeaturedCard user={user} study={study} isDashboard={isDashboard} />
        </div>
        <div className="buttonsWrapper">
          <div className="buttons">
            {studies.map((st) => (
              <input
                key={st.id}
                type="radio"
                name="featuredStudy"
                value={st.id}
                checked={study?.id === st?.id}
                onChange={() => {
                  setStudy(st);
                }}
                autoFocus={study?.id === st?.id}
              />
            ))}
          </div>
        </div>
      </div>
    </StyledFeaturedStudies>
  );
}

export default function FeaturedStudies({ user, isDashboard }) {
  const { data, error, loading } = useQuery(FEATURED_STUDIES);
  const studies = data?.studies || [];

  if (studies?.length) {
    return (
      <DisplayFeatured
        user={user}
        studies={studies}
        isDashboard={isDashboard}
      />
    );
  }
}
