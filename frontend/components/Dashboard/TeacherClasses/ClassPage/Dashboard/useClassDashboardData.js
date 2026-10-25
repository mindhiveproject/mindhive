import { useQuery } from "@apollo/client";
import { useMemo } from "react";

import {
  CLASS_DASHBOARD_MENTORS_QUERY,
  CLASS_DASHBOARD_PROJECTS_QUERY,
  CLASS_DASHBOARD_STUDIES_QUERY,
  CLASS_ROSTER_QUERY,
} from "../../../../Queries/Classes";

const DASHBOARD_QUERIES = [
  CLASS_ROSTER_QUERY,
  CLASS_DASHBOARD_PROJECTS_QUERY,
  CLASS_DASHBOARD_STUDIES_QUERY,
  CLASS_DASHBOARD_MENTORS_QUERY,
];

// For mutations that change what the dashboard shows.
export function classDashboardRefetchQueries(classId) {
  if (!classId) return [];
  return DASHBOARD_QUERIES.map((query) => ({ query, variables: { classId } }));
}

// Lists each student's projects and studies of this class under
// `collaboratorInProposal` and `collaboratorInStudy`, the shape the dashboard
// and its modals read. Collaborators get `permissions: [{ name: "MENTOR" }]`
// when they are mentors, the only permission the modals look at.
export function groupByStudent(
  students = [],
  projects = [],
  studies = [],
  mentorIds = new Set()
) {
  const withRoles = (collaborators) =>
    (collaborators || []).map((collaborator) => ({
      ...collaborator,
      permissions: mentorIds.has(collaborator.id) ? [{ name: "MENTOR" }] : [],
    }));
  const projectsWithRoles = projects.map((project) => ({
    ...project,
    collaborators: withRoles(project.collaborators),
    study: project.study && {
      ...project.study,
      collaborators: withRoles(project.study.collaborators),
    },
  }));
  const studiesWithRoles = studies.map((study) => ({
    ...study,
    collaborators: withRoles(study.collaborators),
  }));

  const byCollaborator = (items) => {
    const map = new Map();
    for (const item of items) {
      for (const collaborator of item.collaborators) {
        if (!map.has(collaborator.id)) map.set(collaborator.id, []);
        map.get(collaborator.id).push(item);
      }
    }
    return map;
  };
  const projectsOf = byCollaborator(projectsWithRoles);
  const studiesOf = byCollaborator(studiesWithRoles);

  return students.map((student) => ({
    ...student,
    collaboratorInProposal: projectsOf.get(student.id) || [],
    collaboratorInStudy: studiesOf.get(student.id) || [],
  }));
}

export default function useClassDashboardData(classId) {
  const options = { variables: { classId }, skip: !classId };
  const roster = useQuery(CLASS_ROSTER_QUERY, options);
  const projects = useQuery(CLASS_DASHBOARD_PROJECTS_QUERY, options);
  const studies = useQuery(CLASS_DASHBOARD_STUDIES_QUERY, options);
  const mentors = useQuery(CLASS_DASHBOARD_MENTORS_QUERY, options);

  const ready = Boolean(
    roster.data && projects.data && studies.data && mentors.data
  );
  const data = useMemo(
    () =>
      ready
        ? {
            profiles: groupByStudent(
              roster.data.profiles,
              projects.data.proposalBoards,
              studies.data.studies,
              new Set(mentors.data.profiles.map((profile) => profile.id))
            ),
          }
        : undefined,
    [ready, roster.data, projects.data, studies.data, mentors.data]
  );

  return {
    data,
    loading:
      roster.loading || projects.loading || studies.loading || mentors.loading,
  };
}
