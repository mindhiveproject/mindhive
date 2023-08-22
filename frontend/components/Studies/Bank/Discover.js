import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { Dropdown } from "semantic-ui-react";

import { PUBLIC_STUDIES } from "../../Queries/Study";
import { GET_USER_STUDIES } from "../../Queries/User";

import StudyCard from "./StudyCard";
import { StyledDiscover } from "../../styles/StyledDiscover";

const filterOptions = [
  {
    key: "all",
    text: "All studies",
    value: "all",
    content: "All studies",
  },
  {
    key: "participated",
    text: "Studies I participated in",
    value: "participated",
    content: "Studies I participated in",
  },
  {
    key: "notparticipated",
    text: "Studies I haven't participated in",
    value: "notparticipated",
    content: "Studies I haven't participated in",
  },
];

export default function DiscoverStudyBank({ query, user, isDashboard }) {
  console.log({ user });
  const router = useRouter();
  const tab = query?.tab || "all";

  const { data, error, loading } = useQuery(PUBLIC_STUDIES);
  const studies = data?.studies || [];

  const { data: userData } = useQuery(GET_USER_STUDIES);
  const studiesParticipated = userData?.authenticatedItem?.participantIn || [];

  const setTab = (tab) => {
    router.push({
      pathname: `${isDashboard ? "/dashboard" : ""}/discover/study`,
      query: {
        tab,
      },
    });
  };

  let filteredStudies;
  if (tab === "participated") {
    filteredStudies = studies.filter((study) =>
      studiesParticipated?.map((study) => study?.id).includes(study?.id)
    );
  } else if (tab === "notparticipated") {
    filteredStudies = studies.filter(
      (study) =>
        !studiesParticipated?.map((study) => study?.id).includes(study?.id)
    );
  } else {
    filteredStudies = studies;
  }

  return (
    <StyledDiscover>
      {user && (
        <div className="header">
          <div>
            <Dropdown
              selection
              value={tab}
              options={filterOptions}
              onChange={(event, data) => setTab(data?.value)}
            />
          </div>
        </div>
      )}

      <div className="cardBoard">
        {filteredStudies.map((study) => (
          <StudyCard
            user={user}
            key={study?.id}
            study={study}
            url={
              user ? "/dashboard/discover/studies/" : `/studies/${study?.slug}`
            }
            id="slug"
            name="name"
          />
        ))}
      </div>
    </StyledDiscover>
  );
}
