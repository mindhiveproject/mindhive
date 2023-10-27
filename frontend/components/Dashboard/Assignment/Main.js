import { useQuery } from "@apollo/client";
import { GET_ASSIGNMENT_FOR_STUDENT } from "../../Queries/Assignment";
import { GET_MY_HOMEWORK_FOR_ASSIGNMENT } from "../../Queries/Homework";
import ReactHtmlParser from "react-html-parser";

import NewHomework from "./New";
import HomeworkTab from "./Tab";
import StyledClass from "../../styles/StyledClass";

export default function AssignmentMain({ query, user }) {
  const { selector } = query;

  const { data, loading, error } = useQuery(GET_ASSIGNMENT_FOR_STUDENT, {
    variables: { code: selector },
  });

  const assignment = data?.assignment || {};

  const { data: homeworkData } = useQuery(GET_MY_HOMEWORK_FOR_ASSIGNMENT, {
    variables: { userId: user?.id, assignmentCode: selector },
  });

  const homeworks = homeworkData?.homeworks || [];

  return (
    <StyledClass>
      <h1>{assignment?.title}</h1>
      <div className="content">{ReactHtmlParser(assignment?.content)}</div>
      <h3>My homework</h3>
      <NewHomework user={user} assignment={assignment}>
        <div>
          <button>New homework</button>
        </div>
      </NewHomework>
      <div className="assignments">
        {homeworks.map((homework) => (
          <HomeworkTab
            key={homework?.id}
            assignment={assignment}
            homework={homework}
            user={user}
          />
        ))}
      </div>
    </StyledClass>
  );
}
