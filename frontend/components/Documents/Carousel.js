import React, { Component } from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
// https://www.npmjs.com/package/react-responsive-carousel
// http://react-responsive-carousel.js.org/#demos

class CarouselComponent extends Component {
  render() {
    return (
      <div>
        <Carousel autoPlay infiniteLoop>
          <div>
            <img src="/assets/about/MindHive_About_carousel0.png" />
          </div>
          <div>
            <img src="/assets/about/MindHive_About_carousel1.png" />
          </div>
          <div>
            <img src="/assets/about/MindHive_About_carousel2.png" />
          </div>
          <div>
            <img src="/assets/about/MindHive_About_carousel3.png" />
          </div>
          <div>
            <img src="/assets/about/MindHive_About_carousel4.png" />
          </div>
          <div>
            <img src="/assets/about/MindHive_About_carousel5.png" />
          </div>
          <div>
            <img src="/assets/about/MindHive_About_carousel6.png" />
          </div>
        </Carousel>
      </div>
    );
  }
}

export default CarouselComponent;
