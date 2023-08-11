import { NodeModel } from '@projectstorm/react-diagrams';
import { InCustomPort } from './InPortModel';
import { OutCustomPort } from './OutPortModel';

import uniqid from "uniqid";

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
    // this.addPort(
    //   new OutCustomPort({
    //     in: false,
    //     alignment: 'down',
    //     name: uniqid.time(),
    //     label: 'control',
    //     assignmentType: "random",
    //     probability: 50,
    //     rule: undefined,
    //   })
    // );
    // this.addPort(
    //   new OutCustomPort({
    //     in: false,
    //     alignment: 'down',
    //     name: uniqid.time(),
    //     label: 'experimental',
    //     assignmentType: "random",
    //     probability: 50,
    //     rule: undefined,
    //   })
    // );
  }

  updateOptions(options) {
    this.options = { ...this.options, ...options };
  }

  serialize() {
    return {
      ...super.serialize(),
      name: this.options.name,
      details: this.options.details,
      // conditions: this.options.conditions,
    };
  }

  deserialize(ob, engine) {
    super.deserialize(ob, engine);
    this.options.name = ob.data.name;
    this.options.details = ob.data.details;
    // this.options.conditions = ob.data.conditions;
  }
}
