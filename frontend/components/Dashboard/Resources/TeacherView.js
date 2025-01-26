import Link from "next/link";

import PublicResourcesList from "./PublicResourcesList";
import ProjectResourcesList from "./ProjectResourcesList";

import { useQuery } from "@apollo/client";

import { GET_MY_PROJECT_BOARDS } from "../../Queries/Proposal";
import CopyResource from "./CopyResource";
import EditResource from "./EditResource";

export default function TeacherView({ query, user }) {
  const { selector, project } = query;

  const { data, loading, error } = useQuery(GET_MY_PROJECT_BOARDS, {
    variables: { userId: user?.id },
  });

  const projects = data?.proposalBoards || [];

  if (!selector) {
    return (
      <>
        <h1>Recources center for teachers</h1>

        <div className="header">
          <div className="menu">
            {projects.map((p) => (
              <Link
                href={{
                  pathname: `/dashboard/resources`,
                  query: { project: p?.id },
                }}
              >
                <div
                  className={
                    project === p?.id
                      ? "menuTitle selectedMenuTitle"
                      : "menuTitle"
                  }
                >
                  <p>{p?.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {!project && (
          <>
            <p>
              You can explore public resources or customize resources for each
              project board you created.
            </p>
            <PublicResourcesList query={query} user={user} />
          </>
        )}

        {project && (
          <ProjectResourcesList query={query} user={user} projectId={project} />
        )}
      </>
    );
  }

  if (selector === "copy") {
    return <CopyResource user={user} query={query} />;
  }

  if (selector === "edit") {
    return <EditResource selector={selector} user={user} query={query} />;
  }
}
