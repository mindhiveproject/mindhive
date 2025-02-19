import moment from "moment";
import styled from "styled-components";
import ReactStars from "react-rating-stars-component"; // https://www.npmjs.com/package/react-rating-stars-component

import { Icon } from "semantic-ui-react";

import { useMutation } from "@apollo/client";
import { EDIT_REVIEW } from "../../../../Mutations/Review";
// import { STUDY_TO_REVIEW } from "../../../../Queries/Study";
import { PROPOSAL_REVIEWS_QUERY } from "../../../../Queries/Proposal";

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
    padding: 16px 23px;

    align-content: baseline;
    background: #ffffff;
    border: 1px solid #deddd9;
    border-radius: 8px;

    .topLine {
      display: grid;
      grid-gap: 8px;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      /* img {
        height: 40px;
      } */
      .reviewer {
        display: grid;
        grid-gap: 5px;
        grid-template-columns: auto 1fr;
        align-items: center;
      }
      .voteArea {
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        border: 1px solid #a1a1a1;
        border-radius: 4px;
        padding: 5px;
        .votesCounter {
          border-left: 1px solid #a1a1a1;
          text-align: center;
        }
      }
    }
  }

  .cards {
    display: grid;
    padding: 8px;
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

  .status {
    display: grid;
    grid-gap: 15px;
    grid-template-columns: auto 1fr;
    padding: 8px;
    border-radius: 4px;
    .title {
      font-family: "Nunito";
      font-style: normal;
      font-weight: 600;
      font-size: 14px;
      line-height: 24px;
    }
  }
  .readyMoveForward {
    background: #def8fb;
  }
  .needsMinorAdjustments {
    background: #fdf2d0;
    color: #5d5763;
  }
  .needsSignificantWork {
    background: #ebe5f8;
    color: #6f25ce;
  }
  .requiresReevaluation {
    background: #fdeae8;
    color: #b9261a;
  }
`;

export default function Board({ projectId, sections, user }) {
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
      refetchQueries: [
        { query: PROPOSAL_REVIEWS_QUERY, variables: { id: projectId } },
      ],
    });
  };

  return (
    <StyledBoard>
      {sections.map((section, num) => {
        const votedBefore = section?.upvotedBy
          ?.map((u) => u?.id)
          .includes(user?.id);
        return (
          <div key={num} className="section">
            <div className="topLine">
              <div className="reviewer">
                <img src="/assets/icons/review/reviewer.svg" />
                <div classsName="p14_black">{section.title}</div>
              </div>

              <div>
                {section.content
                  .filter((card) => card.responseType === "selectOne")
                  .filter((card) => card.answer)
                  .map((card, num) => {
                    const [option] = card?.responseOptions.filter(
                      (option) => option?.value === card?.answer
                    );
                    return (
                      <div key={num} className={`status  ${option?.value}`}>
                        <img src={`/assets/icons/status/${option?.icon}.svg`} />
                        <div>
                          <div className="title">{option?.title}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="voteArea">
                <div
                  onClick={() => voteReview({ id: section?.id, votedBefore })}
                >
                  {votedBefore ? (
                    <Icon name="thumbs up" size="big" />
                  ) : (
                    <Icon name="thumbs up outline" size="big" />
                  )}
                </div>

                <div className="votesCounter">{section?.upvotedBy?.length}</div>
              </div>
            </div>

            {/* {section?.createdAt && (
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
            )} */}

            <div className="cards">
              {section.content
                .filter(
                  (card) =>
                    card.responseType !== "selectOne" &&
                    card.responseType !== "taskSelector"
                )
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
