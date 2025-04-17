import StudyManager from "../Modals/StudyManager";

export const StudyManagerLink = (props) => {
  const openInNewTab = () => {
    window.open(
      `/builder/studies?selector=${props.data?.studyId}&tab=builder`,
      "_blank"
    );
  };

  if (props && !props?.value) {
    return <StudyManager {...props} />;
  }

  return (
    <button onClick={openInNewTab} className="ag-cell-button">
      {props.value}
    </button>
  );
};
