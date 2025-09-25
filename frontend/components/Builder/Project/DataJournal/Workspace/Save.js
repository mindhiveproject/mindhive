// should save the state of the workspace
// layout (json)

// every widget (VizSection) is saved independently (inside of the Component)
// widget can take care of saving the connection to the workspace
// widgets (connections to VizSection)

import { useMutation } from "@apollo/client";
import { UPDATE_WORKSPACE } from "../../../../Mutations/DataWorkspace";

export default function SaveWorkspace({ workspace }) {
  const [updateWorkspace, { data, loading, error }] = useMutation(
    UPDATE_WORKSPACE,
    {
      variables: {
        id: workspace?.id,
        input: {
          layout: workspace?.layout,
        },
      },
      refetchQueries: [],
    }
  );

  return <button onClick={() => updateWorkspace()}>Save</button>;
}
