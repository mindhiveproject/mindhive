import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

import EditAssignment from "./Edit";

import { GET_ASSIGNMENT } from "../../../../Queries/Assignment";
import HomeworkMain from "./Homework/Main";

export default function ViewAssignment({ code, myclass, user, query }) {
  const { t } = useTranslation("classes");
  const { data, loading, error } = useQuery(GET_ASSIGNMENT, {
    variables: { code },
  });
  const assignment = data?.assignment || {
    title: "",
    content: "",
    homework: [],
  };

  return (
    <div className="assignmentPage">
      <EditAssignment assignment={assignment} myclass={myclass} />
      <div className="assignmentContent">
        <div className="header">
          <h2>{assignment?.title}</h2>
        </div>
        <div className="content">
          <h2>Student Instruction</h2>
          {ReactHtmlParser(assignment?.content)}
        </div>
        <div className="content">
          <h2>Placeholder for student answer box</h2>
          {ReactHtmlParser(assignment?.placeholder)}
        </div>
      </div>

      {assignment?.homework?.length > 0 && (
        <div className="homework">
          <h2>{t("assignment.homeworkHeader")}</h2>
          <HomeworkMain
            code={code}
            myclass={myclass}
            user={user}
            query={query}
            homeworks={assignment?.homework}
          />
        </div>
      )}
    </div>
  );
}
