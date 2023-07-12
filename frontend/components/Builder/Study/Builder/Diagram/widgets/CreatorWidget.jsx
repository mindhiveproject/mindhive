import React from 'react';
import { CanvasWidget } from '@projectstorm/react-canvas-core';
import { DiagramModel } from '@projectstorm/react-diagrams';
import uniqid from 'uniqid';

import { DiagramCanvas } from '../DiagramCanvas';
import { TaskModel } from '../models/TaskModel';
import { DesignModel } from '../models/DesignModel';
import { StyledCreatorWidget } from './my-creator-widget';

export const CreatorWidget = props => {
  // force update canvas
  const forceUpdate = React.useReducer(bool => !bool)[1];

  const diagramEngine = props.engine;
  diagramEngine.openComponentModal = props.openComponentModal;
  diagramEngine.openDesignModal = props.openDesignModal;
  diagramEngine.openStudyPreview = props.openStudyPreview;

  // disable touchpad zooming
  const scrollRef = React.useRef();
  const stopScroll = e => e.preventDefault();
  React.useEffect(() => {
    const scrollEl = scrollRef.current;
    scrollEl?.addEventListener('wheel', stopScroll);
    return () => scrollEl?.removeEventListener('wheel', stopScroll);
  }, [scrollRef]);

  const shorten = text => {
    if (text && text.split(' ').length > 12) {
      const short = text
        .split(' ')
        .slice(0, 12)
        .join(' ');
      return `${short} ...`;
    }
    return text;
  };

  const onNodeDrop = event => {
    const dataString = event.dataTransfer.getData('storm-diagram-node');
    const data = JSON.parse(dataString);

    // adding new component
    if (data.type === 'component') {
      const node = new TaskModel({
        color: 'white',
        name: data?.name,
        details: shorten(data?.details),
        componentID: data?.componentID,
        testId: uniqid.time(),
        taskType: data?.taskType,
        subtitle: shorten(data?.subtitle),
      });

      const point = diagramEngine.getRelativeMousePoint(event);
      node.setPosition(point);

      diagramEngine.getModel().addNode(node);
      forceUpdate();
    }

    // using a template
    if (data.type === 'study') {
      const { diagram } = data;
      const model = new DiagramModel();
      model.deserializeModel(JSON.parse(diagram), diagramEngine);
      diagramEngine.setModel(model);
    }

    if (data.type === 'design') {
      const node = new DesignModel({
        name: data?.name,
        details: data?.details,
      });
      const point = diagramEngine.getRelativeMousePoint(event);
      node.setPosition(point);
      diagramEngine.getModel().addNode(node);
      forceUpdate();
    }
  };

  return (
    <StyledCreatorWidget>
      <div className="creator-body">
        <div className="creator-content">
          <div
            className="creator-layer"
            onDrop={event => onNodeDrop(event)}
            onDragOver={event => {
              event.preventDefault();
            }}
            ref={scrollRef}
          >
            <DiagramCanvas>
              <CanvasWidget {...props} />
            </DiagramCanvas>
          </div>
        </div>
      </div>
    </StyledCreatorWidget>
  );
};
