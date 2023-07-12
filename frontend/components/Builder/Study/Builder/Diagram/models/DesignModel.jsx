import { NodeModel } from '@projectstorm/react-diagrams';
import { InCustomPort } from './InPortModel';
import { OutCustomPort } from './OutPortModel';

export class DesignModel extends NodeModel {
  constructor(options) {
    super({
      ...options,
      type: 'design',
    });

    if (options) {
      this.color = options.color || 'yellow';
    }

    // setup an in and out port
    this.addPort(
      new InCustomPort({
        in: true,
        name: 'in',
        alignment: 'top',
      })
    );
    this.addPort(
      new OutCustomPort({
        in: false,
        name: 'out-1',
        alignment: 'down',
      })
    );
    this.addPort(
      new OutCustomPort({
        in: false,
        name: 'out-2',
        alignment: 'down',
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
