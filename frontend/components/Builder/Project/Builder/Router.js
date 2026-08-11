import dynamic from "next/dynamic";
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

const Engine = () => import("./Engine");

// Engine pulls in @projectstorm/react-diagrams and is browser-only. Without a
// loading fallback next/dynamic renders null, collapsing the builder area to
// an empty hole until the chunk arrives.
const BrowserEngine = dynamic(Engine, {
  ssr: false,
  loading: BuilderLoading,
});

export default function Router({
  query,
  user,
  tab,
  study,
  project,
  handleChange,
  handleMultipleUpdate,
  saveStudy,
  toggleSidebar,
}) {
  return (
    <BrowserEngine
      query={query}
      user={user}
      tab={tab}
      study={study}
      project={project}
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      saveStudy={saveStudy}
      toggleSidebar={toggleSidebar}
    />
  );
}
