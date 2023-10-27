import { useQuery } from "@apollo/client";
import { GET_HOMEWORK } from "../../../Queries/Homework";
import JoditEditor from "../../../Jodit/Editor";

export default function HomeworkPage({ code, query, user, profile }) {
  const { data, loading, error } = useQuery(GET_HOMEWORK, {
    variables: {
      code: code,
    },
  });

  const homework = data?.homework || {};

  return (
    <div>
      <h2>{homework?.title}</h2>
      <JoditEditor content={homework?.content} setContent={() => {}} readonly />
    </div>
  );
}
