import { useQuery } from "@apollo/client";
import moment from "moment";
import Link from "next/link";

import EditAssignment from "./Edit";
import AddAssignment from "./Add";

import { GET_TEMPLATE_ASSIGNMENTS } from "../../../Queries/Assignment";
import DeleteAssignment from "./Delete";

export default function TemplateAssignments({ query, user }) {
  const { data, loading, error } = useQuery(GET_TEMPLATE_ASSIGNMENTS);

  const assignments = data?.assignments || [];

  const { id, action } = query;
  if (action) {
    if (action === "add") {
      return <AddAssignment />;
    }
    if (action === "edit" && id) {
      return <EditAssignment user={user} id={id} />;
    }
  }

  return (
    <div>
        <div className="navigationHeader">
            <Link
                href={{
                    pathname: "/dashboard/management/assignments",
                    query: {
                        action: "add",
                    },
                }}
                >
                <button>Add assignment</button>
            </Link>
        </div>

      <div className="classHeader">
        <div>Title</div>
        <div>Creator</div>
        <div>Date created</div>
        <div>Date updated</div>
      </div>

      {assignments.map((assignment) => (
        <div key={assignment?.id} className="tableOuterRow">
          <Link
            href={{
              pathname: "/dashboard/management/assignments",
              query: {
                id: assignment?.id,
                action: "edit",
              },
            }}
            key={assignment.id}
          >
              <div className="classRow" key={assignment.id}>
                  <div>{assignment?.title}</div>
                  <div>{assignment?.author?.username}</div>
                  <div>{moment(assignment?.createdAt).format("MMMM D, YYYY")}</div>
                  <div>{moment(assignment?.updatedAt).format("MMMM D, YYYY")}</div>
              </div>
          </Link>
          <DeleteAssignment id={assignment?.id}>Delete</DeleteAssignment>
        </div>
      ))}
    </div>
  );
}
