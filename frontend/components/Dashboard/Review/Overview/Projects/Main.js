import { useQuery } from "@apollo/client";
import { useState, useEffect } from "react";

import { Dropdown, Checkbox } from "semantic-ui-react";

import { PROJECTS_QUERY } from "../../../../Queries/Proposal";
import Card from "./Card";

function containsAny(arr1, arr2) {
  return arr1.some((item) => arr2.includes(item));
}

const sortOptions = [
  { label: "Oldest", value: "OLDEST" },
  { label: "Newest", value: "NEWEST" },
  { label: "Least comments", value: "LEAST_COMMENTS" },
  { label: "Most comments", value: "MOST_COMMENTS" },
];

export default function ProjectsBoard({
  selector,
  allUniqueClassIds,
  myClassesIds,
}) {
  const [keyword, setKeyword] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [showMyClassOnly, setShowMyClassOnly] = useState(false);
  const [filterSortMessage, setFilterSortMessage] = useState(
    "Showing all projects"
  );

  let whereStatus;
  switch (selector) {
    case "proposals":
      whereStatus = { submitProposalStatus: { in: ["SUBMITTED"] } };
      break;
    case "inreview":
      whereStatus = { peerFeedbackStatus: { in: ["SUBMITTED"] } };
      break;
    case "report":
      whereStatus = { projectReportStatus: { in: ["SUBMITTED"] } };
      break;
    default:
      whereStatus = { submitProposalStatus: { in: ["SUBMITTED"] } };
  }

  const { data, loading, error } = useQuery(PROJECTS_QUERY, {
    variables: {
      where: {
        AND: [
          whereStatus,
          {
            OR: [
              { study: { featured: { equals: true } } },
              { usedInClass: { id: { in: allUniqueClassIds } } },
            ],
          },
        ],
      },
    },
  });

  const projects = data?.proposalBoards || [];

  // filter and sort proposals
  useEffect(() => {
    async function filterProposals() {
      const projectsFiltered = projects.filter((project) => {
        if (keyword || showMyClassOnly) {
          const isMatchingKeyword = project.title
            .toLowerCase()
            .includes(keyword.toLowerCase());
          const isInMyClasses = containsAny(
            [project?.usedInClass?.id],
            myClassesIds
          );
          return isMatchingKeyword && isInMyClasses;
        } else {
          return true;
        }
      });
      if (sortBy) {
        // sort studies
        const projectsFilteredAndSorted = projectsFiltered.sort((a, b) => {
          if (sortBy === "OLDEST") {
            if (a.createdAt < b.createdAt) return -1;
            if (a.createdAt > b.createdAt) return 1;
          }
          if (sortBy === "NEWEST") {
            if (a.createdAt > b.createdAt) return -1;
            if (a.createdAt < b.createdAt) return 1;
          }

          if (sortBy === "LEAST_COMMENTS") {
            if (
              a?.reviews?.filter((r) => r?.stage === a?.status).length <
              b?.reviews?.filter((r) => r?.stage === b?.status).length
            )
              return -1;
            if (
              a?.reviews?.filter((r) => r?.stage === a?.status).length >
              b?.reviews?.filter((r) => r?.stage === b?.status).length
            )
              return 1;
          }

          if (sortBy === "MOST_COMMENTS") {
            if (
              a?.reviews?.filter((r) => r?.stage === a?.status).length >
              b?.reviews?.filter((r) => r?.stage === b?.status).length
            )
              return -1;
            if (
              a?.reviews?.filter((r) => r?.stage === a?.status).length <
              b?.reviews?.filter((r) => r?.stage === b?.status).length
            )
              return 1;
          }
        });
        setFilteredProjects(projectsFilteredAndSorted);
      } else {
        setFilteredProjects(projectsFiltered);
      }
    }
    filterProposals();
  }, [projects, keyword, showMyClassOnly, sortBy]);

  return (
    <div className="board">
      <div className="searchTopArea">
        <div className="searchArea">
          <input
            placeholder="Search"
            type="text"
            name="keyword"
            value={keyword}
            onChange={({ target }) => setKeyword(target.value)}
          />
        </div>

        <div>
          <Dropdown
            placeholder="Sort by"
            fluid
            selection
            options={sortOptions.map((p) => ({
              key: p.value,
              value: p.value,
              text: p.label,
            }))}
            onChange={(event, data) => {
              if (data?.value === "OLDEST") {
                setFilterSortMessage(`Sorting by: oldest to newest project`);
              }
              if (data?.value === "NEWEST") {
                setFilterSortMessage(`Sorting by: newest to oldest project`);
              }
              if (data?.value === "LEAST_COMMENTS") {
                setFilterSortMessage(`Sorting by: least to most comments`);
              }
              if (data?.value === "MOST_COMMENTS") {
                setFilterSortMessage(`Sorting by: most to least comments`);
              }
              setSortBy(data?.value);
            }}
            value={sortBy}
          />
        </div>
        <div className="checkboxArea">
          <Checkbox
            onChange={() => {
              if (!showMyClassOnly) {
                setFilterSortMessage(`Showing projects in my class`);
              } else {
                setFilterSortMessage(`Showing all projects`);
              }
              setShowMyClassOnly(!showMyClassOnly);
            }}
            checked={showMyClassOnly}
            label="Only show projects in my class"
          />
        </div>
      </div>

      <div className="p16_500">{filterSortMessage}</div>

      <div className="cardsArea">
        {filteredProjects.map((project) => (
          <Card project={project} />
        ))}
      </div>
    </div>
  );
}
