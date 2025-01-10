export const StudentPageLink = (props) => {
  const openInNewTab = () => {
    window.open(
      `/dashboard/${props.baseUrl}/${props.data?.publicId}`,
      "_blank"
    );
  };

  return (
    <button onClick={openInNewTab} className="ag-cell-button">
      {props.value}
    </button>
  );
};
