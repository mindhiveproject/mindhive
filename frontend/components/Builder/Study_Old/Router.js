import dynamic from "next/dynamic";
const Engine = () => import("./Engine");
const BrowserEngine = dynamic(Engine, {
  ssr: false,
});

export default function Router({
  query,
  user,
  study,
  handleChange,
  handleMultipleUpdate,
  captureFile,
  toggleSlidebar,
}) {
  return (
    <BrowserEngine
      query={query}
      user={user}
      study={study}
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      captureFile={captureFile}
      toggleSlidebar={toggleSlidebar}
    />
  );
}
