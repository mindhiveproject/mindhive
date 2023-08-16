import { NodeModel } from '@projectstorm/react-diagrams';
import { InCustomPort } from './InPortModel';

export class DesignModel extends NodeModel {
  constructor(options) {
    super({
      ...options,
      type: 'design',
    });

    if (options) {
      this.color = options.color || 'white';
    }

    // setup an in port
    this.addPort(
      new InCustomPort({
        in: true,
        name: 'in',
        alignment: 'top',
      })
    );
  }

  updateOptions(options) {
    this.options = { ...this.options, ...options };
  }

  serialize() {
    return {
      ...super.serialize(),
      name: this.options.name,
      details: this.options.details,
    };
  }

  deserialize(ob, engine) {
    super.deserialize(ob, engine);
    this.options.name = ob.data.name;
    this.options.details = ob.data.details;
  }
}
