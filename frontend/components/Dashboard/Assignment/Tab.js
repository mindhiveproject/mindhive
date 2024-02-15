import Link from "next/link";
import { Icon, Popup } from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import moment from "moment";

import useForm from "../../../lib/useForm";
import DeleteHomework from "./Delete";

import { EDIT_HOMEWORK } from "../../Mutations/Homework";
import { GET_MY_HOMEWORKS_FOR_ASSIGNMENT } from "../../Queries/Homework";

export default function HomeworkTab({ user, assignment, homework }) {
  const { inputs, handleChange, clearForm } = useForm({
    ...homework,
  });

  const [editHomework, { loading }] = useMutation(EDIT_HOMEWORK, {
    variables: {
      ...inputs,
    },
    refetchQueries: [
      {
        query: GET_MY_HOMEWORKS_FOR_ASSIGNMENT,
        variables: { userId: user?.id, assignmentCode: assignment?.code },
      },
    ],
  });

  return (
    <div className="tab">
      <div className="header">
        <div className="firstLine">
          <div>
            <div className="title">
              <h2>{homework?.title}</h2>

              {homework?.public ? (
                <Popup
                  content="The homework is visible for teacher"
                  trigger={<Icon name="eye" />}
                />
              ) : (
                <Popup
                  content="The homework is NOT visible for teacher"
                  trigger={<Icon name="eye slash" />}
                />
              )}
            </div>
            <em>{moment(homework?.createdAt).format("MMM D, YYYY")}</em>
          </div>

          <div className="title">
            <DeleteHomework
              user={user}
              assignment={assignment}
              homework={homework}
            >
              <button className="secondary">Delete</button>
            </DeleteHomework>
          </div>
        </div>

        <div className="headerInfo">
          <>
            <div className="buttons">
              <Link
                key={homework?.id}
                href={{
                  pathname: `/dashboard/assignments/${assignment?.code}`,
                  query: {
                    homework: homework?.code,
                  },
                }}
              >
                <button className="secondary">Open</button>
              </Link>

              {homework?.public ? (
                <>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to revoke this homework? The homework will no longer be visible for the teacher."
                        )
                      ) {
                        editHomework({
                          variables: { public: false },
                        }).catch((err) => {
                          alert(err.message);
                        });
                      }
                    }}
                  >
                    Revoke
                  </button>
                </>
              ) : (
                <div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to submit this homework? The homework will be visible for the teacher."
                        )
                      ) {
                        editHomework({
                          variables: { public: true },
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
        </div>
      </div>
    </div>
  );
}
