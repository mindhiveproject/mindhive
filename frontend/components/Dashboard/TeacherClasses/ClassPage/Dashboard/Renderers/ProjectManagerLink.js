import ProjectManager from "../Modals/ProjectManager";

export const ProjectManagerLink = (props) => {
  return <ProjectManager {...props} />;
  // const openInNewTab = () => {
  //   window.open(
  //     `/builder/projects?selector=${props.data?.projectId}`,
  //     "_blank"
  //   );
  // };

  // if (props && !props?.value) {
  //   return <ProjectManager {...props} />;
  // }

  // return (
  //   <button onClick={openInNewTab} className="ag-cell-button">
  //     {props.value}
  //   </button>
  // );
};
