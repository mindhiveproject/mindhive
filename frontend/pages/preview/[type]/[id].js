import Labjs from "../../../components/Global/Labjs";

import TaskPreview from "../../../components/Tasks/Preview/Main";
import VisualViewer from "../../../components/Visuals/Viewer/Main";

export default function DashboardPage({ query }) {
  const { id, type } = query;

  // A visual is participated in, not previewed as a task — it has its own
  // sandbox / authored behaviour and never runs through lab.js.
  if (type === "visual") {
    return <VisualViewer id={id} />;
  }

  return (
    <Labjs>
      <TaskPreview id={id} type={type} />
    </Labjs>
  );
}
