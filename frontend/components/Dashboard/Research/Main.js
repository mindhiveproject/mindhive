import { useMemo, useState } from "react";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../DesignSystem/Chip";
import StyledResearch from "./StyledResearch";
import ClassExport from "./ClassExport";
import BoardExport from "./BoardExport";
import {
  hasResearchAccess,
} from "./exportUtils";

export default function ResearchMain({ query, user }) {
  const [filterMode, setFilterMode] = useState("byClass");
  const { t } = useTranslation("research");
  const canAccess = useMemo(() => hasResearchAccess(user), [user]);

  if (!canAccess) {
    return (
      <StyledResearch>
        <div className="pageHeader">
          <div className="headerIcon">
            <img src="/assets/icons/education.svg" alt="Education" />
          </div>
          <h1>{t("research", {
            defaultValue: "Research",
          })}</h1>
        </div>
        <div className="toast error">
          {t("errors.noResearchAccess", {
            defaultValue: "You need research-level permissions to access the export tools.",
          })}
        </div>
      </StyledResearch>
    );
  }

  return (
    <StyledResearch>
      <div className="pageHeader">
        <div className="headerIcon">
          <img src="/assets/icons/visualize/statisticalTest.svg" alt="Research" />
        </div>
        <h1>
          {t("research", {
            defaultValue: "Research",
          })}
        </h1>
      </div>

      <p className="intro">
        {t("intro", {
          defaultValue: "Pull proposal content and review data directly from the MindHive platform. Choose the class, pick your data scope, and export downloadable CSV files formatted for analysis.",
        })}
      </p>

      <div className="filterModeRow">
        <Chip
          shape="square"
          label={t("filterByClass", {
            defaultValue: "Class boards",
          })}
          selected={filterMode === "byClass"}
          onClick={() => setFilterMode("byClass")}
        />
        <Chip
          shape="square"
          label={t("byBoard", {
            defaultValue: "Individual board",
          })}
          selected={filterMode === "byBoard"}
          onClick={() => setFilterMode("byBoard")}
        />
      </div>

      {filterMode === "byClass" ? <ClassExport /> : <BoardExport />}
    </StyledResearch>
  );
}
