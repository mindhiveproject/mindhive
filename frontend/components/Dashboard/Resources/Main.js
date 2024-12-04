import Link from "next/link";
import AddResource from "./AddResource";
import EditResource from "./EditResource";

import ResourcesList from "./ResourcesList";

export default function ResourcesMain({ query, user }) {
  const { selector } = query;

  if (!selector) {
    return (
      <>
        <h1>My resources</h1>
        <Link href="/dashboard/resources/add">
          <button>Add resource</button>
        </Link>
        <ResourcesList query={query} user={user} />
      </>
    );
  }
  if (selector === "add") {
    return <AddResource user={user} />;
  }
  return <EditResource selector={selector} user={user} query={query} />;
}
