import Link from "next/link";

import Classes from "./Classes/Main";
import Networks from "./Networks/Main";

import StyledManagement from "../../styles/StyledManagement";

export default function ManagementMain({ query, user }) {
  const selector = query?.selector || "classes";

  return (
    <StyledManagement>
      <div>
        <h1>Management</h1>
        <div>
          <p>All classes and class networks on the platform MindHive.</p>
        </div>
        <div className="header">
          <div className="menu">
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

          <div className="menu">
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
        </div>
      </div>
      {selector === "classes" && <Classes query={query} user={user} />}
      {selector === "networks" && <Networks query={query} user={user} />}
    </StyledManagement>
  );
}
