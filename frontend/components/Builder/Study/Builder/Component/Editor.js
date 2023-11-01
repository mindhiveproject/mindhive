import EditComponent from "./Edit";

export default function Editor({
  user,
  isAuthor,
  createCopy,
  task,
  updateCanvas,
  close,
}) {
  return (
    <EditComponent
      user={user}
      isAuthor={isAuthor}
      createCopy={createCopy}
      task={task}
      updateCanvas={updateCanvas}
      close={close}
    />
  );
}
