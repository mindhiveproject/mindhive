import { useState } from "react";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import AddClass from "./AddClass";
import ClassPage from "./ClassPage/Main";

import ClassesList from "./ClassesList";
import StyledClass from "../../styles/StyledClass";

export default function TeacherClasses({ query, user }) {
  const { t } = useTranslation("classes");
  const router = useRouter();
  const { selector } = query;
  const [dateSortOrder, setDateSortOrder] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  if (!selector) {
    const sortChipHint =
      dateSortOrder === "newest"
        ? t(
            "classesList.sortDateChipHintNewest",
            "Showing most recent first. Click to show least recent first."
          )
        : t(
            "classesList.sortDateChipHintOldest",
            "Showing least recent first. Click to show most recent first."
          );

    const searchPlaceholder = t(
      "classesList.searchClassesPlaceholder",
      "Search by class name"
    );

    return (
      <StyledClass>
        <div className="teacherClassesHeader">
          <h1>{t("teacherClasses.teacherClasses")}</h1>
          <Button onClick={() => router.push("/dashboard/myclasses/add")}>
            {t("teacherClasses.addClass")}
          </Button>
        </div>
        <div className="teacherClassesToolbar">
          <input
            type="search"
            className="teacherClassesSearch"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          <div className="teacherClassesSortChip">
            <span className="teacherClassesSortLabel">
              {t("classesList.sortByLabel", "Sort by:")}
            </span>
            <Chip
              label={
                dateSortOrder === "newest"
                  ? t(
                      "classesList.sortDateChipLabelNewest",
                      "Most recent at the top"
                    )
                  : t(
                      "classesList.sortDateChipLabelOldest",
                      "Least recent at the top"
                    )
              }
              shape="square"
              onClick={() =>
                setDateSortOrder((prev) =>
                  prev === "newest" ? "oldest" : "newest"
                )
              }
              ariaLabel={sortChipHint}
              title={sortChipHint}
            />
          </div>
        </div>
        <ClassesList
          query={query}
          user={user}
          dateSortOrder={dateSortOrder}
          searchQuery={searchQuery}
        />
      </StyledClass>
    );
  }
  if (selector === "add") {
    return <AddClass user={user} />;
  }

  return <ClassPage code={selector} user={user} query={query} />;
}
