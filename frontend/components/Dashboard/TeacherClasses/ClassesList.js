import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";

import { GET_CLASSES } from "../../Queries/Classes";
import ClassFavoriteButton, {
  compareClassesByFavoriteThenDate,
  getFavoriteClassIds,
} from "../ClassFavoriteButton";

export default function ClassesList({
  query,
  user,
  dateSortOrder = "newest",
  searchQuery = "",
}) {
  const { t } = useTranslation("classes");
  const { data, error, loading } = useQuery(GET_CLASSES, {
    variables: {
      input: {
        OR: [
          {
            creator: {
              id: { equals: user?.id },
            },
          },
          {
            teachingTeam: {
              some: { id: { equals: user?.id } },
            },
          },
          {
            mentors: {
              some: { id: { equals: user?.id } },
            },
          },
        ],
      },
    },
  });

  const classes = data?.classes || [];
  const favoriteIds = useMemo(() => getFavoriteClassIds(user), [user]);

  const filteredSortedClasses = useMemo(() => {
    const q = (searchQuery ?? "").trim().toLowerCase();
    let list = classes.filter((c) => {
      const title = (c?.title ?? "").toLowerCase();
      return !q || title.includes(q);
    });
    list.sort((a, b) =>
      compareClassesByFavoriteThenDate(a, b, favoriteIds, dateSortOrder)
    );
    return list;
  }, [classes, searchQuery, dateSortOrder, favoriteIds]);

  if (error) {
    return (
      <p className="classListError" role="alert">
        {t(
          "classesList.loadError",
          "We couldn’t load your classes. Please try again."
        )}
      </p>
    );
  }

  if (loading && !data) {
    return <p className="classListLoading">{t("common.loading", "Loading...")}</p>;
  }

  if (classes.length === 0) {
    return (
      <div className="classListEmpty">
        <h3>{t("classesList.noClassesYet")}</h3>
        <p>{t("classesList.createClassToAppear")}</p>
      </div>
    );
  }

  if (filteredSortedClasses.length === 0) {
    return (
      <div className="classListNoMatch">
        <p role="status">
          {t(
            "classesList.noClassesMatchSearch",
            "No classes match your search. Try a different name."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="classListContainer">
      <div className="classListHeader">
        <div>{t("classesList.className")}</div>
        <div>{t("classesList.teacher")}</div>
        <div>{t("classesList.numberOfStudents")}</div>
        <div>{t("classesList.dateCreated")}</div>
        <div aria-hidden="true" />
      </div>

      <div className="classListBoard">
        {filteredSortedClasses.map((myclass) => {
          const title = (myclass?.title ?? "").trim();
          const code = myclass?.code ?? "";
          const ariaLabel =
            title && code ? `${title} (${code})` : title || code || undefined;

          return (
            <Link
              key={myclass.id}
              href={{
                pathname: `/dashboard/myclasses/${myclass?.code}`,
              }}
              aria-label={ariaLabel}
            >
              <div className="classListRow">
                <div className="classListRowTitle">{title}</div>
                <div className="classListRowMeta">
                  {myclass?.creator?.username}
                </div>
                <div className="classListRowMeta">
                  {myclass?.students?.length}
                </div>
                <div className="classListRowMeta">
                  {moment(myclass?.createdAt).format("MMMM D, YYYY")}
                </div>
                <ClassFavoriteButton user={user} classId={myclass.id} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
