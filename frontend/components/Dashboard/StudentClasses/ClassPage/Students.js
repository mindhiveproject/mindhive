import useTranslation from "next-translate/useTranslation";

export default function ClassStudents({ myclass, user, query }) {
  // const { t } = useTranslation("classes");
  // const students = myclass?.students || [];

  return (
    <>
      {/* revoking access to this tab to students */}
    </>
    // <div className="students">
    //   <div className="listHeader">
    //     <div></div>
    //     <div>{t("studentUsername")}</div>
    //     <div>{t("emailAddress")}</div>
    //   </div>
    //   {students.map((student, i) => {
    //     return (
    //       <div key={i} className="listRow" style={{ cursor: "pointer" }}>
    //         <div>{student.username}</div>
    //         <div>{student?.email}</div>
    //       </div>
    //     );
    //   })}
    // </div>
  );
}
