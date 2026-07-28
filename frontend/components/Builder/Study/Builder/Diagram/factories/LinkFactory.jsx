import {
  DefaultLinkFactory,
  DefaultLinkModel,
  DefaultLinkWidget,
} from '@projectstorm/react-diagrams';
import { LinkWidget } from '@projectstorm/react-diagrams-core';
import * as React from 'react';

const LINK_CURVYNESS = 70;

export class AdvancedLinkModel extends DefaultLinkModel {
  constructor() {
    super({
      type: 'advanced',
      width: 4,
      curvyness: LINK_CURVYNESS,
    });
  }
}

export class AdvancedLinkWidget extends DefaultLinkWidget {
  render() {
    // ensure id is present for all points on the path
    const points = this.props.link.getPoints();
    const paths = [];
    this.refPaths = [];

    if (points.length === 2) {
      // Default react-diagrams bezier for two-point links
      paths.push(
        this.generateLink(
          this.props.link.getSVGPath(),
          {
            onMouseDown: event => {
              this.addPointToLink(event, 1);
            },
          },
          '0'
        )
      );
    } else {
      // draw the multiple anchors and complex line instead
      for (let j = 0; j < points.length - 1; j++) {
        paths.push(
          this.generateLink(
            LinkWidget.generateLinePath(points[j], points[j + 1]),
            {
              'data-linkid': this.props.link.getID(),
              'data-point': j,
              onMouseDown: event => {
                this.addPointToLink(event, j + 1);
              },
            },
            j
          )
        );
      }

      // render the circles
      for (let i = 1; i < points.length - 1; i++) {
        paths.push(this.generatePoint(points[i]));
      }
    }

    // dangling link: show endpoint handle while dragging
    if (this.props.link.getTargetPort() === null) {
      paths.push(this.generatePoint(points[points.length - 1]));
    }

    return (
      <g data-default-link-test={this.props.link.getOptions().testName}>
        {paths}
      </g>
    );
  }
}

export class AdvancedLinkFactory extends DefaultLinkFactory {
  constructor() {
    super('advanced');
  }

  generateModel() {
    return new AdvancedLinkModel();
  }

  generateReactWidget(event) {
    return (
      <AdvancedLinkWidget link={event.model} diagramEngine={this.engine} />
    );
  }
}
