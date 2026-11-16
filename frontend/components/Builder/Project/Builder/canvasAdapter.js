import { OutCustomPort } from "./Diagram/models/OutPortModel";

// What Builder.js, the menu and the design settings panel need from the
// canvas. Two implementations while both canvases exist: the Storm canvas
// (Engine.js, below) and the React Flow canvas (`canvas` in FlowEngine.js).
//
//   isReady                          the design is loaded
//   setInteractionLocked(locked)     optional: stop the canvas reacting to
//                                    keys and drags (Storm only)
//   hasStartingPoint()
//   sharesTask(node)                 another block uses the same task
//   updateTaskNodes({ componentID, testId }, patch)
//   removeNode(node)                 one undo step
//   getDesignConditions(node) / setDesignConditions(node, conditions)
//
// `node` is what the canvas hands to openComponentModal/openDesignSettings:
// an object with getID() and `options` ({ id, type, componentID, ... }).

export function createStormCanvas({
  engine,
  onBeforeCanvasMutation,
  onAfterCanvasMutation,
}) {
  const model = () => engine?.getModel?.();
  const nodes = () => model()?.getNodes?.() || [];

  return {
    isReady: !!model(),
    setInteractionLocked: (locked) => model()?.setLocked(locked),
    hasStartingPoint: () =>
      nodes().some((n) => n?.options?.type === "my-anchor"),
    sharesTask: (node) =>
      !!node?.options?.componentID &&
      nodes().some(
        (n) => n !== node && n?.options?.componentID === node.options.componentID
      ),
    updateTaskNodes: ({ componentID, testId }, patch) => {
      nodes().forEach((n) => {
        if (n?.options?.componentID === componentID && n?.options?.testId === testId) {
          n.updateOptions(patch);
        }
      });
      engine.repaintCanvas();
    },
    removeNode: (node) => {
      onBeforeCanvasMutation?.();
      try {
        node.remove();
      } finally {
        onAfterCanvasMutation?.();
      }
      engine?.repaintCanvas?.();
    },
    getDesignConditions: (node) =>
      Object.values(node?.ports || {})
        .filter((port) => port?.options?.type === "outCustomPort")
        .map((port) => port?.options),
    setDesignConditions: (node, conditions) => {
      const outPorts = Object.values(node?.ports || {}).filter(
        (port) => port?.options?.type === "outCustomPort"
      );
      if (conditions.length !== outPorts.length) {
        outPorts.forEach((port) => {
          node.removePort(node?.ports[port?.options?.name]);
        });
        conditions.forEach((condition) => {
          node.addPort(
            new OutCustomPort({
              in: false,
              alignment: "down",
              name: condition?.name,
              label: condition?.label,
              assignmentType: condition?.assignmentType,
              probability: condition?.probability,
              rule: condition?.rule,
            })
          );
        });
      }
      conditions.forEach((condition) => {
        node.ports[condition?.name].options = {
          ...node.ports[condition?.name].options,
          label: condition?.label,
          assignmentType: condition?.assignmentType,
          probability: condition?.probability,
          rule: condition?.rule,
        };
      });
      engine.repaintCanvas();
    },
  };
}
