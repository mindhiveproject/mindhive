import { useMutation } from "@apollo/client";
import { customAlphabet } from "nanoid";

import { UPDATE_DATASOURCE } from "../../../../../../Mutations/Datasource";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

/**
 * Hook that returns a `save` function persisting the modified dataset
 * (variables, settings, and data) to the file system + Datasource record,
 * and a `saving` boolean while the mutation is in flight.
 *
 * Pass an `onSaved` callback (e.g. a parent query's `refetch`) to refresh the
 * dataset list once the mutation resolves so derived metadata like
 * `updatedAt` propagates back to consumers.
 */
export function useDatasetSave({ dataset, content, onSaved }) {
  const [updateDatasource, { loading }] = useMutation(UPDATE_DATASOURCE);

  const save = async () => {
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
      year = address.year;
      month = address.month;
      day = address.day;
      token = address.token;
    } else {
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
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (res?.ok) {
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
                address: { year, month, day, token },
                metadata,
              },
            },
          },
        },
      });
      if (typeof onSaved === "function") {
        await onSaved();
      }
      alert("The data has been updated");
    } else {
      alert(`There was an error: ${res?.statusText}`);
    }
  };

  return { save, saving: loading };
}
