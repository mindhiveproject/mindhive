import Link from "next/link";
import AddUpdate from "./AddUpdate";
import EditTag from "./EditTag";

import UpdatesList from "./UpdatesList";

import { StyledTag } from "../../styles/StyledTag";

export default function UpdatesMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <StyledTag>
        <h1>Notifications and updates</h1>
        <Link href="/dashboard/updates/add">
          <button>Create update</button>
        </Link>
        <UpdatesList query={query} user={user} />
      </StyledTag>
    );
  }
  if (selector === "add") {
    return <AddUpdate user={user} />;
  }
  return <EditTag selector={selector} user={user} query={query} />;
}
