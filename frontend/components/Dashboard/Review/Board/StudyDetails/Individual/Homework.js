import { useQuery } from "@apollo/client";

import { GET_HOMEWORK_BY_ID } from "../../../../../Queries/Homework";

import ReactHtmlParser from "react-html-parser";

export default function Homework({ card }) {
  const { title, studentId, homeworkId } = card;

  const { data, loading, error } = useQuery(GET_HOMEWORK_BY_ID, {
    variables: { id: homeworkId },
  });
  const homework = data?.homework || {};

  return (
    <>
      {ReactHtmlParser(title)}
      {ReactHtmlParser(homework?.content)}
    </>
  );
}
