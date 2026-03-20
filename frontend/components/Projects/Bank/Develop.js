import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_MY_PROJECT_BOARDS, TEACHER_PROJECT_BOARDS } from "../../Queries/Proposal";
import { GET_USER_CLASSES, GET_USER_STUDIES } from "../../Queries/User";

import ProjectCard from "./ProjectCard";
import DropdownSelect from "../../DesignSystem/DropdownSelect";

function containsAny(arr1, arr2) {
  if (!arr1?.length || !arr2?.length) return false;
  return arr1.some((item) => arr2.includes(item));
}

function getProjectClassIds(project) {
  const ids = [];
  (project.templateForClasses || []).forEach((c) => {
    if (c?.id) ids.push(String(c.id));
  });
  if (project.usedInClass?.id) {
    ids.push(String(project.usedInClass.id));
  }
  return [...new Set(ids)];
}

export default function DevelopProjectBank({ user }) {
  const { t } = useTranslation("builder");
  const isTeacher = user?.permissions?.map((p) => p?.name).includes("TEACHER");

  const projectsQuery = isTeacher ? TEACHER_PROJECT_BOARDS : GET_MY_PROJECT_BOARDS;
  const { data } = useQuery(projectsQuery, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });
  const projects = data?.proposalBoards || [];

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
          cl.title || cl.code || t("developProjects.unnamedClass", "Class"),
      })),
    [userClasses, t]
  );

  const [filter, setFilter] = useState("All");
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [sortBy, setSortBy] = useState("NEWEST");

  const statusOptions = [
    { value: "All", label: t("developProjects.allProjects", "All projects") },
    { value: "Active", label: t("developProjects.activeProjects", "Active projects") },
    { value: "Archived", label: t("developProjects.archivedProjects", "Archived projects") },
  ];

  const sortOptions = [
    { value: "NEWEST", label: t("review.newest") },
    { value: "OLDEST", label: t("review.oldest") },
  ];

  let filteredProjects = projects;
  switch (filter) {
    case "Active":
      filteredProjects = projects.filter((project) => {
        const studyId = project?.study?.id;
        if (!studyId) return true;
        return !studiesInfo[studyId]?.hideInDevelop;
      });
      break;
    case "Archived":
      filteredProjects = projects.filter((project) => {
        const studyId = project?.study?.id;
        if (!studyId) return false;
        return studiesInfo[studyId]?.hideInDevelop;
      });
      break;
    default:
      break;
  }

  if (selectedClassIds.length > 0) {
    const selected = selectedClassIds.map(String);
    filteredProjects = filteredProjects.filter((project) => {
      const classIds = getProjectClassIds(project);
      return containsAny(classIds, selected);
    });
  }

  const sortedProjects = [...filteredProjects].sort((a, b) => {
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
            ariaLabel={t("developProjects.filterByStatus", "Filter by status")}
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
                "developProjects.classFilterPlaceholder",
                "Select classes"
              )}
              ariaLabel={t("developProjects.filterByClass", "Filter by class")}
            />
          )}
        </div>
      </div>
      <div className="cardBoard">
        {sortedProjects.map((project) => (
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
