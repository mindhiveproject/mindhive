import { useQuery } from "@apollo/client";
import Link from "next/link";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { GET_CLASSES } from "../../Queries/Classes";

export default function ClassesList({ query, user }) {
  const { t } = useTranslation("classes");
  const { data, error, loading } = useQuery(GET_CLASSES, {
    variables: {
      input: {
        students: { some: { id: { equals: user?.id } } },
      },
    },
  });

  const classes = data?.classes || [];

  if (classes.length === 0) {
    return (
      <>
        <h3>{t("noClasses")}</h3>
        <p>{t("joinClassInfo")}</p>
      </>
    );
  }

  return (
    <>
      <div className="classListHeader">
        <div>{t("className")}</div>
        <div>{t("teacher")}</div>
        <div>{t("numberOfStudents")}</div>
        <div>{t("dateCreated")}</div>
      </div>

      <div className="board">
        {classes?.map((myclass, i) => (
          <Link
            key={i}
            href={{
              pathname: `/dashboard/classes/${myclass?.code}`,
            }}
          >
            <div className="classListRow">
              <div>{myclass?.title}</div>
              <div>{myclass?.creator?.username}</div>
              <div>{myclass?.students?.length}</div>
              <div>{moment(myclass?.createdAt).format("MMMM D, YYYY")}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
