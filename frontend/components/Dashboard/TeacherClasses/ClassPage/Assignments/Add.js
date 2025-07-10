import Link from "next/link";
import moment from "moment";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import NewAssignment from "./New";

import {
  GET_MY_CLASS_ASSIGNMENTS,
  GET_TEMPLATE_ASSIGNMENTS,
} from "../../../../Queries/Assignment";

export default function AddAssignment({ myclass, user, query }) {
  const { t } = useTranslation("classes");
  const { data, loading, error } = useQuery(GET_MY_CLASS_ASSIGNMENTS, {
    variables: { userId: user?.id, classId: myclass?.id },
  });
  const assignments = data?.assignments || [];

  const { data: templateData } = useQuery(GET_TEMPLATE_ASSIGNMENTS);
  const templates = templateData?.assignments || [];

  return (
    <div className="selector">
      <div className="head">
        <Link
          href={{
            pathname: `/dashboard/myclasses/${myclass?.code}`,
            query: {
              page: "assignments",
            },
          }}
        >
          <p>{t("assignment.goBack")}</p>
        </Link>
        <p>
          {t("assignment.createFromScratchOrList")}
        </p>
      </div>
      <div>
        <div className="navigationHeader">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridGap: "10px",
            }}
          >
            <NewAssignment user={user} myclass={myclass}>
              <div>
                <button>{t("assignment.createNew")}</button>
              </div>
            </NewAssignment>
          </div>
        </div>
      </div>

      <div>
        <h2>{t("assignment.createFromExisting")}</h2>
        <div className="header">
          <div>{t("assignment.title")}</div>
          <div>{t("assignment.creator")}</div>
          <div>{t("assignment.dateCreated")}</div>
          <div>{t("assignment.dateUpdated")}</div>
        </div>

        {assignments.map((assignment) => (
          <NewAssignment
            key={assignment.id}
            user={user}
            myclass={myclass}
            assignment={assignment}
          >
            <div className="row">
              <div>{assignment?.title}</div>
              <div>{assignment?.author?.username}</div>
              <div>{moment(assignment?.createdAt).format("MMMM D, YYYY")}</div>
              <div>{moment(assignment?.updatedAt).format("MMMM D, YYYY")}</div>
            </div>
          </NewAssignment>
        ))}
      </div>

      <div>
        <h2>{t("assignment.createFromTemplate")}</h2>
        <div className="header">
          <div>{t("assignment.title")}</div>
          <div>{t("assignment.creator")}</div>
          <div>{t("assignment.dateCreated")}</div>
          <div>{t("assignment.dateUpdated")}</div>
        </div>
        <div></div>

        {templates.map((assignment) => (
          <NewAssignment
            key={assignment.id}
            user={user}
            myclass={myclass}
            assignment={assignment}
          >
            <div className="row">
              <div>{assignment?.title}</div>
              <div>{assignment?.author?.username}</div>
              <div>{moment(assignment?.createdAt).format("MMMM D, YYYY")}</div>
              <div>{moment(assignment?.updatedAt).format("MMMM D, YYYY")}</div>
            </div>
          </NewAssignment>
        ))}
      </div>
    </div>
  );
}
