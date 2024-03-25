export default function Variable({ column, onColumnChange }) {
  return (
    <div className="variable">
      <div># {column?.field}</div>
      <div>
        <input
          type="checkbox"
          id={column?.field}
          name={"hide"}
          checked={!column?.hide}
          onChange={onColumnChange}
        />
      </div>
    </div>
  );
}
