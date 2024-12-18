import { useState } from "react";
import { OutCustomPort } from "../Diagram/models/OutPortModel";

import uniqid from "uniqid";
import generate from "project-name-generator";

export default function Modal({
  user,
  node,
  engine,
  close,
  setHasStudyChanged,
  study,
}) {
  const components = study?.components || {};

  const [ports, setPorts] = useState(
    Object.values(node?.ports)
      .filter((port) => port?.options?.type === "outCustomPort")
      .map((port) => port?.options)
      .map((option) => ({
        name: option?.name,
        label: option?.label,
        assignmentType: option?.assignmentType,
        probability: option?.probability,
        rule: option?.rule,
      }))
  );

  const handleChange = ({ portNumber, value, name }) => {
    const newPorts = ports.map((port, num) => {
      if (num === portNumber) {
        return {
          ...port,
          [name]: value,
        };
      } else {
        return port;
      }
    });
    setPorts(newPorts);
  };

  const removePort = ({ name }) => {
    const newPorts = ports.filter((port) => port?.name !== name);
    setPorts(newPorts);
  };

  const addPort = () => {
    const newPorts = [
      ...ports,
      { name: uniqid.time(), label: generate().dashed, probability: 1 },
    ];
    setPorts(newPorts);
  };

  const update = () => {
    const outPorts = Object.values(node?.ports).filter(
      (port) => port?.options?.type === "outCustomPort"
    );
    // update the number of ports if required
    if (ports.length !== outPorts.length) {
      // remove all ports
      outPorts.forEach((port) => {
        node.removePort(node?.ports[port?.options?.name]);
      });
      // re-add all ports
      ports.forEach((port, num) => {
        node.addPort(
          new OutCustomPort({
            in: false,
            alignment: "down",
            name: port?.name,
            label: port?.label,
            assignmentType: port?.assignmentType,
            probability: port?.probability,
            rule: port?.rule,
          })
        );
      });
    }
    // update content of ports
    ports.forEach((port, num) => {
      node.ports[port?.name].options = {
        ...node.ports[port?.name].options,
        label: port?.label,
        assignmentType: port?.assignmentType,
        probability: port?.probability,
        rule: port?.rule,
      };
    });
    engine.repaintCanvas();
    setHasStudyChanged(true);
    close();
  };

  return (
    <div className="background">
      <div className="modal">
        <div className="portsEditor">
          <div className="navigation">
            <div className="goBackBtn" onClick={() => close()}>
              ←
            </div>
            <div>
              <h1>{node?.options?.name}</h1>
              <p>{node?.options?.details}</p>
            </div>
            <div>
              <button onClick={update}>Update</button>
            </div>
          </div>
          <div>
            <div className="port">
              <div>
                <p>ID</p>
              </div>
              <div>
                <p>Name</p>
              </div>
              <div>
                <p>Probability (0 - 100%)</p>
              </div>
              <div>
                <p>Participants</p>
              </div>
              <div>
                <p></p>
              </div>
            </div>
            {ports.map((port, num) => (
              <div key={num} className="port">
                <div>
                  <p>{port?.name}</p>
                </div>
                <div>
                  <input
                    type="text"
                    name="label"
                    value={port?.label}
                    onChange={({ target }) =>
                      handleChange({
                        portNumber: num,
                        name: target?.name,
                        value: target?.value,
                      })
                    }
                  />
                </div>

                <div>
                  <input
                    type="number"
                    name="probability"
                    value={port?.probability}
                    min={0}
                    max={100}
                    onChange={({ target }) =>
                      handleChange({
                        portNumber: num,
                        name: target?.name,
                        value: target?.value,
                      })
                    }
                  />
                </div>

                <div>{components[port?.label]}</div>

                <div>
                  <button onClick={() => removePort({ name: port?.name })}>
                    Remove condition
                  </button>
                </div>
              </div>
            ))}

            <div className="footer">
              <div>
                <button onClick={() => addPort()}>Add condition</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
