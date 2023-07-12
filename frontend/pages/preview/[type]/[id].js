import Labjs from "../../../components/Global/Labjs";

import TaskPreview from "../../../components/Tasks/Preview/Main";

export default function DashboardPage({ query }) {
  const { id, type } = query;

  return (
    <Labjs>
      <TaskPreview id={id} type={type} />
    </Labjs>
  );
}
