/**
 * Helpers to detect circular flows in ProjectStorm study/project diagrams.
 * An edge S → T creates a cycle if T can already reach S via out-port links.
 */

let cycleWarningHandler = null;

export function setCycleWarningHandler(handler) {
  cycleWarningHandler = typeof handler === "function" ? handler : null;
}

export function warnCyclePrevented() {
  if (cycleWarningHandler) {
    cycleWarningHandler();
  }
}

export function getOutgoingNodes(node) {
  if (!node?.ports) return [];

  const outPorts = Object.values(node.ports).filter(
    (port) => port?.options?.type === "outCustomPort"
  );

  const children = [];
  outPorts.forEach((port) => {
    Object.values(port?.links || {}).forEach((link) => {
      const target = link?.targetPort?.parent;
      if (target) children.push(target);
    });
  });
  return children;
}

/**
 * Returns true if adding a link from sourceNode → targetNode would create a cycle.
 */
export function wouldCreateCycle(sourceNode, targetNode) {
  if (!sourceNode || !targetNode) return false;

  const sourceId = sourceNode?.options?.id ?? sourceNode?.getID?.();
  const targetId = targetNode?.options?.id ?? targetNode?.getID?.();
  if (!sourceId || !targetId) return false;
  if (sourceId === targetId) return true;

  const visited = new Set();
  const queue = [targetNode];

  while (queue.length > 0) {
    const current = queue.shift();
    const currentId = current?.options?.id ?? current?.getID?.();
    if (!currentId || visited.has(currentId)) continue;
    visited.add(currentId);

    if (currentId === sourceId) return true;

    getOutgoingNodes(current).forEach((child) => {
      const childId = child?.options?.id ?? child?.getID?.();
      if (childId && !visited.has(childId)) {
        queue.push(child);
      }
    });
  }

  return false;
}
