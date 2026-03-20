import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { MY_STUDIES, TEACHER_STUDIES } from "../../Queries/Study";
import { GET_USER_STUDIES, GET_USER_CLASSES } from "../../Queries/User";

import StudyCard from "./StudyCard";
import DropdownSelect from "../../DesignSystem/DropdownSelect";

function containsAny(arr1, arr2) {
  if (!arr1?.length || !arr2?.length) return false;
  return arr1.some((item) => arr2.includes(item));
}

export default function DevelopStudyBank({ user }) {
  const { t } = useTranslation("builder");
  const isTeacher = user?.permissions?.map((p) => p?.name).includes("TEACHER");

  const studiesQuery = isTeacher ? TEACHER_STUDIES : MY_STUDIES;
  const { data } = useQuery(studiesQuery, {
    variables: { id: user?.id },
    skip: !user?.id,
  });
  const studies = data?.studies || [];

  const { data: studyInfoData } = useQuery(GET_USER_STUDIES);
  const studiesInfo = studyInfoData?.authenticatedItem?.studiesInfo || {};

  const { data: classesData } = useQuery(GET_USER_CLASSES);
  const userClasses = useMemo(() => {
    const u = classesData?.authenticatedItem;
    if (!u) return [];
    const objs = [
      ...(u.studentIn || []),
      ...(u.teacherIn || []),
      ...(u.mentorIn || []),
    ];
    const byId = new Map();
    objs.forEach((cl) => {
      if (cl?.id && !byId.has(cl.id)) {
        byId.set(cl.id, cl);
      }
    });
    return Array.from(byId.values()).sort((a, b) =>
      String(a.title || "").localeCompare(String(b.title || ""), undefined, {
        sensitivity: "base",
      })
    );
  }, [classesData]);

  const classOptions = useMemo(
    () =>
      userClasses.map((cl) => ({
        value: String(cl.id),
        label:
          cl.title || cl.code || t("developStudies.unnamedClass", "Class"),
      })),
    [userClasses, t]
  );

  const [filter, setFilter] = useState("All");
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [sortBy, setSortBy] = useState("NEWEST");

  const statusOptions = [
    { value: "All", label: t("allStudies") },
    { value: "Active", label: t("activeStudies") },
    { value: "Archived", label: t("archivedStudies") },
  ];

  const sortOptions = [
    { value: "NEWEST", label: t("review.newest") },
    { value: "OLDEST", label: t("review.oldest") },
  ];

  let studiesIDsToHide = [];
  if (studiesInfo) {
    studiesIDsToHide = studies
      .filter((st) => studiesInfo[st?.id]?.hideInDevelop)
      .map((study) => study.id);
  }

  let filteredStudies = studies;
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
    default:
      break;
  }

  if (selectedClassIds.length > 0) {
    filteredStudies = filteredStudies.filter((study) => {
      const classIds = (study?.classes?.map((c) => c?.id).filter(Boolean) || []).map(
        String
      );
      const selected = selectedClassIds.map(String);
      return containsAny(classIds, selected);
    });
  }

  const sortedStudies = [...filteredStudies].sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (sortBy === "OLDEST") {
      if (ta !== tb) return ta - tb;
    } else {
      if (ta !== tb) return tb - ta;
    }
    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });

  return (
    <>
      <div
        style={{
          marginBottom: "16px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            gap: "16px",
            width: "100%",
          }}
        >
          <DropdownSelect
            fitContent
            value={filter}
            onChange={setFilter}
            options={statusOptions}
            ariaLabel={t("developStudies.filterByStatus", "Filter by status")}
          />
          <DropdownSelect
            fitContent
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            ariaLabel={t("review.sortBy", "Sort by")}
          />
          {userClasses.length > 0 && (
            <DropdownSelect
              fitContent
              multiple
              value={selectedClassIds}
              onChange={setSelectedClassIds}
              options={classOptions}
              placeholder={t(
                "developStudies.classFilterPlaceholder",
                "Select classes"
              )}
              ariaLabel={t("developStudies.filterByClass", "Filter by class")}
            />
          )}
        </div>
      </div>
      <div className="cardBoard">
        {sortedStudies.map((study) => (
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
