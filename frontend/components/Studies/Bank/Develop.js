import { useState } from "react";
import { useQuery } from "@apollo/client";

import { Dropdown } from "semantic-ui-react";

import { MY_STUDIES } from "../../Queries/Study";
import { GET_USER_STUDIES } from "../../Queries/User";

import StudyCard from "./StudyCard";

export default function DevelopStudyBank({ user }) {
  const { data, error, loading } = useQuery(MY_STUDIES, {
    variables: { id: user?.id },
  });
  const studies = data?.studies || [];

  const { data: studyInfoData } = useQuery(GET_USER_STUDIES);
  const studiesInfo = studyInfoData?.authenticatedItem?.studiesInfo || {};

  const [filter, setFilter] = useState("All");

  const filterOptions = [
    {
      key: "All",
      text: "All studies",
      value: "All",
      content: <p>All</p>,
    },
    {
      key: "Active",
      text: "Active studies",
      value: "Active",
      content: <p>Active</p>,
    },
    {
      key: "Archived",
      text: "Archived studies",
      value: "Archived",
      content: <p>Archived</p>,
    },
  ];

  let filteredStudies = studies;
  let studiesIDsToHide = [];
  if (studiesInfo) {
    studiesIDsToHide = studies
      .filter((st) => studiesInfo[st?.id]?.hideInDevelop)
      .map((study) => study.id);
  }

  switch (filter) {
    case "Active":
      filteredStudies = studies.filter(
        (study) => !studiesIDsToHide.includes(study?.id)
      );
      break;
    case "Archived":
      filteredStudies = studies.filter((study) =>
        studiesIDsToHide.includes(study?.id)
      );
      break;
  }

  return (
    <>
      <div className="dropdown">
        <Dropdown
          selection
          fluid
          value={filter}
          options={filterOptions}
          onChange={(event, data) => setFilter(data?.value)}
        />
      </div>
      <div className="cardBoard">
        {filteredStudies.map((study) => (
          <StudyCard
            key={study?.id}
            user={user}
            study={study}
            url="/builder/studies/"
            id="id"
            name="selector"
            studiesInfo={studiesInfo}
          />
        ))}
      </div>
    </>
  );
}
