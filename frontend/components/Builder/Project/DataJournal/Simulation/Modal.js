import { Loader, Dimmer, Modal, DropdownItem } from "semantic-ui-react";
import { useMutation } from "@apollo/client";

import { ADD_VIZPART } from "../../../../Mutations/VizPart";
import { GET_VIZJOURNALS } from "../../../../Queries/VizJournal";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 7);

import simulateDataWithAI from "./Main";
import useForm from "../../../../../lib/useForm";

import { StyledInput } from "../../../../styles/StyledForm";
import { useState } from "react";

export default function PromptModal({
  projectId,
  studyId,
  journal,
  exampleDataset,
  exampleVariables,
}) {
  const [open, setOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const { inputs, handleChange } = useForm({
    hypothesisPrompt: "",
    sampleSize: 30,
  });

  const [createPart, { data, loading, error }] = useMutation(ADD_VIZPART, {
    refetchQueries: [
      {
        query: GET_VIZJOURNALS,
        variables: {
          where:
            projectId && studyId
              ? {
                  OR: [
                    { project: { id: { equals: projectId } } },
                    { study: { id: { equals: studyId } } },
                  ],
                }
              : projectId
              ? { project: { id: { equals: projectId } } }
              : studyId
              ? { study: { id: { equals: studyId } } }
              : null,
        },
      },
    ],
  });

  // helper function to get all column names of the given dataset
  const getColumnNames = ({ data }) => {
    const allKeys = data
      .map((line) => Object.keys(line))
      .reduce((a, b) => a.concat(b), []);
    const keys = Array.from(new Set(allKeys)).sort();
    return keys;
  };

  const simulateData = async (e) => {
    if (inputs.hypothesisPrompt === "") {
      return alert("Please describe your hypothesis");
    }
    if (inputs.sampleSize < 1 || inputs.sampleSize > 100) {
      return alert(
        "Please adjust the number of participants. It should be between 1 and 100."
      );
    }

    setSimulating(true);

    const data = await simulateDataWithAI({
      exampleDataset,
      exampleVariables,
      hypothesisPrompt: inputs?.hypothesisPrompt,
      sampleSize: inputs?.sampleSize,
    });

    // generate artificial data using AI assistant
    const variableNames = getColumnNames({ data });
    const variables = variableNames.map((variable) => ({
      field: variable,
      type: "general",
      editable: false,
    }));

    const metadata = {
      id: nanoid(),
      payload: "simulated",
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

    await createPart({
      variables: {
        input: {
          title: "Unnamed journal",
          dataOrigin: "SIMULATED",
          content: {
            uploaded: {
              address: fileAddress,
              metadata: {
                id: metadata?.id,
                payload: metadata?.payload,
                timestampUploaded: metadata?.timestampUploaded,
              },
            },
          },
          vizChapters: {
            create: [{ title: "Unnamed workspace", description: "Description" }],
          },
          vizJournal: {
            connect: {
              id: journal?.id,
            },
          },
        },
      },
    });

    setSimulating(false);
    setOpen(false);
  };

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={
        <DropdownItem>
          <div className="menuItem">
            <img src={`/assets/icons/visualize/content_paste_go.svg`} />
            <div>Simulate data</div>
          </div>
        </DropdownItem>
      }
      onFocus={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Modal.Header>Hypothesis Visualizer</Modal.Header>

      <Modal.Content>
        {simulating && (
          <Dimmer active>
            <Loader size="massive">
              Simulating data (can take up to 1 minute)
            </Loader>
          </Dimmer>
        )}

        <StyledInput>
          <label htmlFor="hypothesisPrompt">
            <h2>Please describe your hypothesis</h2>
            <input
              type="text"
              name="hypothesisPrompt"
              value={inputs.hypothesisPrompt}
              onChange={handleChange}
            />
          </label>
          <label htmlFor="sampleSize">
            <h2>How many participants should be simulated?</h2>
            <input
              type="number"
              min="10"
              max="100"
              name="sampleSize"
              value={inputs.sampleSize}
              onChange={handleChange}
            />
          </label>
        </StyledInput>
      </Modal.Content>

      <Modal.Actions>
        <button
          onClick={() => {
            simulateData({});
          }}
        >
          Simulate data
        </button>
      </Modal.Actions>
    </Modal>
  );
}
