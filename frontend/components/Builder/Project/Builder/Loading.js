import useTranslation from "next-translate/useTranslation";

import JustOneSecondNotice from "../../../DesignSystem/JustOneSecondNotice";

/**
 * Shown while the study is being fetched and while the Engine chunk downloads.
 * Exported so Main.js renders the same thing during its own loading states —
 * otherwise the two run back to back and read as separate flashes.
 */
export function BuilderLoading() {
  const { t } = useTranslation("builder");
  return (
    <div
      style={{
        display: "grid",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <JustOneSecondNotice
        message={{ p: t("main.loadingStudy", "Loading study...") }}
      />
    </div>
  );
}
