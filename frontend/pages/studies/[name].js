import { useRouter } from "next/router";

import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import StudyLandingMain from "../../components/Studies/Landing/Main";
import GuestContext from "../../components/Global/GuestContext";

export default function StudyLandingPage() {
  const router = useRouter();
  return (
    <Site>
      <Page>
        <GuestContext query={router.query}>
          <StudyLandingMain query={router.query} />
        </GuestContext>
      </Page>
    </Site>
  );
}
