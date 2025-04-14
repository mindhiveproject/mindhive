import { useQuery } from "@apollo/client";
import { useState, useEffect, useRef } from "react";
import { Dropdown } from "semantic-ui-react";

import Card from "./Card.js";

import { STUDIES_COLLECTING_DATA } from "../../../../Queries/Study.js";

function containsAny(arr1, arr2) {
  return arr1.some((item) => arr2.includes(item));
}

const sortOptions = [
  { label: "Oldest", value: "OLDEST" },
  { label: "Newest", value: "NEWEST" },
  { label: "Least participants", value: "LEAST_PARTICIPANTS" },
  { label: "Most participants", value: "MOST_PARTICIPANTS" },
];

export default function StudiesBoard({
  allUniqueClassIds,
  myClassesIds,
  allUniqueClasses,
}) {
  const [keyword, setKeyword] = useState("");
  const [filteredStudies, setFilteredStudies] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [filterSortMessage, setFilterSortMessage] = useState(
    "Showing all studies"
  );

  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true);

  const { data, loading, error } = useQuery(STUDIES_COLLECTING_DATA, {
    variables: {
      classIds: allUniqueClassIds,
    },
  });

  const studies = data?.studies || [];

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
    let message = "Showing all studies";
    if (filteredClasses.length > 0) {
      const classTitles = filteredClasses
        .map((classId) => allUniqueClasses.find((c) => c.id === classId)?.title)
        .filter(Boolean)
        .join(", ");
      message = `Showing studies in ${classTitles}`;
    }
    if (sortBy) {
      if (sortBy === "OLDEST") {
        message += `, sorted by oldest to newest`;
      } else if (sortBy === "NEWEST") {
        message += `, sorted by newest to oldest`;
      } else if (sortBy === "LEAST_PARTICIPANTS") {
        message += `, sorted by least to most participants`;
      } else if (sortBy === "MOST_PARTICIPANTS") {
        message += `, sorted by most to least participants`;
      }
    }
    if (keyword) {
      message += ` matching "${keyword}"`;
    }
    setFilterSortMessage(message);
  }, [filteredClasses, sortBy, keyword, allUniqueClasses]);

  // Update URL when filters change
  useEffect(() => {
    if (isInitialMount.current) return;

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

  // Filter and sort studies
  useEffect(() => {
    async function filterStudies() {
      const studiesFiltered = studies.filter((study) => {
        let isMatchingKeyword = true;
        let isInFilteredClasses = true;
        if (keyword || filteredClasses.length) {
          if (keyword) {
            isMatchingKeyword = study.title
              .toLowerCase()
              .includes(keyword.toLowerCase());
          }
          if (filteredClasses.length) {
            isInFilteredClasses = containsAny(
              study?.classes?.map((cl) => cl?.id),
              filteredClasses
            );
          }
          return isMatchingKeyword && isInFilteredClasses;
        } else {
          return true;
        }
      });

      if (sortBy) {
        const studiesFilteredAndSorted = studiesFiltered.sort((a, b) => {
          if (sortBy === "OLDEST") {
            if (a.createdAt < b.createdAt) return -1;
            if (a.createdAt > b.createdAt) return 1;
          }
          if (sortBy === "NEWEST") {
            if (a.createdAt > b.createdAt) return -1;
            if (a.createdAt < b.createdAt) return 1;
          }
          if (sortBy === "LEAST_PARTICIPANTS") {
            const aCount = [
              ...(a?.participants || []),
              ...(a?.guests || []),
            ].filter((p) =>
              p?.datasets?.some(
                (dataset) => dataset?.studyStatus === "COLLECTING_DATA"
              )
            ).length;
            const bCount = [
              ...(b?.participants || []),
              ...(b?.guests || []),
            ].filter((p) =>
              p?.datasets?.some(
                (dataset) => dataset?.studyStatus === "COLLECTING_DATA"
              )
            ).length;
            if (aCount < bCount) return -1;
            if (aCount > bCount) return 1;
            return 0;
          }
          if (sortBy === "MOST_PARTICIPANTS") {
            const aCount = [
              ...(a?.participants || []),
              ...(a?.guests || []),
            ].filter((p) =>
              p?.datasets?.some(
                (dataset) => dataset?.studyStatus === "COLLECTING_DATA"
              )
            ).length;
            const bCount = [
              ...(b?.participants || []),
              ...(b?.guests || []),
            ].filter((p) =>
              p?.datasets?.some(
                (dataset) => dataset?.studyStatus === "COLLECTING_DATA"
              )
            ).length;
            if (aCount > bCount) return -1;
            if (aCount < bCount) return 1;
            return 0;
          }
          return 0;
        });
        setFilteredStudies(studiesFilteredAndSorted);
      } else {
        setFilteredStudies(studiesFiltered);
      }
    }
    if (studies) {
      filterStudies();
    }
  }, [studies?.length, keyword, sortBy, filteredClasses]);

  // Function to navigate to a study page
  const navigateToStudy = ({ slug, dataCollectionOpenForParticipation }) => {
    if (!dataCollectionOpenForParticipation) return; // Do not navigate if study is closed
    const studyUrl = `/dashboard/discover/studies?name=${slug}`;
    window.open(studyUrl, "_blank"); // Open in a new tab
  };

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
              setSortBy(data?.value);
            }}
            value={sortBy}
          />
        </div>
        <Dropdown
          placeholder="Filter by classes"
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

      <div className="p16_500">{filterSortMessage}</div>

      <div className="cardsArea">
        {filteredStudies.map((study) => (
          <div
            key={study?.id}
            onClick={() =>
              navigateToStudy({
                slug: study?.slug,
                dataCollectionOpenForParticipation:
                  study?.dataCollectionOpenForParticipation,
              })
            }
            style={{
              cursor: study?.dataCollectionOpenForParticipation
                ? "pointer"
                : "default",
            }}
          >
            <Card study={study} />
          </div>
        ))}
      </div>
    </div>
  );
}
