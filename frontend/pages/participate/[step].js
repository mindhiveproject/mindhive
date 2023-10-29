import { useRouter } from "next/router";

import Site from "../../components/Global/Site";
import StudyLandingMain from "../../components/Studies/Landing/Main";
import GuestContext from "../../components/Global/GuestContext";

export default function StudyLandingPage() {
  const router = useRouter();
  return (
    <Site>
      <GuestContext query={router.query}>
        <StudyLandingMain query={router.query} isRun />
      </GuestContext>
    </Site>
  );
}
