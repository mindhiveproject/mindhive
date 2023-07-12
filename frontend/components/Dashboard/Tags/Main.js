import Link from "next/link";
import AddTag from "./AddTag";
import EditTag from "./EditTag";

import TagsList from "./TagsList";

export default function TagsMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <>
        <h1>My tags</h1>
        <Link href="/dashboard/tags/add">
          <button>Create tag</button>
        </Link>
        <TagsList query={query} user={user} />
      </>
    );
  }
  if (selector === "add") {
    return <AddTag user={user} />;
  }
  return <EditTag selector={selector} user={user} query={query} />;
}
