import React from 'react';
import { AbstractReactFactory } from '@projectstorm/react-canvas-core';
import { CommentModel } from '../models/CommentModel';
import { CommentWidget } from '../widgets/CommentWidget';

export class CommentsFactory extends AbstractReactFactory {
  constructor() {
    super('my-comment');
  }

  generateModel(initialConfig) {
    return new CommentModel();
  }

  generateReactWidget(event) {
    return <CommentWidget engine={this.engine} node={event.model} />;
  }
}
