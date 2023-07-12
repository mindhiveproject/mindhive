import React, { Component } from "react";

class Links extends Component {
  render() {
    return (
      <div className="updatesBoard">
        <h2>More information</h2>
        <div className="updates">
          <div>
            <a href="/docs/about" target="_blank" rel="noreferrer">
              About
            </a>
          </div>

          <div>
            <a href="/teachers" target="_blank" rel="noreferrer">
              Teachers
            </a>
          </div>

          <div>
            <a href="/docs/privacy" target="_blank" rel="noreferrer">
              Privacy policy
            </a>
          </div>

          <div>
            <a href="/docs/terms" target="_blank" rel="noreferrer">
              Terms & Conditions
            </a>
          </div>

          <div>
            <a href="mailto: info@mindhive.science">info@mindhive.science</a>
          </div>
        </div>
      </div>
    );
  }
}

export default Links;
