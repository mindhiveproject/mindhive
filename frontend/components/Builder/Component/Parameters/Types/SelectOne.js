export default function SelectOne({ name, options, value, onChange }) {
  const optionsArray = options.split("\n");

  const packTheObject = (value) => ({
    target: {
      name,
      type: "select",
      value,
    },
  });

  const handleChange = (value) => {
    onChange(packTheObject(value));
  };

  return (
    <div>
      {optionsArray.map((option, number) => (
        <div
          key={number}
          className={option === value ? "selected optionLine" : "optionLine"}
          id={number}
          name={number}
          onClick={() => handleChange(option)}
        >
          {option}
        </div>
      ))}
    </div>
  );
}
