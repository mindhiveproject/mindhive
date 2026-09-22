import EditComponent from "./Edit";

export default function Editor({
  user,
  isAuthor,
  createCopy,
  task,
  updateCanvas,
  persistStudy,
  close,
  openPreview,
}) {
  return (
    <EditComponent
      user={user}
      isAuthor={isAuthor}
      createCopy={createCopy}
      task={task}
      updateCanvas={updateCanvas}
      persistStudy={persistStudy}
      close={close}
      openPreview={openPreview}
    />
  );
}
