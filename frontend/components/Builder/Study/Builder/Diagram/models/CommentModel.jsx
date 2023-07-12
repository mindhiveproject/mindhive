import { NodeModel } from '@projectstorm/react-diagrams';

export class CommentModel extends NodeModel {
  constructor(options) {
    super({
      ...options,
      type: 'my-comment',
    });

    if (options) {
      this.color = options.color || 'white';
    }
  }

  updateOptions(options) {
    this.options = { ...this.options, ...options };
  }

  serialize() {
    return {
      ...super.serialize(),
      author: this.options.author,
      time: this.options.time,
      content: this.options.content,
    };
  }

  deserialize(ob, engine) {
    super.deserialize(ob, engine);
    this.options.author = ob.data.author;
    this.options.time = ob.data.time;
    this.options.content = ob.data.content;
  }
}
