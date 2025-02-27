import StudyManager from "../Modals/StudyManager";

export const StudyManagerLink = (props) => {
  const openInNewTab = () => {
    window.open(
      `/builder/projects?selector=${props.data?.projectId}&tab=builder`,
      "_blank"
    );
  };

  if (props && !props?.value) {
    if (props?.data?.project) {
      return <StudyManager {...props} />;
    } else {
      return <span>Create a project first</span>;
    }
  }

  return (
    <button onClick={openInNewTab} className="ag-cell-button">
      {props.value}
    </button>
  );
};
