import { Icon, Popup } from "semantic-ui-react";
import moment from "moment";
import Link from "next/link";

import DeleteAssignment from "./Delete";

import { useMutation } from "@apollo/client";
import { EDIT_ASSIGNMENT } from "../../../../Mutations/Assignment";
import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";

export default function AssignmentTab({ assignment, myclass, user, query }) {
  const [editAssignment, { loading: editLoading }] = useMutation(
    EDIT_ASSIGNMENT,
    {
      variables: {
        id: assignment?.id,
      },
      refetchQueries: [
        {
          query: GET_MY_CLASS_ASSIGNMENTS,
          variables: { userId: user?.id, classId: myclass?.id },
        },
        // { query: GET_CLASS, variables: { code: myclass?.code } },
        // { query: GET_ASSIGNMENT, variables: { code: assignment?.code } },
      ],
    }
  );

  const copyLink = () => {
    const copyLink = `https://mindhive.science/dashboard/assignments/${assignment?.code}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert("The link is copied");
  };

  return (
    <div className="tab">
      <div className="header">
        <div className="firstLine">
          <div>
            <div className="title">
              <h2>{assignment?.title}</h2>

              {assignment?.public ? (
                <Popup
                  content="The assignment is visible for students"
                  trigger={<Icon name="eye" />}
                />
              ) : (
                <Popup
                  content="The assignment is NOT visible for students"
                  trigger={<Icon name="eye slash" />}
                />
              )}
            </div>
            <em>{moment(assignment?.createdAt).format("MMM D, YYYY")}</em>
          </div>

          <div className="title">
            <DeleteAssignment user={user} myclass={myclass} id={assignment?.id}>
              <button className="secondary">Delete</button>
            </DeleteAssignment>
          </div>
        </div>

        <div className="headerInfo">
          <>
            <div className="buttons">
              <Link
                href={{
                  pathname: `/dashboard/myclasses/${myclass?.code}`,
                  query: {
                    page: "assignments",
                    action: "view",
                    assignment: assignment?.code,
                  },
                }}
              >
                <button className="secondary">Open</button>
              </Link>

              {assignment?.public ? (
                <>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to revoke this assignment? The assignment will no longer be visible for the students."
                        )
                      ) {
                        editAssignment({
                          variables: { input: { public: false } },
                        }).catch((err) => {
                          alert(err.message);
                        });
                      }
                    }}
                  >
                    Revoke
                  </button>
                  <button className="secondary" onClick={() => copyLink()}>
                    Copy link
                  </button>
                </>
              ) : (
                <div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to submit this assignment? The assignment will be visible for the students."
                        )
                      ) {
                        editAssignment({
                          variables: { input: { public: true } },
                        }).catch((err) => {
                          alert(err.message);
                        });
                      }
                    }}
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          </>

          <Link
            href={{
              pathname: `/dashboard/myclasses/${myclass?.code}`,
              query: {
                page: "assignments",
                action: "view",
                assignment: assignment?.code,
              },
            }}
          >
            <span>
              {assignment?.homework?.filter((h) => h?.public)?.length || 0}{" "}
              homework submitted
            </span>
          </Link>

          {/* {assignment.public ? (
            <Link
              href={{
                pathname: `/dashboard/myclasses/${myclass?.code}`,
                query: {
                  page: "assignments",
                  action: "view",
                  assignment: assignment?.code,
                },
              }}
            >
              
            </Link>
          ) : (
            
          )} */}
        </div>
      </div>
    </div>
  );
}
