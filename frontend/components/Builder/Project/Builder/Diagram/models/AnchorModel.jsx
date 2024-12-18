import { NodeModel, DefaultPortModel } from '@projectstorm/react-diagrams';
import { OutCustomPort } from './OutPortModel';

export class AnchorModel extends NodeModel {
  constructor(options) {
    super({
      ...options,
      type: 'my-anchor',
    });

    if (options) {
      this.color = options.color || 'white';
    }

    this.addPort(
      new OutCustomPort({
        in: false,
        name: 'out',
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
    };
  }

  deserialize(ob, engine) {
    super.deserialize(ob, engine);
  }

  remove() {
    // the anchor should not be removed
    // so we don't call super.remove()
  }
}
