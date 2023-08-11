import { useState } from "react";
import { OutCustomPort } from "../Diagram/models/OutPortModel";

import uniqid from "uniqid";
import generate from "project-name-generator";

export default function Modal({ user, node, engine, close }) {
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
      { name: uniqid.time(), label: generate().dashed },
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
    // update the content of node
    // node.options.conditions = ports;
    engine.repaintCanvas();
    close();
  };

  return (
    <div className="background">
      <div className="modal">
        <div className="taskViewerHeader">
          <div>
            <h1>{node?.options?.name}</h1>
            <p>{node?.options?.details}</p>
          </div>
          <div className="rightPanel">
            <div className="taskViewerButtons">
              <div className="closeBtn" onClick={() => close()}>
                &times;
              </div>
              <div>
                <button onClick={update}>Update</button>
              </div>
            </div>
          </div>
        </div>
        <div className="portsEditor">
          {ports.map((port, num) => (
            <div key={num} className="port">
              <div>Name {port?.name}</div>
              <div>Label {port?.label}</div>
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
                <button onClick={() => removePort({ name: port?.name })}>
                  Remove condition
                </button>
              </div>
            </div>
          ))}

          <div>
            <button onClick={() => addPort()}>Add condition</button>
          </div>
        </div>
      </div>
    </div>
  );
}
