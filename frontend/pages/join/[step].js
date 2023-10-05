import { useRouter } from "next/router";

import Site from "../../components/Global/Site";
import JoinStudyMain from "../../components/Studies/Join/Main";

export default function StudyLandingPage() {
  const router = useRouter();
  return (
    <Site>
      <JoinStudyMain {...router.query} />
    </Site>
  );
}
