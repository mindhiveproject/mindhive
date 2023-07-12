import React from 'react';
import { AbstractReactFactory } from '@projectstorm/react-canvas-core';
import { AnchorModel } from '../models/AnchorModel';
import { AnchorWidget } from '../widgets/AnchorWidget';

export class AnchorFactory extends AbstractReactFactory {
  constructor() {
    super('my-anchor');
  }

  generateModel(initialConfig) {
    return new AnchorModel();
  }

  generateReactWidget(event) {
    return <AnchorWidget engine={this.engine} node={event.model} />;
  }
}
