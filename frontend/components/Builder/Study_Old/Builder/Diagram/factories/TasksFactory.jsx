import React from 'react';
import { AbstractReactFactory } from '@projectstorm/react-canvas-core';
import { TaskModel } from '../models/TaskModel';
import { TaskWidget } from '../widgets/TaskWidget';

// TODO: Refactor to hooks
export class TasksFactory extends AbstractReactFactory {
  constructor() {
    super('my-node');
  }

  generateModel(initialConfig) {
    return new TaskModel();
  }

  generateReactWidget(event) {
    return <TaskWidget engine={this.engine} node={event.model} />;
  }
}
