import Link from "next/link";
import AddResource from "./AddResource";
import ViewResource from "./ViewResource";
import CopyResource from "./CopyResource";
import EditResource from "./EditResource";

import MyResourcesList from "./MyResourcesList";
import PublicResourcesList from "./PublicResourcesList";

import StyledResource from "../../styles/StyledResource";

export default function ResourcesMain({ query, user }) {
  const { selector } = query;

  return (
    <StyledResource>
      <h1>Recources center</h1>
      <div className="header">
        <div className="menu">
          <Link href="/dashboard/resources">
            <div
              className={
                !selector ? "menuTitle selectedMenuTitle" : "menuTitle"
              }
            >
              <p>My resources</p>
            </div>
          </Link>

          <Link href="/dashboard/resources/public">
            <div
              className={
                selector === "public"
                  ? "menuTitle selectedMenuTitle"
                  : "menuTitle"
              }
            >
              <p>Public resources</p>
            </div>
          </Link>
        </div>
        {!selector && (
          <Link href="/dashboard/resources/add">
            <button>Add resource</button>
          </Link>
        )}
      </div>
      {!selector && (
        <>
          <h1>My resources</h1>
          <p>
            You can create your own resources or edit existing ones. To see the
            list of public resources, click on the public resources link in the
            menu above.
          </p>
          <MyResourcesList query={query} user={user} />
        </>
      )}
      {selector === "add" && <AddResource user={user} />}
      {selector === "public" && (
        <>
          <h1>Public resources</h1>
          <p>You can explore, use, or copy & edit public resources.</p>
          <PublicResourcesList query={query} user={user} />
        </>
      )}
      {selector === "view" && <ViewResource user={user} query={query} />}
      {selector === "copy" && <CopyResource user={user} query={query} />}
      {selector &&
        selector !== "add" &&
        selector !== "public" &&
        selector !== "copy" &&
        selector !== "view" && (
          <EditResource selector={selector} user={user} query={query} />
        )}
    </StyledResource>
  );
}
