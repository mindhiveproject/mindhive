import { useQuery } from "@apollo/client";
import { GET_USER_STUDIES } from "../../Queries/User";

// idea: have one landing page to run the study
// the function should check what is the status of the user (new, ongoing)
// and assign correct task to show
export default function RunStudy({ user, study }) {
  const { data: userData } = useQuery(GET_USER_STUDIES);

  //   console.log({ user });
  //   console.log({ study });
  //   console.log({ userData });

  const { flow } = study;
  const studyInfo = userData?.authenticatedItem?.studiesInfo[study?.id];

  console.log({ flow });
  console.log({ studyInfo });

  return <div>Study</div>;
}
