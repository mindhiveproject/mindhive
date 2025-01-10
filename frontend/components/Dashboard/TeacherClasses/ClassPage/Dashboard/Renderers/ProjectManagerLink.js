import ProjectManager from "../Modals/ProjectManager";

export const ProjectManagerLink = (props) => {
  const openInNewTab = () => {
    window.open(
      `/builder/projects?selector=${props.data?.projectId}`,
      "_blank"
    );
  };

  if (!props?.value) {
    return <ProjectManager props={props} />;
  }

  return (
    <button onClick={openInNewTab} className="ag-cell-button">
      {props.value}
    </button>
  );
};
