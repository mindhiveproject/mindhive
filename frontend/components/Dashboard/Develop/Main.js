import Link from "next/link";

import Selector from "./DevelopNew/Selector";
import Panels from "./Panels";

import { StyledSelector } from "../../styles/StyledSelector";
import { StyledDashboardContent } from "../../styles/StyledDashboard";

export default function DevelopMain({ query, user }) {
  const { selector } = query;

  // if (!selector) {
  //   return (
  //     <div>
  //       <h1>Bank</h1>
  //       <Link href="/dashboard/develop/new">
  //         <button>Develop new</button>
  //       </Link>
  //       <div>Bank is here</div>
  //       <Panels user={user} />
  //     </div>
  //   );
  // }

  if (selector === "new") {
    return (
      <StyledSelector>
        <Selector query={query} user={user} />
      </StyledSelector>
    );
  }

  // if (selector === "task") {
  //   return <div>Add a new task from lab.js</div>;
  // }

  return (
    <>
      <h1>Develop</h1>
      <div className="header">
        <div>
          <p>
            All studies, tasks or surveys you have{" "}
            <strong>developed or are collaborating on</strong>.
          </p>
        </div>
        <div>
          <Link href="/dashboard/develop/new">
            <button>Develop new</button>
          </Link>
        </div>
      </div>
      <Panels query={query} user={user} />
    </>
  );
}
