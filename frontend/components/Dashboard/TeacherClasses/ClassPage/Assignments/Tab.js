import absoluteUrl from "next-absolute-url";
import { Icon, Popup } from "semantic-ui-react";
import moment from "moment";
import Link from "next/link";
import useTranslation from "next-translate/useTranslation";

import DeleteAssignment from "./Delete";

import { useMutation } from "@apollo/client";
import { EDIT_ASSIGNMENT } from "../../../../Mutations/Assignment";
import { GET_MY_CLASS_ASSIGNMENTS } from "../../../../Queries/Assignment";

export default function AssignmentTab({ assignment, myclass, user, query }) {
  const { t } = useTranslation("classes");
  const { origin } = absoluteUrl();

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
      ],
    }
  );

  const copyLink = () => {
    const copyLink = `${origin}/dashboard/assignments/${assignment?.code}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert(t("assignment.linkCopied"));
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
                  content={t("assignment.visibleForStudents")}
                  trigger={<Icon name="eye" />}
                />
              ) : (
                <Popup
                  content={t("assignment.notVisibleForStudents")}
                  trigger={<Icon name="eye slash" />}
                />
              )}
            </div>
            <em>{moment(assignment?.createdAt).format("MMM D, YYYY")}</em>
          </div>

          <div className="title">
            <DeleteAssignment user={user} myclass={myclass} id={assignment?.id}>
              <button className="secondary">{t("assignment.delete")}</button>
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
                <button className="secondary">{t("assignment.open")}</button>
              </Link>

              {assignment?.public ? (
                <>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          t("assignment.revokeConfirm")
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
                    {t("assignment.unpublish")}
                  </button>
                  <button className="secondary" onClick={() => copyLink()}>
                    {t("assignment.copyLink")}
                  </button>
                </>
              ) : (
                <div>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          t("assignment.submitConfirm")
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
                    {t("assignment.publishToStudents")}
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
              {t("assignment.homework", { count: assignment?.homework.length || 0 })}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
