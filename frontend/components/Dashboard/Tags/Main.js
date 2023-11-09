import Link from "next/link";
import AddTag from "./AddTag";
import EditTag from "./EditTag";

import TagsList from "./TagsList";

import { StyledTag } from "../../styles/StyledTag";

export default function TagsMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <StyledTag>
        <h1>My tags</h1>
        <Link href="/dashboard/tags/add">
          <button>Create tag</button>
        </Link>
        <TagsList query={query} user={user} />
      </StyledTag>
    );
  }
  if (selector === "add") {
    return <AddTag user={user} />;
  }
  return <EditTag selector={selector} user={user} query={query} />;
}
