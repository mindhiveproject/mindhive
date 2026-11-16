import dynamic from "next/dynamic";

import { BuilderLoading } from "./Loading";

export { BuilderLoading };

// Both canvases are browser-only (Storm, React Flow and the collaboration
// socket). Without a loading fallback next/dynamic renders null, collapsing
// the builder area to an empty hole until the chunk arrives.
const BrowserEngine = dynamic(() => import("./Engine"), {
  ssr: false,
  loading: BuilderLoading,
});

// The new builder: React Flow canvas with collaborative editing
const BrowserFlowEngine = dynamic(() => import("./FlowEngine"), {
  ssr: false,
  loading: BuilderLoading,
});

/**
 * Which canvas to draw the study on while both exist: the React Flow canvas
 * when the URL has ?canvas=flow or NEXT_PUBLIC_STUDY_CANVAS is "flow";
 * ?canvas=storm always opens the Storm canvas. Both save the design in the
 * same format, so a study can be opened in either.
 */
export function isFlowCanvas(query) {
  if (query?.canvas === "storm") return false;
  if (query?.canvas === "flow") return true;
  return process.env.NEXT_PUBLIC_STUDY_CANVAS === "flow";
}

export default function Router({
  query,
  user,
  tab,
  study,
  project,
  handleChange,
  handleMultipleUpdate,
  saveStudy,
}) {
  const SelectedEngine = isFlowCanvas(query) ? BrowserFlowEngine : BrowserEngine;
  return (
    <SelectedEngine
      query={query}
      user={user}
      tab={tab}
      study={study}
      project={project}
      handleChange={handleChange}
      handleMultipleUpdate={handleMultipleUpdate}
      saveStudy={saveStudy}
    />
  );
}
