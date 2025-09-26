import { useMutation } from "@apollo/client";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import { UPDATE_DATASOURCE } from "../../../../../../Mutations/Datasource";

export default function UpdateDatasource({ dataset, content }) {
  const update = async () => {
    let year, month, day, token;

    const address =
      dataset?.content?.[dataset?.content?.isModified ? "modified" : "uploaded"]
        ?.address;

    const isTemplateData =
      dataset?.dataOrigin === "TEMPLATE" &&
      !dataset?.content?.isTemplateModified;

    if (
      address &&
      address?.year &&
      address?.month &&
      address?.day &&
      address?.token &&
      !isTemplateData
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
        settings: content?.modified?.settings,
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
      const prevContent = dataset?.content || {};
      await updateDatasource({
        variables: {
          id: dataset?.id,
          data: {
            content: {
              ...prevContent,
              isModified: true,
              isTemplateModified: dataset?.dataOrigin === "TEMPLATE",
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

  const [updateDatasource, { data, loading, error }] =
    useMutation(UPDATE_DATASOURCE);

  return (
    <div
      className="dataButtonPart menuButtonThin redSaveFrame"
      onClick={update}
    >
      <div>
        <img src="/assets/icons/visualize/save.svg" alt="Save" />
      </div>
      <div>
        <a>Save</a>
      </div>
    </div>
  );
}
