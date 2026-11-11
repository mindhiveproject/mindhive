import { useQuery } from "@apollo/client";
import { useMemo } from "react";

import {
  CLASS_DASHBOARD_MENTORS_QUERY,
  CLASS_DASHBOARD_PROJECTS_QUERY,
  CLASS_DASHBOARD_STUDIES_QUERY,
  CLASS_TEACHING_STAFF_QUERY,
  GET_CLASS,
} from "../../../../Queries/Classes";
import { classDashboardRefetchQueries } from "../Dashboard/useClassDashboardData";

// Settings a study made by the teacher for a student project starts with.
export const DEFAULT_STUDY_SETTINGS = {
  forbidRetake: true,
  hideParticipateButton: false,
  showEmailNotificationPropmt: false,
  askStudentsNYC: false,
  zipCode: false,
  guestParticipation: true,
  consentObtained: false,
  proceedToFirstTask: true,
  useExternalDevices: false,
  sonaId: false,
  minorsBlocked: false,
};

const NO_PEOPLE = [];

// Main projects first, then by title.
const byMainThenTitle = (a, b) =>
  Number(!!b.isMain) - Number(!!a.isMain) ||
  (a.title || "").localeCompare(b.title || "");

/**
 * The class's student projects (with their linked study), the ids of the
 * class's mentors and each study's participant totals, for the Studies tab's
 * project and participants columns, review order and the link / create study
 * actions. Skipped for read-only viewers.
 */
export function useClassStudyProjects(myclass, { skip = false } = {}) {
  const classId = myclass?.id;
  const options = { variables: { classId }, skip: skip || !classId };
  // JSON, not normalized boards: refresh on every visit (see
  // useClassDashboardData).
  const { data: projectsData, loading } = useQuery(
    CLASS_DASHBOARD_PROJECTS_QUERY,
    { ...options, fetchPolicy: "cache-and-network" }
  );
  const { data: mentorsData } = useQuery(CLASS_DASHBOARD_MENTORS_QUERY, options);
  // Real / test / included participant totals per study
  // (keystone/lib/classDashboard.js).
  const { data: studiesData } = useQuery(CLASS_DASHBOARD_STUDIES_QUERY, {
    ...options,
    fetchPolicy: "cache-and-network",
  });

  const projects = useMemo(
    () =>
      [...(projectsData?.classDashboardProjects || [])].sort(byMainThenTitle),
    [projectsData]
  );

  // Mentors of the class plus mentors already working on its projects/studies.
  const mentorIds = useMemo(
    () =>
      new Set([
        ...(myclass?.mentors || []).map((m) => m?.id),
        ...(mentorsData?.profiles || []).map((m) => m?.id),
      ].filter(Boolean)),
    [myclass?.mentors, mentorsData]
  );

  const projectsByStudyId = useMemo(() => {
    const map = new Map();
    for (const project of projects) {
      const studyId = project?.study?.id;
      if (studyId) {
        if (!map.has(studyId)) map.set(studyId, []);
        map.get(studyId).push(project);
      }
    }
    return map;
  }, [projects]);

  const participationByStudyId = useMemo(
    () =>
      new Map(
        (studiesData?.classDashboardStudies || []).map((study) => [
          study.id,
          study.participation,
        ])
      ),
    [studiesData]
  );

  return {
    projects,
    projectsByStudyId,
    participationByStudyId,
    mentorIds,
    loading,
  };
}

/**
 * The class's teaching team (teacher, co-teachers and mentors) who hold a
 * mentor or teacher permission: who a teacher can add as a study's mentors.
 */
export function useClassTeachingStaff(myclass, { skip = false } = {}) {
  const ids = useMemo(
    () => [
      ...new Set(
        [
          myclass?.creator,
          ...(myclass?.teachingTeam || []),
          ...(myclass?.mentors || []),
        ]
          .map((p) => p?.id)
          .filter(Boolean)
      ),
    ],
    [myclass?.creator, myclass?.teachingTeam, myclass?.mentors]
  );
  const { data } = useQuery(CLASS_TEACHING_STAFF_QUERY, {
    variables: { ids },
    skip: skip || !ids.length,
  });
  const staff = data?.profiles || NO_PEOPLE;
  const staffIds = useMemo(() => new Set(staff.map((p) => p.id)), [staff]);
  return { staff, staffIds };
}

// A project's author and collaborators, each once.
export function projectPeople(project) {
  const seen = new Map();
  for (const person of [project?.author, ...(project?.collaborators || [])]) {
    if (person?.id && !seen.has(person.id)) seen.set(person.id, person);
  }
  return [...seen.values()];
}

export function studyRefetchQueries(myclass) {
  return [
    ...classDashboardRefetchQueries(myclass?.id),
    ...(myclass?.code
      ? [{ query: GET_CLASS, variables: { code: myclass.code } }]
      : []),
  ];
}
