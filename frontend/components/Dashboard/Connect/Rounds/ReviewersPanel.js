// Reviewers panel for a ConnectRound. Shown to the round creator (and
// admins) on the round editor. Lets them add Profiles as reviewers by
// email, list current reviewers, and remove them. Reviewers gain the
// ability to read opportunities in the round, change their statuses,
// and leave review notes (see OpportunityReviewNote).
import { useState } from "react";
import { useLazyQuery, useMutation } from "@apollo/client";
import styled from "styled-components";

import { FIND_PROFILE_BY_EMAIL } from "../../../Queries/Organization";
import { UPDATE_CONNECT_ROUND } from "../../../Mutations/ConnectRound";
import { GET_CONNECT_ROUND } from "../../../Queries/ConnectRound";

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }

  .helper {
    margin: 0;
    color: #5f6871;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  input[type="email"] {
    flex: 1;
    min-width: 220px;
    border: 1px solid #d3dae0;
    border-radius: 100px;
    padding: 10px 16px;
    font-family: "Lato", sans-serif;
    font-size: 14px;
  }

  button {
    padding: 10px 20px;
    border-radius: 100px;
    background: #336f8a;
    color: #ffffff;
    border: none;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const ReviewerList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReviewerRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #d3dae0;
  border-radius: 12px;

  .who {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .name {
    font-weight: 600;
    color: #171717;
    font-size: 14px;
  }

  .email {
    color: #5f6871;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  button.remove {
    background: none;
    border: 1px solid #f5c2bf;
    color: #c0392b;
    font-family: "Inter", sans-serif;
    font-size: 12px;
    font-weight: 600;
    border-radius: 100px;
    padding: 6px 14px;
    cursor: pointer;

    &:hover {
      background: #fcebea;
    }
  }
`;

const Empty = styled.div`
  color: #5f6871;
  font-size: 13px;
  font-style: italic;
  padding: 8px 0;
`;

const Feedback = styled.div`
  font-size: 13px;
  color: ${({ $kind }) => ($kind === "error" ? "#871b16" : "#1d6b3a")};
`;

function displayName(p) {
  if (!p) return "Unknown";
  return (
    `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
    p.username ||
    p.email ||
    "Unknown"
  );
}

export default function ReviewersPanel({ round }) {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState(null);

  const reviewers = round?.reviewers || [];
  const refetch = [{ query: GET_CONNECT_ROUND, variables: { id: round.id } }];

  const [findProfile, { loading: looking }] = useLazyQuery(
    FIND_PROFILE_BY_EMAIL,
    { fetchPolicy: "network-only" }
  );
  const [updateRound, { loading: updating }] = useMutation(
    UPDATE_CONNECT_ROUND,
    { refetchQueries: refetch, awaitRefetchQueries: true }
  );

  const handleAdd = async () => {
    setFeedback(null);
    const target = email.trim().toLowerCase();
    if (!target) {
      setFeedback({ kind: "error", text: "Enter an email address first." });
      return;
    }
    if (reviewers.some((r) => r.email?.toLowerCase() === target)) {
      setFeedback({ kind: "error", text: "That person is already a reviewer." });
      return;
    }

    const { data } = await findProfile({ variables: { email: target } });
    const profile = data?.profiles?.[0];
    if (!profile?.id) {
      setFeedback({
        kind: "error",
        text: `No MindHive account found for ${target}. They need to sign up first.`,
      });
      return;
    }
    if (profile.id === round.createdBy?.id) {
      setFeedback({
        kind: "error",
        text: "The round creator can't also be a reviewer of their own round.",
      });
      return;
    }

    await updateRound({
      variables: {
        id: round.id,
        input: {
          reviewers: { connect: [{ id: profile.id }] },
        },
      },
    });
    setEmail("");
    setFeedback({
      kind: "ok",
      text: `Added ${displayName(profile)} as a reviewer.`,
    });
  };

  const handleRemove = async (reviewerId) => {
    if (
      !window.confirm(
        "Remove this reviewer? They'll lose access to opportunities in this round."
      )
    ) {
      return;
    }
    await updateRound({
      variables: {
        id: round.id,
        input: {
          reviewers: { disconnect: [{ id: reviewerId }] },
        },
      },
    });
    setFeedback({ kind: "ok", text: "Reviewer removed." });
  };

  return (
    <Card>
      <h2>Reviewers</h2>
      <p className="helper">
        Reviewers can see all opportunities submitted to this round, change
        their statuses (e.g. <code>pending_review → accepted</code>), and
        leave review notes. They cannot edit opportunity content — that
        stays with the mentor.
      </p>

      <Row>
        <input
          type="email"
          placeholder="Add by email…"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={looking || updating}
        >
          {looking || updating ? "Adding…" : "Add reviewer"}
        </button>
      </Row>

      {feedback ? <Feedback $kind={feedback.kind}>{feedback.text}</Feedback> : null}

      {reviewers.length === 0 ? (
        <Empty>No reviewers yet.</Empty>
      ) : (
        <ReviewerList>
          {reviewers.map((r) => (
            <ReviewerRow key={r.id}>
              <div className="who">
                <span className="name">{displayName(r)}</span>
                <span className="email">{r.email}</span>
              </div>
              <button
                className="remove"
                type="button"
                onClick={() => handleRemove(r.id)}
                disabled={updating}
              >
                Remove
              </button>
            </ReviewerRow>
          ))}
        </ReviewerList>
      )}
    </Card>
  );
}
