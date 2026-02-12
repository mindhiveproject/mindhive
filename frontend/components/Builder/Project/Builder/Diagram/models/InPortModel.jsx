import { DefaultPortModel } from '@projectstorm/react-diagrams';

// this is a incoming port
// it should be not allowed to create links from this port

export class InCustomPort extends DefaultPortModel {
  constructor(options = {}) {
    super({
      type: 'inCustomPort',
      ...options,
    });
  }

  isNewLinkAllowed() {
    return true;
  }

  canLinkToPort(port) {
    return false;
  }

  // Prevent creating ANY new link when dragging FROM this input port
  createLinkModel() {
    // Return null/undefined → no link model created, drag doesn't start
    return null;
  }

  serialize() {
    return {
      ...super.serialize(),
    };
  }

  deserialize(event, engine) {
    super.deserialize(event, engine);
  }
}
