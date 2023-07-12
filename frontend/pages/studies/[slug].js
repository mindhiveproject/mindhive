import { useRouter } from "next/router";

import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import StudyLandingMain from "../../components/Studies/Landing/Main";

export default function StudyLandingPage() {
  const router = useRouter();
  return (
    <Site>
      <Page>
        <StudyLandingMain {...router.query} />
      </Page>
    </Site>
  );
}
