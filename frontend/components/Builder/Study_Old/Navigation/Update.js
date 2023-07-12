import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import { UPDATE_STUDY } from "../../../Mutations/Study";
import { MY_STUDIES, MY_STUDY } from "../../../Queries/Study";

export default function UpdateStudy({ study, user, saveDiagramState }) {
  const router = useRouter();

  const [
    updateStudy,
    { data: studyData, loading: studyLoading, error: studyError },
  ] = useMutation(UPDATE_STUDY, {
    variables: study,
    refetchQueries: [
      { query: MY_STUDIES, variables: { id: user?.id } },
      { query: MY_STUDY, variables: { id: study?.id } },
    ],
  });

  const saveStudy = async () => {
    // saveDiagramState();
    await updateStudy({
      variables: {
        collaborators: study?.collaborators.map((col) => ({ id: col?.id })),
        classes: study?.classes.map((cl) => ({ id: cl?.id })),
        consent: study?.consent.map((con) => ({ id: con?.id })),
      },
    });
  };

  return (
    <div>
      <button onClick={saveStudy}>Update</button>
    </div>
  );
}
