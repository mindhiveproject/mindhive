import { useContext } from "react";
import { useRouter } from "next/router";

import { UserContext } from "../Global/Authorized";
import AddComponent from "./Component/Add";
import EditComponent from "./Component/Edit";
import StudyBuilder from "./Study/Main";
import CloneTask from "./Component/Clone";
import NewStudy from "./Study/New/Main";

// projects
import StartProject from "./Project/New/Start";
import ProjectBuilder from "./Project/Main";

export default function BuilderRouter({ query }) {
  const router = useRouter();

  const user = useContext(UserContext);
  const { area, selector } = query;

  const redirect = ({ area }) => {
    router.push({
      pathname: `/dashboard/develop/${area}`,
    });
  };

  if (area === "cloneofstudy" && selector) {
    return <StudyBuilder query={query} user={user} />;
  }

  if (area === "projects") {
    if (selector === "start") {
      return <StartProject query={query} user={user} />;
    }
    return <ProjectBuilder query={query} user={user} />;
  }

  if (area === "studies") {
    if (selector === "add") {
      return <NewStudy query={query} user={user} />;
    }
    return <StudyBuilder query={query} user={user} />;
  }

  if (["cloneoftask", "cloneofsurvey", "cloneofblock"].includes(area)) {
    return (
      <CloneTask
        query={query}
        user={user}
        taskSlug={selector}
        redirect={redirect}
      />
    );
  }

  if (["tasks", "surveys", "blocks"].includes(area)) {
    if (selector === "add") {
      return <AddComponent query={query} user={user} redirect={redirect} />;
    }
    if (selector === "addexternal") {
      return (
        <AddComponent
          query={query}
          user={user}
          redirect={redirect}
          isExternal={true}
        />
      );
    }
    return (
      <EditComponent
        query={query}
        user={user}
        taskId={selector}
        redirect={redirect}
      />
    );
  }

  return (
    <div>
      <p>area {area}</p>
      <p>selector {selector}</p>
    </div>
  );
}
