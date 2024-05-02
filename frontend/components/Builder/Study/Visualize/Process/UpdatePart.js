import { useMutation } from "@apollo/client";
import { UPDATE_VIZPART } from "../../../../Mutations/VizPart";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import { Icon } from "semantic-ui-react";

export default function UpdatePartContent({ part, content }) {
  const update = async () => {
    let year, month, day, token;

    const address =
      part?.content?.[part?.content?.isModified ? "modified" : "uploaded"]
        ?.address;

    if (
      address &&
      address?.year &&
      address?.month &&
      address?.day &&
      address?.token
    ) {
      year = address?.year;
      month = address?.month;
      day = address?.day;
      token = address?.token;
    } else {
      // if there is no address, create an address in the file system
      const curDate = new Date();
      year = parseInt(curDate.getFullYear());
      month = parseInt(curDate.getMonth()) + 1;
      day = parseInt(curDate.getDate());
      token = nanoid();
    }

    const metadata = {
      id: token,
      payload: "modified",
      timestampUploaded: Date.now(),
    };

    const dataFile = {
      metadata: {
        ...metadata,
        variables: content?.modified?.variables,
      },
      data: content?.modified?.data,
    };

    const res = await fetch(`/api/save/?y=${year}&m=${month}&d=${day}`, {
      method: "POST",
      body: JSON.stringify(dataFile),
      headers: {
        Accept: "application/json", // eslint-disable-line quote-props
        "Content-Type": "application/json",
      },
    });

    if (res?.ok) {
      // update the information about the type of saved data
      const prevContent = part?.content || {};
      await updatePart({
        variables: {
          id: part?.id,
          input: {
            content: {
              ...prevContent,
              isModified: true,
              modified: {
                address: {
                  year,
                  month,
                  day,
                  token,
                },
                metadata,
              },
            },
          },
        },
      });
      alert("The data has been updated");
    } else {
      alert(`There was an error: ${res?.statusText}`);
    }
  };

  const [updatePart, { data, loading, error }] = useMutation(UPDATE_VIZPART);

  return (
    <Icon
      name="save outline"
      size="large"
      color="red"
      onClick={() => update()}
    />
  );
}
