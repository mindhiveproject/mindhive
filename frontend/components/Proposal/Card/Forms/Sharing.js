import { Dropdown } from "semantic-ui-react";

export default function CardType({ type, handleChange }) {
  const options = [
    { key: "collective", text: "Collective", value: "COLLECTIVE" },
    { key: "individual", text: "Individual", value: "INDIVIDUAL" },
  ];

  return (
    <Dropdown
      placeholder="Select type"
      fluid
      selection
      options={options}
      onChange={(e, data) => {
        handleChange({ target: { name: "shareType", value: data?.value } });
      }}
      value={type}
    />
  );
}
