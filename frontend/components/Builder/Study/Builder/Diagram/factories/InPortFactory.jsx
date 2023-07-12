import { AbstractModelFactory } from '@projectstorm/react-canvas-core';
import { InCustomPort } from '../models/InPortModel';

export class InPortFactory extends AbstractModelFactory {
  constructor() {
    super('inCustomPort');
  }

  generateModel() {
    return new InCustomPort();
  }
}
