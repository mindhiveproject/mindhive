import Link from "next/link";

import Classes from "./Classes/Main";
import Networks from "./Networks/Main";
import BlockDocumentation from "./BlockDocumentation/Main";

import StyledManagement from "../../styles/StyledManagement";
import TemplateAssignments from "./Assignments/Main";

import Users from "./Users/Main";

export default function ManagementMain({ query, user }) {
  const selector = query?.selector || "classes";

  return (
    <StyledManagement>
      <div>
        <h1>Management</h1>
        <div>
          <p>
            All classes, class networks, assignments, and block documentation on
            the platform MindHive.
          </p>
        </div>

        <div className="header">
          <div className="menu">
            <div>
              <Link href="/dashboard/management/classes">
                <div
                  className={
                    selector === "classes"
                      ? "menuTitle selectedMenuTitle"
                      : "menuTitle"
                  }
                >
                  <p>Classes</p>
                </div>
              </Link>
            </div>

            <div>
              <Link href="/dashboard/management/networks">
                <div
                  className={
                    selector === "networks"
                      ? "menuTitle selectedMenuTitle"
                      : "menuTitle"
                  }
                >
                  <p>Networks</p>
                </div>
              </Link>
            </div>

            <div>
              <Link href="/dashboard/management/assignments">
                <div
                  className={
                    selector === "assignments"
                      ? "menuTitle selectedMenuTitle"
                      : "menuTitle"
                  }
                >
                  <p>Assignments</p>
                </div>
              </Link>
            </div>

            <div>
              <Link href="/dashboard/management/users">
                <div
                  className={
                    selector === "users"
                      ? "menuTitle selectedMenuTitle"
                      : "menuTitle"
                  }
                >
                  <p>Users</p>
                </div>
              </Link>
            </div>

            <div>
              <Link href="/dashboard/management/blockdocumentation">
                <div
                  className={
                    selector === "blockdocumentation"
                      ? "menuTitle selectedMenuTitle"
                      : "menuTitle"
                  }
                >
                  <p>Block Doc</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {selector === "classes" && <Classes query={query} user={user} />}
      {selector === "networks" && <Networks query={query} user={user} />}
      {selector === "assignments" && (
        <TemplateAssignments query={query} user={user} />
      )}
      {selector === "users" && <Users query={query} user={user} />}
      {selector === "blockdocumentation" && (
        <BlockDocumentation query={query} user={user} />
      )}
    </StyledManagement>
  );
}
