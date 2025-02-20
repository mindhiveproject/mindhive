import Link from "next/link";

import PublicResourcesList from "./PublicResourcesList";
import ProjectResourcesList from "./ProjectResourcesList";
import ClassResourcesList from "./ClassResourcesList";

import { useQuery } from "@apollo/client";
import { useRouter } from "next/dist/client/router";

// import { GET_MY_PROJECT_BOARDS } from "../../Queries/Proposal";
import { GET_USER_CLASSES } from "../../Queries/User";

import CopyResource from "./CopyResource";
import EditResource from "./EditResource";
import { Dropdown } from "semantic-ui-react";

export default function TeacherView({ query, user }) {
  const router = useRouter();
  const { selector, c } = query;

  const { data, loading, error } = useQuery(GET_USER_CLASSES);

  const classes = data?.authenticatedItem?.teacherIn || [];

  const options = classes.map((project) => ({
    key: project?.id,
    text: project?.title,
    value: project?.id,
  }));

  let projectId;
  if (classes && classes.length) {
    const projectIds = classes
      .filter((cl) => cl?.id === c)
      .map((cl) => cl?.templateProposal?.id);
    if (projectIds && projectIds.length) {
      projectId = projectIds[0];
    }
  }
  let classSlug;
  if (classes && classes.length) {
    const classSlugs = classes
      .filter((cl) => cl?.id === c)
      .map((cl) => cl?.code);
    if (classSlugs && classSlugs.length) {
      classSlug = classSlugs[0];
    }
  }

  if (!selector) {
    return (
      <>
        <h1>Resources center for teachers</h1>

        {/* <div className="header">
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
        </div> */}

        <Dropdown
          selection
          placeholder="Select the class"
          options={options}
          onChange={(event, data) => {
            console.log(data.value);
            router.push({
              pathname: `/dashboard/resources`,
              query: { c: data.value },
            });
          }}
          value={c}
        />

        {/* {!project && (
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
        )} */}

        {c && (
          <ClassResourcesList
            query={query}
            user={user}
            classId={c}
            classSlug={classSlug}
            projectId={projectId}
          />
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
