import { useMutation } from "@apollo/client";
import { UPDATE_VIZPART } from "../../../../Mutations/VizPart";

import { Icon } from "semantic-ui-react";

export default function UpdatePartContent({ part, content }) {
  const update = async () => {
    const prevContent = part?.content || {};
    await updatePart({
      variables: {
        id: part?.id,
        input: {
          content: {
            ...prevContent,
            ...content,
          },
        },
      },
    });
    alert("The data has been updated");
  };
  const [updatePart, { data, loading, error }] = useMutation(UPDATE_VIZPART);

  return <Icon 
  name="save outline" 
  size="large" 
  color="red" 
  onClick={() => update()} />;
}
