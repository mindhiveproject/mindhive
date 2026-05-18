import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

import { GET_PARTICIPATE_VIEW } from "../../../Queries/ConnectPreference";
import {
  CREATE_PREFERENCE,
  UPDATE_PREFERENCE,
  DELETE_PREFERENCE_ITEMS,
  CREATE_TEAM_PREFERENCES,
  DELETE_TEAM_PREFERENCES,
  CREATE_QUESTION_ANSWERS,
  DELETE_QUESTION_ANSWERS,
} from "../../../Mutations/ConnectPreference";
import {
  CREATE_RATING,
  UPDATE_RATING,
} from "../../../Mutations/ConnectRating";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 600;
    color: #171717;
  }
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #336f8a;
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
`;

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
    color: #5f6871;
    font-size: 14px;
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

  span.hint {
    color: #888;
    font-size: 12px;
  }

  input[type="text"],
  input[type="number"],
  textarea {
    padding: 10px 14px;
    border: 1px solid #d3dae0;
    border-radius: 12px;
    background: #ffffff;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: #171717;
    outline: none;

    &:focus {
      border-color: #336f8a;
    }
  }

  textarea {
    min-height: 90px;
    resize: vertical;
  }
`;

const OpportunityRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #d3dae0;
  border-radius: 12px;
`;

const OppHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;

  .title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #171717;
  }

  .meta {
    color: #5f6871;
    font-size: 12px;
    margin-top: 2px;
  }
`;

const RankControls = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: 120px 1fr 1fr;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 100px;
  border: 1px solid ${({ $primary }) => ($primary ? "#336f8a" : "#d3dae0")};
  background: ${({ $primary }) => ($primary ? "#336f8a" : "#ffffff")};
  color: ${({ $primary }) => ($primary ? "#ffffff" : "#336f8a")};
  font-family: "Nunito", sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $submitted }) => ($submitted ? "#e3f4ec" : "#fdf6e3")};
  color: ${({ $submitted }) => ($submitted ? "#1d6b3a" : "#7a5b00")};
`;

function QuestionInput({ question, value, onChange }) {
  const type = question.questionType;
  const options = Array.isArray(question.options) ? question.options : [];

  if (type === "long_text") {
    return (
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} />
    );
  }
  if (type === "single_select") {
    return (
      <Dropdown
        selection
        clearable
        options={options.map((o) => ({
          key: o.value || o.label,
          text: o.label || o.value,
          value: o.value || o.label,
        }))}
        value={value || ""}
        onChange={(_, { value: v }) => onChange(v)}
      />
    );
  }
  if (type === "multi_select") {
    return (
      <Dropdown
        selection
        multiple
        options={options.map((o) => ({
          key: o.value || o.label,
          text: o.label || o.value,
          value: o.value || o.label,
        }))}
        value={Array.isArray(value) ? value : []}
        onChange={(_, { value: v }) => onChange(v)}
      />
    );
  }
  if (type === "scale_1_5" || type === "scale_1_10") {
    const max = type === "scale_1_5" ? 5 : 10;
    const scaleOptions = Array.from({ length: max }, (_, i) => ({
      key: i + 1,
      text: `${i + 1}`,
      value: i + 1,
    }));
    return (
      <Dropdown
        selection
        clearable
        options={scaleOptions}
        value={value ?? ""}
        onChange={(_, { value: v }) => onChange(v === "" ? null : v)}
      />
    );
  }
  if (type === "yes_no") {
    return (
      <Dropdown
        selection
        clearable
        options={[
          { key: "yes", text: "Yes", value: true },
          { key: "no", text: "No", value: false },
        ]}
        value={value === true || value === false ? value : ""}
        onChange={(_, { value: v }) => onChange(v === "" ? null : v)}
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function ParticipateSubmission({ roundId, user }) {
  const router = useRouter();
  const { data, loading, refetch } = useQuery(GET_PARTICIPATE_VIEW, {
    variables: { roundId },
    fetchPolicy: "cache-and-network",
  });

  const round = data?.connectRound;
  const me = data?.authenticatedItem;
  const existingPreference = me?.connectPreferences?.[0];
  const existingTeamPrefs = me?.teamPreferencesSubmitted || [];
  const existingAnswers = me?.questionAnswers || [];

  const approvedRoundQuestions = (round?.questions || []).filter(
    (q) => q.status === "approved"
  );
  const opportunities = round?.opportunities || [];

  const networkStudents = (() => {
    const map = new Map();
    (round?.classNetwork?.classes || []).forEach((cls) => {
      (cls.students || []).forEach((s) => {
        if (s.id !== me?.id) map.set(s.id, s);
      });
    });
    return Array.from(map.values());
  })();

  const [roundAnswers, setRoundAnswers] = useState({});
  const [oppAnswers, setOppAnswers] = useState({});
  const [rankings, setRankings] = useState({});
  const [teammates, setTeammates] = useState({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!round) return;
    const rA = {};
    const oA = {};
    existingAnswers.forEach((a) => {
      const oppId = a.opportunity?.id;
      if (oppId) {
        if (!oA[oppId]) oA[oppId] = {};
        oA[oppId][a.question.id] = a.answer;
      } else if (a.question?.id) {
        rA[a.question.id] = a.answer;
      }
    });
    setRoundAnswers(rA);
    setOppAnswers(oA);

    const r = {};
    (existingPreference?.items || []).forEach((item) => {
      if (!item.opportunity?.id) return;
      r[item.opportunity.id] = {
        rank: item.rank ?? "",
        starRating: item.starRating ?? "",
        comment: item.comment || "",
      };
    });
    setRankings(r);

    const t = {};
    existingTeamPrefs.forEach((tp) => {
      const oppId = tp.opportunity?.id;
      const tmId = tp.preferredTeammate?.id;
      if (!oppId || !tmId) return;
      if (!t[oppId]) t[oppId] = [];
      t[oppId].push(tmId);
    });
    setTeammates(t);

    setNotes(existingPreference?.notes || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id, existingPreference?.id]);

  const [createPreference] = useMutation(CREATE_PREFERENCE);
  const [updatePreference] = useMutation(UPDATE_PREFERENCE);
  const [deletePreferenceItems] = useMutation(DELETE_PREFERENCE_ITEMS);
  const [deleteTeamPreferences] = useMutation(DELETE_TEAM_PREFERENCES);
  const [createTeamPreferences] = useMutation(CREATE_TEAM_PREFERENCES);
  const [deleteQuestionAnswers] = useMutation(DELETE_QUESTION_ANSWERS);
  const [createQuestionAnswers] = useMutation(CREATE_QUESTION_ANSWERS);
  const [createRating] = useMutation(CREATE_RATING);
  const [updateRating] = useMutation(UPDATE_RATING);

  const [saving, setSaving] = useState(false);
  const [ratingDrafts, setRatingDrafts] = useState({});
  const [savingRatingId, setSavingRatingId] = useState(null);

  const updateRanking = (oppId, key, value) => {
    setRankings((prev) => ({
      ...prev,
      [oppId]: { ...(prev[oppId] || {}), [key]: value },
    }));
  };

  const updateOppAnswer = (oppId, questionId, value) => {
    setOppAnswers((prev) => ({
      ...prev,
      [oppId]: { ...(prev[oppId] || {}), [questionId]: value },
    }));
  };

  const handleSave = async (targetStatus) => {
    if (!round) return;
    setSaving(true);
    try {
      // 1) Build items from rankings
      const items = Object.entries(rankings)
        .filter(
          ([, r]) =>
            r &&
            (r.rank !== "" || r.starRating !== "" || (r.comment || "").trim())
        )
        .map(([oppId, r]) => ({
          opportunity: { connect: { id: oppId } },
          rank: r.rank === "" ? null : Number(r.rank),
          starRating: r.starRating === "" ? null : Number(r.starRating),
          comment: r.comment || "",
        }));

      // 2) Wipe existing items, then upsert preference with new items
      if (existingPreference?.items?.length) {
        await deletePreferenceItems({
          variables: {
            where: existingPreference.items.map((i) => ({ id: i.id })),
          },
        });
      }

      const submittedAt =
        targetStatus === "submitted" ? new Date().toISOString() : null;

      if (existingPreference?.id) {
        await updatePreference({
          variables: {
            id: existingPreference.id,
            input: {
              status: targetStatus,
              notes,
              submittedAt,
              items: items.length ? { create: items } : undefined,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        await createPreference({
          variables: {
            input: {
              round: { connect: { id: round.id } },
              role: "student",
              status: targetStatus,
              notes,
              submittedAt,
              items: items.length ? { create: items } : undefined,
            },
          },
        });
      }

      // 3) Wipe + recreate question answers
      if (existingAnswers.length) {
        await deleteQuestionAnswers({
          variables: { where: existingAnswers.map((a) => ({ id: a.id })) },
        });
      }
      const newAnswers = [];
      Object.entries(roundAnswers).forEach(([qId, ans]) => {
        if (ans === undefined || ans === null || ans === "") return;
        newAnswers.push({
          question: { connect: { id: qId } },
          round: { connect: { id: round.id } },
          answer: ans,
        });
      });
      Object.entries(oppAnswers).forEach(([oppId, qMap]) => {
        Object.entries(qMap).forEach(([qId, ans]) => {
          if (ans === undefined || ans === null || ans === "") return;
          newAnswers.push({
            question: { connect: { id: qId } },
            round: { connect: { id: round.id } },
            opportunity: { connect: { id: oppId } },
            answer: ans,
          });
        });
      });
      if (newAnswers.length) {
        await createQuestionAnswers({ variables: { data: newAnswers } });
      }

      // 4) Wipe + recreate team preferences
      if (existingTeamPrefs.length) {
        await deleteTeamPreferences({
          variables: {
            where: existingTeamPrefs.map((t) => ({ id: t.id })),
          },
        });
      }
      const newTeamPrefs = [];
      Object.entries(teammates).forEach(([oppId, ids]) => {
        ids.forEach((tmId, idx) => {
          newTeamPrefs.push({
            round: { connect: { id: round.id } },
            opportunity: { connect: { id: oppId } },
            preferredTeammate: { connect: { id: tmId } },
            priority: idx + 1,
          });
        });
      });
      if (newTeamPrefs.length) {
        await createTeamPreferences({ variables: { data: newTeamPrefs } });
      }

      await refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.replace({ pathname: "/dashboard/connect/participate" });
  };

  const handleSaveRating = async (match) => {
    const draft = ratingDrafts[match.id] || {};
    const myExistingRating = (match.ratings || []).find(
      (r) => r.rater?.id === me?.id
    );
    const opportunityRating =
      draft.opportunityRating === undefined
        ? myExistingRating?.opportunityRating ?? null
        : Number(draft.opportunityRating);
    const feedback =
      draft.feedback === undefined
        ? myExistingRating?.feedback || ""
        : draft.feedback;
    const isPublic =
      draft.isPublic === undefined
        ? !!myExistingRating?.isPublic
        : !!draft.isPublic;

    if (!opportunityRating) {
      alert("Pick a star rating before saving.");
      return;
    }
    setSavingRatingId(match.id);
    try {
      if (myExistingRating) {
        await updateRating({
          variables: {
            id: myExistingRating.id,
            input: {
              opportunityRating,
              feedback,
              isPublic,
            },
          },
        });
      } else {
        await createRating({
          variables: {
            input: {
              match: { connect: { id: match.id } },
              opportunity: match.opportunity?.id
                ? { connect: { id: match.opportunity.id } }
                : undefined,
              raterRole: "student",
              opportunityRating,
              feedback,
              isPublic,
            },
          },
        });
      }
      await refetch();
      setRatingDrafts((prev) => ({ ...prev, [match.id]: {} }));
    } finally {
      setSavingRatingId(null);
    }
  };

  if (loading && !round) {
    return (
      <Shell>
        <p>Loading round…</p>
      </Shell>
    );
  }
  if (!round) {
    return (
      <Shell>
        <p>Round not found.</p>
      </Shell>
    );
  }

  const isOpen = round.status === "preferences_open";
  const submitted = existingPreference?.status === "submitted";

  return (
    <Shell>
      <TopBar>
        <div>
          <BackLink type="button" onClick={handleCancel}>
            <Icon name="arrow left" /> Back to rounds
          </BackLink>
          <h1>{round.title}</h1>
          <div style={{ marginTop: 6 }}>
            {existingPreference ? (
              <StatusPill $submitted={submitted}>
                {submitted ? "Submitted" : "Draft saved"}
              </StatusPill>
            ) : null}
          </div>
        </div>
      </TopBar>

      {!isOpen && (
        <Card>
          <p className="helper">
            Preferences are <strong>{round.status.replace("_", " ")}</strong>{" "}
            for this round. You can review what you submitted, but changes are
            no longer accepted.
          </p>
        </Card>
      )}

      {(me?.connectMatches || [])
        .filter((m) => m.status !== "proposed" || round.status === "published")
        .map((match) => {
          const opp = match.opportunity;
          const mentorName = opp?.mentor
            ? `${opp.mentor.firstName || ""} ${opp.mentor.lastName || ""}`.trim() ||
              opp.mentor.username
            : "Unknown";
          const myExistingRating = (match.ratings || []).find(
            (r) => r.rater?.id === me?.id
          );
          const draft = ratingDrafts[match.id] || {};
          const stars =
            draft.opportunityRating ??
            myExistingRating?.opportunityRating ??
            0;
          const feedback =
            draft.feedback ?? myExistingRating?.feedback ?? "";
          const isPublic =
            draft.isPublic ?? myExistingRating?.isPublic ?? false;
          return (
            <Card key={match.id}>
              <h2>Your match</h2>
              <p className="helper">
                You&apos;ve been matched to this opportunity for the round.
              </p>
              <div
                style={{
                  padding: 16,
                  border: "1px solid #d3dae0",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#171717",
                  }}
                >
                  {opp?.title || "(opportunity)"}
                </div>
                <div style={{ color: "#5f6871", fontSize: 13 }}>
                  By {mentorName} ·{" "}
                  <StatusPill $submitted={match.status === "active"}>
                    {match.status}
                  </StatusPill>
                </div>
                {opp?.shortDescription && (
                  <p style={{ margin: 0, color: "#5f6871", fontSize: 14 }}>
                    {opp.shortDescription}
                  </p>
                )}
              </div>

              {match.status !== "proposed" && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 16,
                    border: "1px dashed #d3dae0",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <strong style={{ color: "#171717" }}>
                    {myExistingRating ? "Update your rating" : "Rate this experience"}
                  </strong>
                  <Field>
                    <span className="label-text">Stars (1-5)</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() =>
                            setRatingDrafts((prev) => ({
                              ...prev,
                              [match.id]: {
                                ...(prev[match.id] || {}),
                                opportunityRating: n,
                              },
                            }))
                          }
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
                      onChange={(e) =>
                        setRatingDrafts((prev) => ({
                          ...prev,
                          [match.id]: {
                            ...(prev[match.id] || {}),
                            feedback: e.target.value,
                          },
                        }))
                      }
                      placeholder="What did you learn? What worked? What could improve?"
                    />
                  </Field>
                  <label
                    style={{
                      display: "inline-flex",
                      gap: 8,
                      alignItems: "center",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) =>
                        setRatingDrafts((prev) => ({
                          ...prev,
                          [match.id]: {
                            ...(prev[match.id] || {}),
                            isPublic: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span>Show this rating publicly on the opportunity page</span>
                  </label>
                  <div>
                    <Button
                      type="button"
                      $primary
                      onClick={() => handleSaveRating(match)}
                      disabled={savingRatingId === match.id}
                    >
                      {savingRatingId === match.id
                        ? "Saving…"
                        : myExistingRating
                        ? "Update rating"
                        : "Submit rating"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

      {approvedRoundQuestions.length > 0 && (
        <Card>
          <h2>Round questions</h2>
          <p className="helper">
            Answer these once. They&apos;re used to match you across
            opportunities.
          </p>
          {approvedRoundQuestions
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((q) => (
              <Field key={q.id}>
                <span className="label-text">
                  {q.prompt}
                  {q.isRequired && " *"}
                </span>
                {q.helperText && <span className="hint">{q.helperText}</span>}
                <QuestionInput
                  question={q}
                  value={roundAnswers[q.id]}
                  onChange={(v) =>
                    setRoundAnswers((prev) => ({ ...prev, [q.id]: v }))
                  }
                />
              </Field>
            ))}
        </Card>
      )}

      <Card>
        <h2>Rank opportunities</h2>
        <p className="helper">
          For each opportunity you&apos;re interested in, set a rank (1 = top
          choice) and an optional star rating. Leave fields empty for ones you
          don&apos;t want to be considered for.
        </p>
        {opportunities.length === 0 && (
          <p className="helper">
            No opportunities have been added to this round yet.
          </p>
        )}
        {opportunities.map((opp) => {
          const r = rankings[opp.id] || {};
          const oppApprovedQuestions = (opp.questions || []).filter(
            (q) => q.status === "approved"
          );
          const mentorName =
            opp.mentor?.firstName ||
            opp.mentor?.username ||
            "Unknown";
          const canPickTeammates =
            opp.teamSize > 1 && opp.allowsTeamPreferences;
          return (
            <OpportunityRow key={opp.id}>
              <OppHead>
                <div>
                  <h3 className="title">{opp.title}</h3>
                  <div className="meta">
                    By {mentorName}
                    {opp.timeCommitment && ` · ${opp.timeCommitment}`}
                    {opp.teamSize > 1 && ` · Team of ${opp.teamSize}`}
                  </div>
                </div>
              </OppHead>
              {opp.shortDescription && (
                <p style={{ margin: 0, color: "#5f6871", fontSize: 14 }}>
                  {opp.shortDescription}
                </p>
              )}
              <RankControls>
                <Field>
                  <span className="label-text">Rank</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1"
                    value={r.rank ?? ""}
                    onChange={(e) =>
                      updateRanking(opp.id, "rank", e.target.value)
                    }
                    disabled={!isOpen}
                  />
                </Field>
                <Field>
                  <span className="label-text">Stars (1-5)</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={r.starRating ?? ""}
                    onChange={(e) =>
                      updateRanking(opp.id, "starRating", e.target.value)
                    }
                    disabled={!isOpen}
                  />
                </Field>
                <Field>
                  <span className="label-text">Comment (private)</span>
                  <input
                    type="text"
                    value={r.comment || ""}
                    onChange={(e) =>
                      updateRanking(opp.id, "comment", e.target.value)
                    }
                    disabled={!isOpen}
                  />
                </Field>
              </RankControls>

              {oppApprovedQuestions.length > 0 && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <strong style={{ color: "#171717", fontSize: 14 }}>
                    Questions for this opportunity
                  </strong>
                  {oppApprovedQuestions
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((q) => (
                      <Field key={q.id}>
                        <span className="label-text">
                          {q.prompt}
                          {q.isRequired && " *"}
                        </span>
                        {q.helperText && (
                          <span className="hint">{q.helperText}</span>
                        )}
                        <QuestionInput
                          question={q}
                          value={(oppAnswers[opp.id] || {})[q.id]}
                          onChange={(v) => updateOppAnswer(opp.id, q.id, v)}
                        />
                      </Field>
                    ))}
                </div>
              )}

              {canPickTeammates && (
                <Field>
                  <span className="label-text">Preferred teammates</span>
                  <span className="hint">
                    Pick students you&apos;d like to be teamed up with on this
                    opportunity.
                  </span>
                  <Dropdown
                    placeholder="Search students"
                    fluid
                    multiple
                    selection
                    search
                    options={networkStudents.map((s) => ({
                      key: s.id,
                      text:
                        `${s.firstName || ""} ${s.lastName || ""}`.trim() ||
                        s.username,
                      value: s.id,
                    }))}
                    value={teammates[opp.id] || []}
                    onChange={(_, { value }) =>
                      setTeammates((prev) => ({ ...prev, [opp.id]: value }))
                    }
                    disabled={!isOpen}
                  />
                </Field>
              )}
            </OpportunityRow>
          );
        })}
      </Card>

      <Card>
        <h2>Additional notes</h2>
        <Field>
          <span className="hint">
            Anything else you want the teacher to know.
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!isOpen}
          />
        </Field>
      </Card>

      {isOpen && (
        <Actions>
          <Button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button
            type="button"
            $primary
            onClick={() => handleSave("submitted")}
            disabled={saving}
          >
            {saving ? "Saving…" : "Submit preferences"}
          </Button>
        </Actions>
      )}
    </Shell>
  );
}
