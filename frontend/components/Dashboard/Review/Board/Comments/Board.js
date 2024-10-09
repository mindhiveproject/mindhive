import moment from "moment";
import styled from "styled-components";
import ReactStars from "react-rating-stars-component"; // https://www.npmjs.com/package/react-rating-stars-component

import { Icon } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { EDIT_REVIEW } from "../../../../Mutations/Review";
import { STUDY_TO_REVIEW } from "../../../../Queries/Study";

const StyledBoard = styled.div`
  display: grid;
  margin: 40px 0px;
  grid-gap: 30px;
  font-family: Lato;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 21px;
  letter-spacing: 0em;

  .section {
    display: grid;
    grid-gap: 1rem;
    min-width: 300px;
    padding: 20px;

    align-content: baseline;
    border: 1.5px solid #dadfe2;
    .reviewerTitle {
      display: grid;
      grid-gap: 8px;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      img {
        height: 40px;
      }
    }
  }

  .cards {
    display: grid;
    grid-gap: 1rem;
  }

  .card {
    .title {
      display: grid;
      grid-gap: 8px;
      grid-template-columns: auto 1fr;
    }
    display: grid;
    grid-gap: 1rem;
    color: #1a1a1a;
    box-sizing: border-box;
    border-radius: 4px;
    text-align: left;
  }
`;

export default function Board({ studyId, sections, user }) {
  const [editReview, { data }] = useMutation(EDIT_REVIEW, {});

  const voteReview = async ({ id, votedBefore }) => {
    await editReview({
      variables: {
        id: id,
        input: {
          upvotedBy: votedBefore
            ? { disconnect: { id: user?.id } }
            : { connect: { id: user?.id } },
        },
      },
      refetchQueries: [{ query: STUDY_TO_REVIEW, variables: { id: studyId } }],
    });
  };

  return (
    <StyledBoard>
      <div className="h28">Feedback and Comments</div>
      {sections.map((section, num) => {
        const votedBefore = section?.upvotedBy
          ?.map((u) => u?.id)
          .includes(user?.id);
        return (
          <div key={num} className="section">
            <div className="reviewerTitle">
              <img src="/assets/icons/review/reviewer.svg" />
              <div classsName="p14_black">{section.title}</div>

              <div>
                <div
                  onClick={() => voteReview({ id: section?.id, votedBefore })}
                >
                  {votedBefore ? (
                    <Icon name="thumbs up" size="big" />
                  ) : (
                    <Icon name="thumbs up outline" size="big" />
                  )}
                </div>

                <span>{section?.upvotedBy?.length}</span>
              </div>
            </div>

            {section?.createdAt && (
              <em>
                Submitted on{" "}
                {moment(section?.createdAt).format("MMMM D, YYYY, h:mma")}
              </em>
            )}
            {section?.updatedAt && (
              <em>
                Updated on{" "}
                {moment(section?.updatedAt).format("MMMM D, YYYY, h:mma")}
              </em>
            )}

            {user?.permissions.includes("TEACHER") && (
              <div>{section.hiddenTitle}</div>
            )}

            <div className="cards">
              {section.content
                .filter((card) => card.answer)
                .map((card, num) => (
                  <div key={num} className="card">
                    <div className="title">
                      <div className="p16_600">{card.title}</div>
                      <div>
                        {card?.rating && (
                          <ReactStars
                            count={5}
                            size={24}
                            activeColor="#ffd700"
                            isHalf
                            value={card?.rating}
                            edit={false}
                          />
                        )}
                      </div>
                    </div>

                    {user?.permissions.includes("TEACHER") && (
                      <div>{card?.hiddenTitle}</div>
                    )}
                    {card?.createdAt && (
                      <em>
                        {moment(card?.createdAt).format("MMMM D, YYYY, h:mma")}
                      </em>
                    )}
                    <div className="p14">{card.answer}</div>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </StyledBoard>
  );
}
