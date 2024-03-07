import { ADD_VIZPART } from "../../../../../Mutations/VizPart";
import { STUDY_VIZJOURNAL } from "../../../../../Queries/VizJournal";

import Papa from "papaparse";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import { useMutation } from "@apollo/client";

import { DropdownItem } from "semantic-ui-react";

export default function CreatePart({ studyId, journal, dataOrigin }) {
  const [createPart, { data, loading, error }] = useMutation(ADD_VIZPART, {
    refetchQueries: [{ query: STUDY_VIZJOURNAL, variables: { id: studyId } }],
  });

  const addPart = () => {
    createPart({
      variables: {
        input: {
          title: "Unnamed part",
          dataOrigin: "STUDY",
          vizChapters: {
            create: [{ title: "Unnamed chapter", description: "Description" }],
          },
          vizJournal: {
            connect: {
              id: journal?.id,
            },
          },
        },
      },
    });
  };

  // convert csv file to json with promise
  const toJson = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete(results, file) {
          resolve(results.data);
        },
        error(err, file) {
          reject(err);
        },
      });
    });
  };

  // helper function to get all column names of the given dataset
  const getColumnNames = ({ data }) => {
    const allKeys = data
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys)).sort();
    return keys;
  };

  const handleDataUpload = async (e) => {
    const form = e.currentTarget;
    const [file] = await form.files;

    let data;
    if (file.type === "application/json") {
      const text = await file.text();
      data = JSON.parse(text);
    } else {
      data = await toJson(file);
    }
    const variables = getColumnNames({ data });

    const metadata = {
      id: nanoid(),
      payload: "upload",
      timestampUploaded: Date.now(),
      variables: variables,
    };
    const dataFile = {
      metadata,
      data: data,
    };

    // get the current date for data saving
    const curDate = new Date();
    const date = {
      year: parseInt(curDate.getFullYear()),
      month: parseInt(curDate.getMonth()) + 1,
      day: parseInt(curDate.getDate()),
    };
    // save the file in the system
    const res = await fetch(
      `/api/save/?y=${date.year}&m=${date.month}&d=${date.day}`,
      {
        method: "POST",
        body: JSON.stringify(dataFile),
        headers: {
          Accept: "application/json", // eslint-disable-line quote-props
          "Content-Type": "application/json",
        },
      }
    );

    const fileAddress = {
      ...date,
      token: metadata?.id,
    };

    // call mutation with uploaded data
    createPart({
      variables: {
        input: {
          title: "Unnamed part",
          dataOrigin: "UPLOADED",
          content: {
            uploaded: {
              address: fileAddress,
              metadata,
            },
          },
          vizChapters: {
            create: [{ title: "Unnamed chapter", description: "Description" }],
          },
          vizJournal: {
            connect: {
              id: journal?.id,
            },
          },
        },
      },
    });
  };

  if (dataOrigin === "STUDY") {
    return (
      <DropdownItem>
        <div className="menuItem" onClick={() => addPart()}>
          <img src={`/assets/icons/visualize/content_paste_go.svg`} />
          <div>Use study data</div>
        </div>
      </DropdownItem>
    );
  }

  if (dataOrigin === "UPLOADED") {
    return (
      <DropdownItem>
        <label htmlFor="fileUpload">
          <input
            type="file"
            id="fileUpload"
            style={{ display: "none" }}
            onChange={handleDataUpload}
          />
          <div className="menuItem">
            <img src={`/assets/icons/visualize/draft.svg`} />
            <div>Upload own data</div>
          </div>
        </label>
      </DropdownItem>
    );
  }
}
