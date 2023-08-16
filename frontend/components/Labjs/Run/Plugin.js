import { useState } from "react";

import styled from "styled-components";

export const StyledLogger = styled.div`
  display: grid;
  grid-gap: 5px;
  margin: 10px;
  padding: 20px;
  font-size: 20px;
  background: #454444;
  color: white;
  width: 400px;
  border-radius: 10px;
  position: absolute;
  z-index: 1;
  .buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 5px;
  }
  button {
    color: black;
  }
`;

export default function Plugin({ experiment, settings }) {
  const [intervalID, setIntervalID] = useState(undefined);
  const [data, setData] = useState(undefined);

  const saveData = ({ data }) => {
    if (experiment && experiment.options && experiment.options.datastore) {
      experiment.options.datastore.commit({ pluginData: data });
      //   experiment.options.datastore.commit(e.detail) // create a new line in the dataset
      //   experiment.options.datastore.set(e.detail) // create/replace the current line in the dataset
    }
  };

  const generateInput = () => {
    const randomNumber = parseInt(Math.random() * 1000);
    setData({
      data: { randomNumber, response: experiment?.state?.response },
    });
    saveData({ data: { randomNumber } });
  };

  const start = () => {
    if (experiment && !intervalID) {
      setIntervalID(setInterval(generateInput, 3000));
    }
  };

  const stop = () => {
    if (intervalID) {
      clearInterval(intervalID);
      setIntervalID(undefined);
    }
  };

  return (
    <StyledLogger>
      <div>Data: {data?.data?.randomNumber}</div>
      <div>Timestamp: {parseInt(experiment?.timer || "-")} ms.</div>
      <div>Last response: {data?.data?.response}</div>
      <div className="buttons">
        <button onClick={start}>Start</button>{" "}
        <button onClick={stop}>Stop</button>
      </div>
    </StyledLogger>
  );
}
