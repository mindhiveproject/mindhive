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
  updateStudy,
}) {
  return (
    <BrowserEngine
      query={query}
      user={user}
      tab={tab}
      study={study}
      handleChange={handleChange}
      updateStudy={updateStudy}
    />
  );
}
