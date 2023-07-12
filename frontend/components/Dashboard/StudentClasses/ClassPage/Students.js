export default function ClassStudents({ myclass, user, query }) {
  const students = myclass?.students || [];

  return (
    <div className="students">
      <div className="listHeader">
        <div></div>
        <div>Student/Username</div>
        <div>Email address</div>
      </div>
      {students.map((student, i) => {
        return (
          <div key={i} className="listRow" style={{ cursor: "pointer" }}>
            <div>{student.username}</div>
            <div>{student?.email}</div>
          </div>
        );
      })}
    </div>
  );
}
