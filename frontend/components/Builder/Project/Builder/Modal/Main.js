import { useState } from "react";
import useTranslation from "next-translate/useTranslation";

import uniqid from "uniqid";
import Button from "../../../../DesignSystem/Button";
import IconButton from "../../../../DesignSystem/IconButton";
import { conditionCount } from "../../../../../lib/studyConditions";

const ADD_ICON = {
  display: "block",
  width: 18,
  height: 18,
  backgroundColor: "currentColor",
  WebkitMaskImage: "url(/assets/icons/builder/medium-add.svg)",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: "url(/assets/icons/builder/medium-add.svg)",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
};

const DANGER_TONAL = {
  background: "var(--MH-Theme-Danger-Light, #f9dedc)",
  color: "var(--MH-Theme-Danger-Dark, #8f1f14)",
};

export default function Modal({
  node,
  canvas,
  close,
  markStudyChanged,
  study,
}) {
  const { t } = useTranslation("builder");
  const components = study?.components || {};

  // one entry per condition (an output of the block); `name` is the
  // condition's id, `label` what participants' data shows
  const [ports, setPorts] = useState(() =>
    (canvas?.getDesignConditions(node) || []).map((condition) => ({
      name: condition?.name,
      label: condition?.label,
      assignmentType: condition?.assignmentType,
      probability: condition?.probability,
      rule: condition?.rule,
    }))
  );

  const handleChange = ({ portNumber, value, name }) => {
    const newPorts = ports.map((port, num) => {
      if (num === portNumber) {
        return {
          ...port,
          [name]: value,
        };
      }
      return port;
    });
    setPorts(newPorts);
  };

  const removePort = ({ name }) => {
    setPorts((prev) => prev.filter((port) => port?.name !== name));
  };

  const addPort = () => {
    setPorts((prev) => [
      ...prev,
      {
        name: uniqid.time(),
        label: t(
          "modal.conditionDefault",
          { number: prev.length + 1 },
          { default: "Condition {{number}}" }
        ),
        probability: 50,
      },
    ]);
  };

  const update = () => {
    canvas?.setDesignConditions(node, ports);
    markStudyChanged();
    close();
  };

  return (
    <div className="blockPanel">
      <div className="blockPanelHeader">
        <div className="blockPanelTitle">
          <h1>{node?.options?.name}</h1>
          {node?.options?.details ? (
            <p className="blockPanelMuted">{node.options.details}</p>
          ) : null}
        </div>
        <div className="blockPanelHeaderMain">
          <div className="blockPanelActions">
            <Button variant="filled" type="button" onClick={update}>
              {t("modal.update", {}, { default: "Update" })}
            </Button>
          </div>
          <IconButton
            variant="subtle"
            elevated={false}
            ariaLabel={t("blockPanel.close", {}, { default: "Close" })}
            title={t("blockPanel.close", {}, { default: "Close" })}
            onClick={() => close()}
            icon={<span aria-hidden>&times;</span>}
          />
        </div>
      </div>
      <div className="blockPanelBody">
        <div className="portsEditor">
          {ports.map((port, num) => (
            <div key={port?.name || num} className="port">
              <div>
                <input
                  type="text"
                  name="label"
                  aria-label={t("modal.name", {}, { default: "Condition name" })}
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
              <div className="portChance">
                <input
                  type="number"
                  name="probability"
                  aria-label={t("modal.probability", {}, {
                    default: "Probability (0 - 100%)",
                  })}
                  value={port?.probability ?? 50}
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
              <div className="portPercent">
                <span aria-hidden>%</span>
              </div>
              <div className="portParticipants">
                {conditionCount(components, port) || null}
              </div>
              <div className="portActions">
                <Button
                  variant="tonal"
                  type="button"
                  style={DANGER_TONAL}
                  onClick={() => removePort({ name: port?.name })}
                >
                  {t("modal.removeCondition", {}, { default: "Remove" })}
                </Button>
              </div>
            </div>
          ))}
          <div className="footer">
            <Button
              variant="subtle"
              type="button"
              leadingIcon={<span aria-hidden style={ADD_ICON} />}
              onClick={() => addPort()}
            >
              {t("modal.addCondition", {}, { default: "Add condition" })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
