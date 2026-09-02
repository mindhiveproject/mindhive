import { useQuery } from "@apollo/client";
import { useState, useEffect, useRef } from "react";
import useTranslation from "next-translate/useTranslation";

import Card from "./Card.js";

import { STUDIES_COLLECTING_DATA } from "../../../../Queries/Study.js";
import DropdownSelect from "../../../../DesignSystem/DropdownSelect";
import { ArrowDropDownIcon } from "../../../../DesignSystem/Icons";

function containsAny(arr1, arr2) {
  return arr1.some((item) => arr2.includes(item));
}

// Align the dropdown triggers with the search input sitting next to them in
// `.searchTopArea` (StyledReview): same border, radius and padding.
const FILTER_TRIGGER_STYLE = {
  border: "1px solid #cccccc",
  borderRadius: "4px",
  padding: "12px",
};

const DROPDOWN_GLYPH = <ArrowDropDownIcon width={22} height={22} />;

export default function StudiesBoard({
  selectedClassId,
  allUniqueClassIds,
  myClassesIds,
  allUniqueClasses,
}) {
  const { t } = useTranslation("builder");
  const scopedClassId = selectedClassId || null;
  const classIdsForQuery = scopedClassId
    ? [scopedClassId]
    : allUniqueClassIds || [];
  const [keyword, setKeyword] = useState("");
  const [filteredStudies, setFilteredStudies] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [filterSortMessage, setFilterSortMessage] = useState(
    t("review.showingAllStudies")
  );

  // Move sortOptions inside the function to use t()
  const sortOptions = [
    { label: t("review.oldest"), value: "OLDEST" },
    { label: t("review.newest"), value: "NEWEST" },
    { label: t("review.least_participants"), value: "LEAST_PARTICIPANTS" },
    { label: t("review.most_participants"), value: "MOST_PARTICIPANTS" },
  ];

  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true);

  const { data, loading, error } = useQuery(STUDIES_COLLECTING_DATA, {
    variables: {
      classIds: classIdsForQuery,
    },
    skip: !classIdsForQuery.length,
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
    let message = t("review.showingAllStudies");
    if (filteredClasses.length > 0) {
      const classTitles = filteredClasses
        .map((classId) => allUniqueClasses.find((c) => c.id === classId)?.title)
        .filter(Boolean)
        .join(", ");
      message = t("review.showingStudiesIn", { classTitles });
    }
    if (sortBy) {
      if (sortBy === "OLDEST") {
        message += t("review.sortedByOldest");
      } else if (sortBy === "NEWEST") {
        message += t("review.sortedByNewest");
      } else if (sortBy === "LEAST_PARTICIPANTS") {
        message += t("review.sortedByLeastParticipants");
      } else if (sortBy === "MOST_PARTICIPANTS") {
        message += t("review.sortedByMostParticipants");
      }
    }
    if (keyword) {
      message += t("review.matchingKeyword", { keyword });
    }
    setFilterSortMessage(message);
  }, [filteredClasses, sortBy, keyword, allUniqueClasses, t]);

  // Update URL when filters change
  useEffect(() => {
    if (isInitialMount.current) return;

    const queryParams = new URLSearchParams(window.location.search);
    if (scopedClassId) {
      queryParams.set("class", scopedClassId);
    }
    if (filteredClasses.length > 0) {
      queryParams.set("classes", filteredClasses.join(","));
    } else {
      queryParams.delete("classes");
    }
    if (keyword) {
      queryParams.set("keyword", keyword);
    } else {
      queryParams.delete("keyword");
    }
    if (sortBy) {
      queryParams.set("sort", sortBy);
    } else {
      queryParams.delete("sort");
    }

    const queryString = queryParams.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.pushState(
      { filteredClasses, keyword, sortBy },
      document.title,
      newUrl
    );
  }, [filteredClasses, keyword, sortBy, scopedClassId]);

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
            placeholder={t("review.search")}
            type="text"
            name="keyword"
            value={keyword}
            onChange={({ target }) => setKeyword(target.value)}
          />
        </div>

        <div id="sortBy">
          <DropdownSelect
            ariaLabel={t("review.sortBy")}
            placeholder={t("review.sortBy")}
            value={sortBy}
            options={sortOptions.map((p) => ({
              value: p.value,
              label: p.label,
            }))}
            triggerStyle={FILTER_TRIGGER_STYLE}
            icon={DROPDOWN_GLYPH}
            onChange={(next) => setSortBy(next)}
          />
        </div>
        <div id="filterByClasses">
          {!scopedClassId && allUniqueClasses?.length ? (
            <DropdownSelect
              multiple
              ariaLabel={t("review.filterByClasses")}
              placeholder={t("review.filterByClasses")}
              value={filteredClasses}
              options={allUniqueClasses.map((c) => ({
                value: c.id,
                label: c.title,
              }))}
              triggerStyle={FILTER_TRIGGER_STYLE}
              icon={DROPDOWN_GLYPH}
              onChange={(next) => setFilteredClasses(next)}
            />
          ) : null}
        </div>
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
