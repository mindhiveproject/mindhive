export default function Database({ data }) {
  return (
    <div className="database">
      {data.map((task) => (
        <div className="task">
          <h2>{task?.title}</h2>
          {task?.variables.map((variable) => (
            <div className="variable"># {variable}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
