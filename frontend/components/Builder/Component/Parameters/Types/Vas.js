import useTranslation from "next-translate/useTranslation";

export default function Vas({ name, statements, onChange }) {
  const { t } = useTranslation("builder");
  const statementsArray = statements.split("\n");

  const packTheObject = (value) => ({
    target: {
      name: name,
      type: "vas",
      value,
    },
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    const updatedStatements = statements.split("\n").map((item, j) => {
      if (j == id) {
        return value;
      }
      return item;
    });
    const updated = updatedStatements.join("\n");
    onChange(packTheObject(updated));
  };

  const addStatement = (e) => {
    e.preventDefault();
    const updated = statements.concat("\n");
    onChange(packTheObject(updated));
  };

  const deleteStatement = (e, id) => {
    e.preventDefault();
    const updatedStatements = statements.split("\n").filter((item, j) => {
      if (j == id) {
        return false;
      }
      return true;
    });
    const updated = updatedStatements.join("\n");
    onChange(packTheObject(updated));
  };

  return (
    <div>
      {statementsArray.map((statement, number) => (
        <div className="statementLine" key={number}>
          <div className="input">
            <input
              type="text"
              id={number}
              name={number}
              value={statement}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <button onClick={(e) => deleteStatement(e, number)}>&times;</button>
          </div>
        </div>
      ))}
      <button onClick={addStatement}>{t("vas.addMore", "Add more")}</button>
    </div>
  );
}
