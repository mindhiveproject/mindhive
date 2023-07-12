import { NodeModel } from '@projectstorm/react-diagrams';
import { InCustomPort } from './InPortModel';
import { OutCustomPort } from './OutPortModel';

export class TaskModel extends NodeModel {
  constructor(options) {
    super({
      ...options,
      type: 'my-node',
    });

    if (options) {
      this.color = options.color || 'black';
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
      name: this.options.name,
      details: this.options.details,
      componentID: this.options.componentID,
      testId: this.options.testId,
      taskType: this.options.taskType,
      subtitle: this.options.subtitle,
      createCopy: this.options.createCopy,
    };
  }

  deserialize(ob, engine) {
    super.deserialize(ob, engine);
    this.options.name = ob.data.name;
    this.options.details = ob.data.details;
    this.options.componentID = ob.data.componentID;
    this.options.testId = ob.data.testId;
    this.options.taskType = ob.data.taskType;
    this.options.subtitle = ob.data.subtitle;
    this.options.createCopy = ob.data.createCopy;
  }
}
