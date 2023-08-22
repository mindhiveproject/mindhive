import React, { Component } from "react";
import { Accordion, Icon } from "semantic-ui-react";

import { content } from "./Content";

import { StyledProgram } from "../../styles/StyledDocument";

export default class Program extends Component {
  state = { activeIndex: 0 };

  handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;

    this.setState({ activeIndex: newIndex });
  };

  render() {
    const { activeIndex } = this.state;

    return (
      <StyledProgram>
        <Accordion fluid styled>
          {content.map((lesson, index) => (
            <>
              <Accordion.Title
                active={activeIndex === index}
                index={index}
                onClick={this.handleClick}
                className="title"
              >
                <div className="number">{lesson.number}</div>
                <div className="text">{lesson.title}</div>
                <div className="duration">{lesson.duration}</div>
              </Accordion.Title>

              <Accordion.Content
                active={activeIndex === index}
                className="content"
              >
                {lesson.classes.map((theclass) => (
                  <div className="theclass">
                    <h3>{theclass.title}</h3>
                    {theclass.lesson && (
                      <div className="classBlock">
                        <img
                          src="/assets/teachers/icons/lesson.svg"
                          alt="Lesson"
                        />

                        <div>
                          <h4>LESSON</h4>
                        </div>
                        <div />
                        <div>
                          <p>{theclass.lesson}</p>
                        </div>
                      </div>
                    )}

                    {theclass.activity && (
                      <div className="classBlock">
                        <img
                          src="/assets/teachers/icons/activity.svg"
                          alt="Lesson"
                        />

                        <div>
                          <h4>ACTIVITY</h4>
                        </div>
                        <div />
                        <div>
                          <p>{theclass.activity}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </Accordion.Content>
            </>
          ))}
        </Accordion>
      </StyledProgram>
    );
  }
}
