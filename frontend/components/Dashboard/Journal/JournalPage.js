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

  // check whether the user is a journal author
  const isCreator = user?.id === journal?.creator?.id;
  // check whether the user is a teacher or a mentor of the class of the journal author
  const isTeacher =
    user?.teacherIn
      .map((cl) => cl?.id)
      .filter((id) => journal?.creator?.studentIn.map((cl) => cl?.id)).length >
    0;
  const isMentor =
    user?.mentorIn
      .map((cl) => cl?.id)
      .filter((id) => journal?.creator?.studentIn.map((cl) => cl?.id)).length >
    0;
  // check whether the user is an admin
  const isAdmin = user?.permissions?.map((p) => p?.name).includes("ADMIN");

  // do not show the journal, if the user is not one of those
  if (!(isCreator || isTeacher || isMentor || isAdmin)) {
    return <div></div>;
  }

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
