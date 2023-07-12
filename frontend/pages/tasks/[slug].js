import { useRouter } from "next/router";

import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import TaskLandingMain from "../../components/Tasks/Landing/Main";

export default function StudyLandingPage() {
  const router = useRouter();
  return (
    <Site>
      <Page>
        <TaskLandingMain {...router.query} />
      </Page>
    </Site>
  );
}
