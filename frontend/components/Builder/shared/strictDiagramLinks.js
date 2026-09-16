import {
  AbstractDisplacementState,
  Action,
  InputType,
  MoveItemsState,
} from "@projectstorm/react-canvas-core";
/**
 * Port under the cursor, ignoring the dangling link handle which sits
 * on top of the pointer during drag (see DefaultLinkPointWidget).
 */
function resolveDropPort(engine, mouseEvent) {
  if (typeof document === "undefined" || !mouseEvent) return null;
  const model = engine?.getModel?.();
  if (!model) return null;

  const stack =
    typeof document.elementsFromPoint === "function"
      ? document.elementsFromPoint(mouseEvent.clientX, mouseEvent.clientY)
      : [mouseEvent.target];

  for (const el of stack) {
    const portEl =
      el?.closest?.(".port[data-name]") ||
      (el?.matches?.(".port[data-name]") ? el : null);
    if (!portEl) continue;
    const nodeEl = portEl.closest(".node[data-nodeid]");
    if (!nodeEl) continue;
    const node = model.getNode(nodeEl.getAttribute("data-nodeid"));
    const port = node?.getPort(portEl.getAttribute("data-name"));
    if (port) return port;
  }
  return null;
}

export function removeDanglingLinks(model) {
  if (!model?.getLinks) return 0;
  const links = [...(model.getLinks() || [])];
  let removed = 0;
  links.forEach((link) => {
    if (!link.getSourcePort() || !link.getTargetPort()) {
      link.remove();
      removed += 1;
    }
  });
  return removed;
}

class StrictDragNewLinkState extends AbstractDisplacementState {
  constructor() {
    super({ name: "drag-new-link" });
    this.config = {
      allowLooseLinks: false,
      allowLinksFromLockedPorts: false,
    };

    this.registerAction(
      new Action({
        type: InputType.MOUSE_DOWN,
        fire: (event) => {
          this.port = this.engine.getMouseElement(event.event);
          if (!this.config.allowLinksFromLockedPorts && this.port?.isLocked?.()) {
            this.eject();
            return;
          }
          this.link = this.port.createLinkModel();
          if (!this.link) {
            this.eject();
            return;
          }
          this.link.setSelected(true);
          this.link.setSourcePort(this.port);
          this.engine.getModel().addLink(this.link);
          this.port.reportPosition();
        },
      })
    );

    this.registerAction(
      new Action({
        type: InputType.MOUSE_UP,
        fire: (event) => {
          this.finishLink(event.event);
        },
      })
    );
  }

  finishLink(mouseEvent) {
    if (this.finished) return;
    this.finished = true;
    const dropPort = resolveDropPort(this.engine, mouseEvent);
    if (this.link && dropPort && this.port?.canLinkToPort(dropPort)) {
      this.link.setTargetPort(dropPort);
      dropPort.reportPosition();
      this.engine.repaintCanvas();
      return;
    }
    this.link?.remove();
    this.engine.repaintCanvas();
  }

  activated(previous) {
    super.activated(previous);
    this.finished = false;
    this.onWindowMouseUp = (event) => this.finishLink(event);
    window.addEventListener("mouseup", this.onWindowMouseUp, true);
  }

  fireMouseMoved(event) {
    const portPos = this.port.getPosition();
    const zoomLevelPercentage = this.engine.getModel().getZoomLevel() / 100;
    const engineOffsetX = this.engine.getModel().getOffsetX() / zoomLevelPercentage;
    const engineOffsetY = this.engine.getModel().getOffsetY() / zoomLevelPercentage;
    const initialXRelative = this.initialXRelative / zoomLevelPercentage;
    const initialYRelative = this.initialYRelative / zoomLevelPercentage;
    const linkNextX =
      portPos.x -
      engineOffsetX +
      (initialXRelative - portPos.x) +
      event.virtualDisplacementX;
    const linkNextY =
      portPos.y -
      engineOffsetY +
      (initialYRelative - portPos.y) +
      event.virtualDisplacementY;
    this.link.getLastPoint().setPosition(linkNextX, linkNextY);
    this.engine.repaintCanvas();
  }

  deactivated(next) {
    if (this.onWindowMouseUp) {
      window.removeEventListener("mouseup", this.onWindowMouseUp, true);
      this.onWindowMouseUp = null;
    }
    super.deactivated(next);
    const link = this.link;
    const engine = this.engine;
    queueMicrotask(() => {
      if (link && !link.getTargetPort()) {
        link.remove();
        engine?.repaintCanvas?.();
      }
    });
  }
}

class StrictDragDiagramItemsState extends MoveItemsState {
  constructor() {
    super();
    this.registerAction(
      new Action({
        type: InputType.MOUSE_UP,
        fire: (event) => {
          const dropPort = resolveDropPort(this.engine, event.event);
          const positions = this.initialPositions || {};
          Object.values(positions).forEach((position) => {
            const item = position.item;
            const link = item?.getParent?.();
            if (!link || typeof link.getLastPoint !== "function") return;
            if (link.getLastPoint() !== item) return;
            if (dropPort && link.getSourcePort()?.canLinkToPort(dropPort)) {
              link.setTargetPort(dropPort);
              dropPort.reportPosition();
            } else if (!link.getTargetPort()) {
              link.remove();
            } else {
              link.getTargetPort().reportPosition();
            }
          });
          this.engine.repaintCanvas();
        },
      })
    );
  }
}

export function configureStrictDiagramLinks(engine) {
  const state = engine?.getStateMachine?.().getCurrentState?.();
  if (!state?.dragNewLink) return;

  state.dragNewLink = new StrictDragNewLinkState();
  state.dragItems = new StrictDragDiagramItemsState();
  state.dragNewLink.config.allowLooseLinks = false;
}
