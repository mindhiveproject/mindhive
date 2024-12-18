import dynamic from "next/dynamic";
const Engine = () => import("./Engine");
const BrowserEngine = dynamic(Engine, {
  ssr: false,
});

export default function Router({
  query,
  user,
  tab,
  study,
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
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      saveStudy={saveStudy}
      toggleSidebar={toggleSidebar}
    />
  );
}
