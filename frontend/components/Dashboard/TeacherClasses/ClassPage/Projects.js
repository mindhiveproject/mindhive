import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import moment from "moment";
import Link from "next/link";

import { CLASS_PROJECTS_QUERY } from "../../../Queries/Proposal";

export default function ClassProjects({ myclass, user }) {
  const router = useRouter();

  const { data, loading, error } = useQuery(CLASS_PROJECTS_QUERY, {
    variables: { classId: myclass?.id },
  });

  const projects = data?.proposalBoards || [];

  // if (projects.length === 0) {
  //   return (
  //     <div className="empty">
  //       <div>The students haven’t created any projects yet.</div>
  //     </div>
  //   );
  // }

  return (
    <>
      <div>
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "board",
            },
          }}
        >
          <button>Manage the class project board</button>
        </Link>
      </div>

      {projects?.length > 0 ? (
        <div className="studies">
          <div className="studiesHeader">
            <div>
              <span>Project title </span>
              {/* <span
                style={{ cursor: "pointer" }}
                onClick={() => randomizeStudiesOrder(false)}
              >
                ↓
              </span> */}
            </div>
            <div>Collaborator(s)</div>
            <div>Date created</div>
            {/* <div></div>
        <div></div> */}
          </div>
          {projects.map((study) => {
            const authors = [
              study?.author?.username,
              study?.collaborators?.map((c) => c.username),
            ].join(", ");
            return (
              <div key={study?.id} className="studiesRow">
                <div>{study?.title}</div>
                <div>{authors}</div>
                <div>{moment(study?.createdAt).format("MMMM D, YYYY")}</div>
                {/* <div>
              <a
                target="_blank"
                href={`/studies/${study.slug}`}
                rel="noreferrer"
              >
                Study page
              </a>
            </div>
            <div>
              <a
                target="_blank"
                href={`/builder/studies/?selector=${study.id}`}
                rel="noreferrer"
              >
                Study builder
              </a>
            </div> */}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <div>The students haven’t created any projects yet.</div>
        </div>
      )}
    </>
  );
}
