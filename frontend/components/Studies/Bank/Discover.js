import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { Dropdown } from "semantic-ui-react";

import { PUBLIC_STUDIES } from "../../Queries/Study";
import { GET_USER_STUDIES } from "../../Queries/User";

import StudyCard from "./StudyCard";

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

export default function DiscoverStudyBank({ query, user }) {
  const router = useRouter();
  const tab = query?.tab || "all";

  const { data, error, loading } = useQuery(PUBLIC_STUDIES);
  const studies = data?.studies || [];

  const { data: userData } = useQuery(GET_USER_STUDIES);
  const studiesParticipated = userData?.authenticatedItem?.participantIn || [];

  const setTab = (tab) => {
    router.push({
      pathname: "/dashboard/discover/study",
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
    <>
      <Dropdown
        selection
        fluid
        value={tab}
        options={filterOptions}
        onChange={(event, data) => setTab(data?.value)}
      />

      <div className="cardBoard">
        {filteredStudies.map((study) => (
          <StudyCard
            key={study?.id}
            study={study}
            url="/dashboard/discover/studies/"
            id="slug"
            name="name"
          />
        ))}
      </div>
    </>
  );
}
