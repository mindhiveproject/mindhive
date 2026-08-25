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

  if (error) {
    return (
      <p className="classListError" role="alert">
        {t("classesList.loadError", {}, {
          default: "We couldn’t load your classes. Please try again.",
        })}
      </p>
    );
  }

  if (loading && !data) {
    return (
      <p className="classListLoading">
        {t("classesList.loading", {}, { default: "Loading…" })}
      </p>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="classListEmpty">
        <h3>{t("noClasses", {}, { default: "You haven’t joined any classes yet." })}</h3>
        <p>{t("joinClassInfo", {}, { default: "Once you join a class, it will appear here." })}</p>
      </div>
    );
  }

  return (
    <div className="classListContainer">
      <div className="classListHeader">
        <div>{t("classesList.className", {}, { default: "Class name" })}</div>
        <div>{t("classesList.teacher", {}, { default: "Teacher" })}</div>
        <div>
          {t("classesList.numberOfStudents", {}, { default: "Students" })}
        </div>
        <div>{t("classesList.dateCreated", {}, { default: "Date created" })}</div>
      </div>

      <div className="classListBoard">
        {classes.map((myclass) => {
          const title = (myclass?.title ?? "").trim();
          const code = myclass?.code ?? "";
          const ariaLabel =
            title && code ? `${title} (${code})` : title || code || undefined;

          return (
            <Link
              key={myclass.id}
              href={{
                pathname: `/dashboard/classes/${myclass?.code}`,
              }}
              aria-label={ariaLabel}
            >
              <div className="classListRow">
                <div className="classListRowTitle">{myclass?.title}</div>
                <div className="classListRowMeta">
                  {myclass?.creator?.username}
                </div>
                <div className="classListRowMeta">
                  {myclass?.students?.length}
                </div>
                <div className="classListRowMeta">
                  {moment(myclass?.createdAt).format("MMMM D, YYYY")}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
