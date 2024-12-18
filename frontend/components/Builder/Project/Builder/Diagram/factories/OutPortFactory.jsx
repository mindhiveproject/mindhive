import { AbstractModelFactory } from '@projectstorm/react-canvas-core';
import { OutCustomPort } from '../models/OutPortModel';

export class OutPortFactory extends AbstractModelFactory {
  constructor() {
    super('outCustomPort');
  }

  generateModel() {
    return new OutCustomPort();
  }
}
