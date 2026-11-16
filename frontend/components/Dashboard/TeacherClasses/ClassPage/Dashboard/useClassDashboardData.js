import { useQuery } from "@apollo/client";
import { useMemo } from "react";

import useRefetchOnFocus from "../useRefetchOnFocus";

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

  // A project also belongs to its author, who is not always among its
  // collaborators.
  const byCollaborator = (items) => {
    const map = new Map();
    for (const item of items) {
      const memberIds = new Set(
        [item.author?.id, ...item.collaborators.map((c) => c.id)].filter(Boolean)
      );
      for (const memberId of memberIds) {
        if (!map.has(memberId)) map.set(memberId, []);
        map.get(memberId).push(item);
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
  // Projects and studies come as JSON, not normalized ProposalBoards and
  // Studies: edits made on other pages don't reach the cache, so show the
  // cached copy and refresh it on every visit.
  const jsonOptions = { ...options, fetchPolicy: "cache-and-network" };
  const projects = useQuery(CLASS_DASHBOARD_PROJECTS_QUERY, jsonOptions);
  const studies = useQuery(CLASS_DASHBOARD_STUDIES_QUERY, jsonOptions);
  const mentors = useQuery(CLASS_DASHBOARD_MENTORS_QUERY, options);
  // Students submit and finish milestones from their own screens: refresh
  // when the teacher comes back to this page.
  useRefetchOnFocus(
    ["CLASS_DASHBOARD_PROJECTS_QUERY", "CLASS_DASHBOARD_STUDIES_QUERY"],
    { skip: !classId }
  );

  const ready = Boolean(
    roster.data && projects.data && studies.data && mentors.data
  );
  const data = useMemo(
    () =>
      ready
        ? {
            profiles: groupByStudent(
              roster.data.profiles,
              projects.data.classDashboardProjects,
              studies.data.classDashboardStudies,
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
