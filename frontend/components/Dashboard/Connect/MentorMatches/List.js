import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import styled from "styled-components";
import { Icon, Label } from "semantic-ui-react";

import { MY_MENTOR_MATCHES } from "../../../Queries/Opportunity";
import {
  CREATE_RATING,
  UPDATE_RATING,
} from "../../../Mutations/ConnectRating";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const Header = styled.div`
  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    color: #171717;
  }
  p {
    margin: 4px 0 0;
    color: #5f6871;
    font-size: 14px;
    max-width: 640px;
  }
`;

const OpportunityCard = styled.div`
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
    color: #5f6871;
    font-size: 14px;
  }
`;

const StudentRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #d3dae0;
  border-radius: 12px;

  .student-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .name {
    font-weight: 600;
    color: #171717;
    font-size: 15px;
  }

  .meta {
    color: #5f6871;
    font-size: 12px;
    margin-top: 2px;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: "Lato", sans-serif;
  font-size: 14px;
  color: #5f6871;

  span.label-text {
    font-weight: 600;
    color: #171717;
  }

  textarea {
    padding: 10px 14px;
    border: 1px solid #d3dae0;
    border-radius: 12px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: #171717;
    outline: none;
    min-height: 80px;
    resize: vertical;

    &:focus {
      border-color: #336f8a;
    }
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 100px;
  border: 1px solid ${({ $primary }) => ($primary ? "#336f8a" : "#d3dae0")};
  background: ${({ $primary }) => ($primary ? "#336f8a" : "#ffffff")};
  color: ${({ $primary }) => ($primary ? "#ffffff" : "#336f8a")};
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  color: #5f6871;
`;

const STATUS_COLORS = {
  proposed: "yellow",
  active: "green",
  completed: "blue",
  declined: "red",
  cancelled: "grey",
};

const TAG_OPTIONS = [
  "engaged",
  "responsive",
  "curious",
  "diligent",
  "creative",
  "challenging",
];

function displayName(profile) {
  if (!profile) return "Unknown";
  return (
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    profile.username
  );
}

function StudentMatchCard({ match, opportunity, me, onSaved }) {
  const myRating = (match.ratings || []).find(
    (r) => r.raterRole === "mentor" && r.rater?.id === me?.id,
  );

  const [stars, setStars] = useState(myRating?.mentorRating || 0);
  const [feedback, setFeedback] = useState(myRating?.feedback || "");
  const [tags, setTags] = useState(
    Array.isArray(myRating?.tags) ? myRating.tags : [],
  );
  const [isPublic, setIsPublic] = useState(!!myRating?.isPublic);
  const [saving, setSaving] = useState(false);

  const [createRating] = useMutation(CREATE_RATING);
  const [updateRating] = useMutation(UPDATE_RATING);

  const toggleTag = (t) => {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const handleSave = async () => {
    if (!stars) {
      alert("Pick a star rating before saving.");
      return;
    }
    setSaving(true);
    try {
      if (myRating) {
        await updateRating({
          variables: {
            id: myRating.id,
            input: {
              mentorRating: stars,
              feedback,
              tags,
              isPublic,
            },
          },
        });
      } else {
        await createRating({
          variables: {
            input: {
              match: { connect: { id: match.id } },
              opportunity: opportunity?.id
                ? { connect: { id: opportunity.id } }
                : undefined,
              raterRole: "mentor",
              mentorRating: stars,
              feedback,
              tags,
              isPublic,
            },
          },
        });
      }
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const proposedDate = match.proposedAt
    ? new Date(match.proposedAt).toLocaleDateString()
    : null;

  return (
    <StudentRow>
      <div className="student-header">
        <div>
          <div className="name">{displayName(match.student)}</div>
          <div className="meta">
            {match.student?.email && <>{match.student.email} · </>}
            {proposedDate && <>Matched {proposedDate} · </>}
            score{" "}
            {typeof match.matchScore === "number"
              ? match.matchScore.toFixed(0)
              : "—"}
          </div>
        </div>
        <Label color={STATUS_COLORS[match.status] || "grey"} size="tiny">
          {match.status}
        </Label>
      </div>

      <Field>
        <span className="label-text">Rate this student (1–5 stars)</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 24,
                color: n <= stars ? "#f5b800" : "#d3dae0",
                padding: 0,
              }}
            >
              {n <= stars ? "★" : "☆"}
            </button>
          ))}
        </div>
      </Field>

      <Field>
        <span className="label-text">Feedback</span>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What did this student do well? What could improve?"
        />
      </Field>

      <Field>
        <span className="label-text">Tags</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TAG_OPTIONS.map((t) => {
            const active = tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 100,
                  border: `1px solid ${active ? "#336f8a" : "#d3dae0"}`,
                  background: active ? "#336f8a" : "#ffffff",
                  color: active ? "#ffffff" : "#5f6871",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </Field>

      <label
        style={{
          display: "inline-flex",
          gap: 8,
          alignItems: "center",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        <span>Show this rating publicly on the student&apos;s profile</span>
      </label>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button $primary type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : myRating ? "Update rating" : "Submit rating"}
        </Button>
      </div>
    </StudentRow>
  );
}

export default function MentorMatchesList({ user }) {
  const { data, loading, refetch } = useQuery(MY_MENTOR_MATCHES, {
    fetchPolicy: "cache-and-network",
  });

  const opportunities = data?.authenticatedItem?.opportunitiesCreated || [];
  const me = data?.authenticatedItem;

  // Only show opportunities that actually have matches — clutter-reducer
  const opportunitiesWithMatches = opportunities.filter(
    (o) =>
      (o.matches || []).filter(
        (m) =>
          m.status === "active" ||
          m.status === "completed" ||
          m.status === "proposed",
      ).length > 0,
  );

  return (
    <Shell>
      <Header>
        <h1>My matched students</h1>
        <p>
          Students placed on your opportunities. After a project is active or
          completed, rate the student so future teachers and admins can see
          their track record.
        </p>
      </Header>

      {loading && opportunitiesWithMatches.length === 0 && (
        <Empty>Loading…</Empty>
      )}

      {!loading && opportunitiesWithMatches.length === 0 && (
        <Empty>
          No matches yet. When teachers run matching on a round that includes
          one of your opportunities, the students appear here.
        </Empty>
      )}

      {opportunitiesWithMatches.map((opportunity) => {
        const visibleMatches = (opportunity.matches || []).filter(
          (m) => m.status !== "cancelled" && m.status !== "declined",
        );
        const coverSrc =
          opportunity.coverImage?.url || opportunity.coverImageUrl;
        return (
          <OpportunityCard key={opportunity.id}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {coverSrc && (
                <div
                  style={{
                    width: 80,
                    height: 60,
                    borderRadius: 8,
                    background: `url(${coverSrc}) center/cover no-repeat #eef1f2`,
                    flex: "none",
                  }}
                />
              )}
              <div>
                <h2>{opportunity.title}</h2>
                <div className="helper">
                  <Icon name="users" /> {visibleMatches.length} matched
                  student{visibleMatches.length === 1 ? "" : "s"} ·
                  capacity {opportunity.studentCapacity || 1}
                </div>
              </div>
            </div>
            {visibleMatches.map((match) => (
              <StudentMatchCard
                key={match.id}
                match={match}
                opportunity={opportunity}
                me={me}
                onSaved={refetch}
              />
            ))}
          </OpportunityCard>
        );
      })}
    </Shell>
  );
}
