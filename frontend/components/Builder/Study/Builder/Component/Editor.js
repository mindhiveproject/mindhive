import EditComponent from "../../../Component/Edit";

export default function Editor({ user, taskId, close }) {
  return <EditComponent user={user} taskId={taskId} close={close} />;
}
