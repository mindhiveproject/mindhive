import { useState } from "react";
import { useQuery } from "@apollo/client";

import { Dropdown } from "semantic-ui-react";

// import { MY_STUDIES } from "../../Queries/Study";
// import { GET_USER_STUDIES } from "../../Queries/User";
import { GET_MY_PROJECT_BOARDS } from "../../Queries/Proposal";

import ProjectCard from "./ProjectCard";

export default function DevelopProjectBank({ user }) {
  // const { data, error, loading } = useQuery(MY_STUDIES, {
  //   variables: { id: user?.id },
  // });
  // const studies = data?.studies || [];

  const { data } = useQuery(GET_MY_PROJECT_BOARDS, {
    variables: { userId: user?.id },
  });
  const projects = data?.proposalBoards || [];

  // const [filter, setFilter] = useState("All");

  // const filterOptions = [
  //   {
  //     key: "All",
  //     text: "All studies",
  //     value: "All",
  //     content: <p>All</p>,
  //   },
  //   {
  //     key: "Active",
  //     text: "Active studies",
  //     value: "Active",
  //     content: <p>Active</p>,
  //   },
  //   {
  //     key: "Archived",
  //     text: "Archived studies",
  //     value: "Archived",
  //     content: <p>Archived</p>,
  //   },
  // ];

  // let filteredStudies = studies;
  // let studiesIDsToHide = [];
  // if (studiesInfo) {
  //   studiesIDsToHide = studies
  //     .filter((st) => studiesInfo[st?.id]?.hideInDevelop)
  //     .map((study) => study.id);
  // }

  // switch (filter) {
  //   case "Active":
  //     filteredStudies = studies.filter(
  //       (study) => !studiesIDsToHide.includes(study?.id)
  //     );
  //     break;
  //   case "Archived":
  //     filteredStudies = studies.filter((study) =>
  //       studiesIDsToHide.includes(study?.id)
  //     );
  //     break;
  // }

  return (
    <>
      {/* <div className="dropdown">
        <Dropdown
          selection
          fluid
          value={filter}
          options={filterOptions}
          onChange={(event, data) => setFilter(data?.value)}
        />
      </div> */}
      <div className="cardBoard">
        {projects.map((project) => (
          <ProjectCard
            key={project?.id}
            user={user}
            project={project}
            url="/builder/projects/"
            id="id"
            name="selector"
            projectsInfo={null}
          />
        ))}
      </div>
    </>
  );
}
