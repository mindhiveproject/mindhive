import React from "react";
import { Button, Modal, Icon } from "semantic-ui-react";
import ReactStars from "react-rating-stars-component";

export default function ReviewModal({ review, profile }) {
  const [open, setOpen] = React.useState(false);
  const { content, title } = review;
  const { username } = profile;

  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Icon name="external alternate" />}
    >
      <Modal.Header>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gridGap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                color: "lightgrey",
              }}
            >
              Author
            </div>
            {username}
          </div>
          <div>
            <div
              style={{
                color: "lightgrey",
              }}
            >
              Study
            </div>
            {title}
          </div>
        </div>
      </Modal.Header>
      <Modal.Content>
        <Modal.Description>
          <div className="reviewOverview">
            {content?.map((section, num) => (
              <div key={num} className="section">
                <div className="title">
                  {section.name}. {section.question}
                </div>
                <div>{section.text}</div>
                <div className="answer">
                  <div>{section.answer}</div>
                  {section?.rating && (
                    <div className="averageRating">
                      <ReactStars
                        count={5}
                        size={24}
                        activeColor="#ffd700"
                        isHalf
                        value={section?.rating}
                        edit={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button color="black" onClick={() => setOpen(false)}>
          Close
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
