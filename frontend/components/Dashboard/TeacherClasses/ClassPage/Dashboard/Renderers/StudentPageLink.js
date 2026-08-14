import Button from "../../../../../DesignSystem/Button";

export const StudentPageLink = (props) => {
  const openInNewTab = () => {
    window.open(
      `/dashboard/${props.baseUrl}/${props.data?.publicId}`,
      "_blank"
    );
  };

  return (
    <Button
      variant="text"
      onClick={openInNewTab}
      style={{
        height: 32,
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 8,
        paddingRight: 8,
        fontWeight: 500,
        color: "var(--color-text-primary)",
      }}
    >
      {props.value}
    </Button>
  );
};
