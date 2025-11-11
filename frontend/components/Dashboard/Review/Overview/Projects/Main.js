import { useQuery } from "@apollo/client";
import { useState, useEffect, useRef } from "react";
import { Dropdown, Checkbox } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

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
  allUniqueClasses,
}) {
  const { t } = useTranslation("builder");
  const [keyword, setKeyword] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [showMyClassOnly, setShowMyClassOnly] = useState(false);
  const [filterSortMessage, setFilterSortMessage] = useState(
    t("review.showingAllProjects")
  );

  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true);
  // Store the previous selector value to detect tab switches
  const prevSelector = useRef(selector);

  let whereStatus, status, isOpenForCommentsQuery;
  switch (selector) {
    case "proposals":
      whereStatus = { submitProposalStatus: { in: ["SUBMITTED"] } };
      status = "SUBMITTED_AS_PROPOSAL";
      isOpenForCommentsQuery = "submitProposalOpenForComments";
      break;
    case "inreview":
      whereStatus = { peerFeedbackStatus: { in: ["SUBMITTED"] } };
      status = "PEER_REVIEW";
      isOpenForCommentsQuery = "peerFeedbackOpenForComments";
      break;
    case "report":
      whereStatus = { projectReportStatus: { in: ["SUBMITTED"] } };
      status = "PROJECT_REPORT";
      isOpenForCommentsQuery = "projectReportOpenForComments";
      break;
    default:
      whereStatus = { submitProposalStatus: { in: ["SUBMITTED"] } };
      status = "SUBMITTED_AS_PROPOSAL";
      isOpenForCommentsQuery = "submitProposalOpenForComments";
  }

  const { data, loading, error, refetch } = useQuery(PROJECTS_QUERY, {
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

  // Initialize state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const classesParam = params.get("classes");
    const keywordParam = params.get("keyword");
    const sortParam = params.get("sort");

    if (classesParam) setFilteredClasses(classesParam.split(","));
    if (keywordParam) setKeyword(keywordParam);
    if (sortParam) setSortBy(sortParam);

    // After initial mount, set isInitialMount to false
    isInitialMount.current = false;
  }, []);

  // Update filterSortMessage based on filters
  useEffect(() => {
    let message = t("review.showingAllProjects");
    if (filteredClasses.length > 0) {
      const classTitles = filteredClasses
        .map((classId) => allUniqueClasses.find((c) => c.id === classId)?.title)
        .filter(Boolean)
        .join(", ");
      message = t("review.showingProjectsIn", { classTitles });
    }
    if (sortBy) {
      if (sortBy === "OLDEST") {
        message += t("review.sortedByOldest");
      } else if (sortBy === "NEWEST") {
        message += t("review.sortedByNewest");
      } else if (sortBy === "LEAST_COMMENTS") {
        message += t("review.sortedByLeastComments");
      } else if (sortBy === "MOST_COMMENTS") {
        message += t("review.sortedByMostComments");
      }
    }
    if (keyword) {
      message += t("review.matchingKeyword", { keyword });
    }
    setFilterSortMessage(message);
  }, [filteredClasses, sortBy, keyword, allUniqueClasses, t]);

  // Reset filters only when selector changes (not on initial mount)
  useEffect(() => {
    // Skip reset on initial mount
    if (isInitialMount.current) {
      prevSelector.current = selector;
      return;
    }

    // Reset filters only if selector actually changed (tab switch)
    if (prevSelector.current !== selector) {
      setKeyword("");
      setSortBy("");
      setFilteredClasses([]);
      setShowMyClassOnly(false);
      setFilterSortMessage(t("review.showingAllProjects"));
      const newUrl = window.location.pathname;
      window.history.pushState({}, document.title, newUrl);
    }

    // Update prevSelector for the next render
    prevSelector.current = selector;
  }, [selector, t]);

  // Update URL when filters change
  useEffect(() => {
    const queryParams = new URLSearchParams();
    if (filteredClasses.length > 0) {
      queryParams.set("classes", filteredClasses.join(","));
    }
    if (keyword) {
      queryParams.set("keyword", keyword);
    }
    if (sortBy) {
      queryParams.set("sort", sortBy);
    }

    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    window.history.pushState(
      { filteredClasses, keyword, sortBy },
      document.title,
      newUrl
    );
  }, [filteredClasses, keyword, sortBy]);

  // Restore state on popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = (event) => {
      const params = new URLSearchParams(window.location.search);
      const classesParam = params.get("classes");
      const keywordParam = params.get("keyword");
      const sortParam = params.get("sort");

      setFilteredClasses(classesParam ? classesParam.split(",") : []);
      setKeyword(keywordParam || "");
      setSortBy(sortParam || "");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Filter and sort proposals
  useEffect(() => {
    async function filterProposals() {
      const projectsFiltered = projects.filter((project) => {
        let isMatchingKeyword = true;
        let isInFilteredClasses = true;
        if (keyword || filteredClasses.length) {
          if (keyword) {
            isMatchingKeyword = project.title
              .toLowerCase()
              .includes(keyword.toLowerCase());
          }
          if (filteredClasses.length) {
            isInFilteredClasses = containsAny(
              [project?.usedInClass?.id],
              filteredClasses
            );
          }
          return isMatchingKeyword && isInFilteredClasses;
        } else {
          return true;
        }
      });
      if (sortBy) {
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
              a?.reviews?.filter((r) => r?.stage === status).length <
              b?.reviews?.filter((r) => r?.stage === status).length
            )
              return -1;
            if (
              a?.reviews?.filter((r) => r?.stage === status).length >
              b?.reviews?.filter((r) => r?.stage === status).length
            )
              return 1;
          }
          if (sortBy === "MOST_COMMENTS") {
            if (
              a?.reviews?.filter((r) => r?.stage === status).length >
              b?.reviews?.filter((r) => r?.stage === status).length
            )
              return -1;
            if (
              a?.reviews?.filter((r) => r?.stage === status).length <
              b?.reviews?.filter((r) => r?.stage === status).length
            )
              return 1;
          }
        });
        setFilteredProjects(projectsFilteredAndSorted);
      } else {
        setFilteredProjects(projectsFiltered);
      }
    }
    if (projects) {
      filterProposals();
    }
  }, [
    projects?.length,
    keyword,
    showMyClassOnly,
    sortBy,
    filteredClasses,
    status,
  ]);

  // Function to navigate to a project page
  const navigateToProject = ({ id, stage }) => {
    const feedbackCenterUrl = window.location.href; // Current URL with filters
    const projectUrl = `/dashboard/review/project?id=${id}&stage=${stage}&from=${encodeURIComponent(
      feedbackCenterUrl
    )}`; // Adjust this path as needed
    window.location.href = projectUrl; // Full navigation to another page
  };

  return (
    <div className="board">
      <div className="searchTopArea">
        <div className="searchArea" id="searchArea">
          <input
            placeholder={t("review.search")}
            type="text"
            name="keyword"
            value={keyword}
            onChange={({ target }) => setKeyword(target.value)}
          />
        </div>

        <div id="sortBy">
          <Dropdown
            placeholder={t("review.sortBy")}
            fluid
            selection
            options={sortOptions.map((p) => ({
              key: p.value,
              value: p.value,
              text: t(`review.${p.value.toLowerCase()}`),
            }))}
            onChange={(event, data) => {
              setSortBy(data?.value);
            }}
            value={sortBy}
          />
        </div>
        <div id="filterByClasses">
          <Dropdown
            placeholder={t("review.filterByClasses")}
            fluid
            multiple
            selection
            options={allUniqueClasses.map((c) => ({
              key: c.id,
              value: c.id,
              text: c.title,
            }))}
            onChange={(event, data) => {
              setFilteredClasses(data.value);
            }}
            value={filteredClasses}
            />
        </div>
      </div>

      <div className="p16_500">{filterSortMessage}</div>

      <div className="cardsArea">
        {filteredProjects.map((project) => (
          <Card
            stage={selector}
            project={project}
            status={status}
            isOpenForCommentsQuery={isOpenForCommentsQuery}
            key={project?.id}
            onClick={() =>
              navigateToProject({ id: project.id, stage: selector })
            }
            style={{ cursor: "pointer"}}
          />
        ))}
      </div>
    </div>
  );
}
