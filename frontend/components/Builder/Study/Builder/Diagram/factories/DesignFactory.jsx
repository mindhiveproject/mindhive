import React from 'react';
import { AbstractReactFactory } from '@projectstorm/react-canvas-core';
import { DesignModel } from '../models/DesignModel';
import { DesignWidget } from '../widgets/DesignWidget';

export class DesignFactory extends AbstractReactFactory {
  constructor() {
    super('design');
  }

  generateModel(initialConfig) {
    return new DesignModel();
  }

  generateReactWidget(event) {
    return <DesignWidget engine={this.engine} node={event.model} />;
  }
}
