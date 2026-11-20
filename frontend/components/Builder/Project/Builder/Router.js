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
 * Which canvas to draw the study on while both exist. The React Flow canvas
 * is the default; ?canvas=storm opens the classic Storm canvas (the fallback
 * to give users who hit issues), and NEXT_PUBLIC_STUDY_CANVAS=storm switches
 * a whole deployment back. Both save the design in the same format, so a
 * study can be opened in either.
 */
export function isFlowCanvas(query) {
  if (query?.canvas === "storm") return false;
  if (query?.canvas === "flow") return true;
  return process.env.NEXT_PUBLIC_STUDY_CANVAS !== "storm";
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
