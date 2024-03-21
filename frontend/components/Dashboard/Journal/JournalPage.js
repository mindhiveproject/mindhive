import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import CreatePost from "./Post/Create";

import { GET_JOURNAL } from "../../Queries/Journal";
import JournalPosts from "./Post/Posts";
import EditPost from "./Post/Edit";

export default function JournalPage({ code, user, query }) {
  const { action, area, post, selector, index } = query;

  const { data, loading, error } = useQuery(GET_JOURNAL, {
    variables: { code },
  });

  const journal = data?.journal || { title: "", description: "" };
  const posts = journal?.posts || [];

  if (action === "edit" && post) {
    return (
      <EditPost
        code={code}
        journal={journal}
        user={user}
        postId={post}
        index={index}
      />
    );
  }

  return (
    <div>
      <h1>{journal?.title}</h1>
      <CreatePost journal={journal} user={user}>
        <button>Add note</button>
      </CreatePost>
      <h2>Notes</h2>
      <JournalPosts
        code={code}
        journalId={journal?.id}
        posts={posts}
        index={index}
      />
    </div>
  );
}
