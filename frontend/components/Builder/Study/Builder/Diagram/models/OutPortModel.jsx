import { DefaultPortModel } from '@projectstorm/react-diagrams';
import { AdvancedLinkModel } from '../factories/LinkFactory';
// this is a outcoming port
// it should be allowed to create links from this port

export class OutCustomPort extends DefaultPortModel {
  constructor(options = {}) {
    super({
      type: 'outCustomPort',
      ...options,
    });
    this.maximumLinks = 50;
  }

  setMaximumLinks(maxLinks) {
    this.maximumLinks = maxLinks;
  }

  getMaximumLinks() {
    return this.maximumLinks;
  }

  isNewLinkAllowed() {
    return this.getMaximumLinks() === null
      ? true
      : Object.keys(this.getLinks()).length < this.getMaximumLinks();
  }

  canLinkToPort(port) {
    return (
      this.isNewLinkAllowed() && // do not allow more than the number of maximum links
      port?.options?.type !== 'outCustomPort' && // do not allow links connecting to other out-ports
      this?.parent?.options?.id !== port?.parent?.options?.id && // do not allow link to connect to itself
      !Object.values(port?.links)
        .map(link => link?.sourcePort?.options?.id)
        .includes(this?.options?.id) // do not allow a new link if there is already the link exists
    );
  }

  createLinkModel() {
    return new AdvancedLinkModel();
  }


  serialize() {
    return {
      ...super.serialize(),
      maximumLinks: this.maximumLinks,
    };
  }

  deserialize(event, engine) {
    super.deserialize(event, engine);
    this.maximumLinks = event.data.maximumLinks;
  }
}
