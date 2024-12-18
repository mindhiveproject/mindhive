import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import { CREATE_STUDY } from "../../../Mutations/Study";
import { MY_STUDIES } from "../../../Queries/Study";

export default function CreateStudy({ study, user }) {
  const router = useRouter();

  const [
    createStudy,
    { data: studyData, loading: studyLoading, error: studyError },
  ] = useMutation(CREATE_STUDY, {
    variables: study,
    refetchQueries: [{ query: MY_STUDIES, variables: { id: user?.id } }],
  });

  const saveNewStudy = async () => {
    const study = await createStudy({
      variables: {
        collaborators: study?.collaborators.map((col) => ({ id: col?.id })),
        classes: study?.classes.map((cl) => ({ id: cl?.id })),
        consent: study?.consent.map((con) => ({ id: con?.id })),
      },
    });

    router.push({
      pathname: `/builder/studies/`,
      query: {
        selector: study?.data?.createStudy?.id,
      },
    });
  };

  return (
    <div>
      <button onClick={saveNewStudy}>Save</button>
    </div>
  );
}
