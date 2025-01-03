import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import ReactHtmlParser from "react-html-parser";

import { GET_RESOURCE } from "../../Queries/Resource";

export default function ViewResource({ selector, query, user }) {
  const router = useRouter();
  const [content, setContent] = useState("");

  const { id } = query;
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};

  return (
    <div>
      <h1>{resource?.title}</h1>
      <p>{resource?.description}</p>
      <div>{ReactHtmlParser(resource?.content?.main)}</div>
    </div>
  );
}
