import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
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

const DIRECT_VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i;

// Mentors sometimes paste the full <iframe ...> embed snippet instead of just
// the URL. Pull out the src attribute when we detect that case so downstream
// code receives a usable URL.
function extractUrl(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const m = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : trimmed;
}

// Same idea for cover image fields — handle a pasted <img src="..."> snippet.
function extractImageUrl(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const m = trimmed.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : trimmed;
}

function isDirectVideoFile(url) {
  if (!url) return false;
  try {
    return DIRECT_VIDEO_EXT.test(new URL(url).pathname);
  } catch {
    return DIRECT_VIDEO_EXT.test(url);
  }
}

function getEmbedUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const shortsMatch = u.pathname.match(/^\/shorts\/([^/]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      const embedMatch = u.pathname.match(/^\/embed\/([^/]+)/);
      if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.replace(/^\/(video\/)?/, "").split("/")[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host === "loom.com" || host.endsWith(".loom.com")) {
      const m = u.pathname.match(/\/(share|embed)\/([^/?]+)/);
      if (m) return `https://www.loom.com/embed/${m[2]}`;
    }
    if (host === "drive.google.com") {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
    return null;
  } catch {
    return null;
  }
}

function OpportunityMedia({ opportunity }) {
  const coverUrl =
    opportunity.coverImage?.url ||
    extractImageUrl(opportunity.coverImageUrl) ||
    null;
  const uploadedVideoUrl = opportunity.videoFile?.url || null;
  const rawVideoUrl = extractUrl(opportunity.videoUrl);

  // Pick how to render the video. Priority:
  //   1. Uploaded file        → HTML5 <video>
  //   2. Direct video URL     → HTML5 <video>
  //   3. Known embed platform → iframe with normalized embed URL
  //   4. Other external URL   → iframe as-is (best-effort)
  let videoNode = null;
  const directVideoSrc =
    uploadedVideoUrl || (isDirectVideoFile(rawVideoUrl) ? rawVideoUrl : null);
  const embedUrl = !directVideoSrc ? getEmbedUrl(rawVideoUrl) : null;
  const fallbackIframeSrc =
    !directVideoSrc && !embedUrl && rawVideoUrl ? rawVideoUrl : null;

  if (directVideoSrc) {
    videoNode = (
      <video
        controls
        preload="metadata"
        poster={coverUrl || undefined}
        src={directVideoSrc}
        style={{
          width: "100%",
          maxHeight: 360,
          borderRadius: 12,
          background: "#000",
        }}
      />
    );
  } else if (embedUrl || fallbackIframeSrc) {
    videoNode = (
      <div
        style={{
          position: "relative",
          paddingBottom: "56.25%",
          height: 0,
          borderRadius: 12,
          overflow: "hidden",
          background: "#000",
        }}
      >
        <iframe
          src={embedUrl || fallbackIframeSrc}
          title={`${opportunity.title} intro video`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          frameBorder="0"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    );
  }

  if (!coverUrl && !videoNode) return null;

  // The cover image is only used as the <video> poster when the video itself
  // is a direct file (HTML5 <video> supports the poster attribute). For iframe
  // embeds (YouTube / Vimeo / Loom / Drive) there's no poster mechanism, so we
  // show the cover image separately above the embed.
  const coverUsedAsPoster = !!directVideoSrc && !!coverUrl;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {coverUrl && !coverUsedAsPoster && (
        <img
          src={coverUrl}
          alt={opportunity.title}
          style={{
            width: "100%",
            maxHeight: 220,
            objectFit: "cover",
            borderRadius: 12,
            background: "#eef1f2",
          }}
        />
      )}
      {videoNode}
    </div>
  );
}

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
  const { t } = useTranslation("connect");
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

    // 1) Validation: when submitting (not drafting), enforce required questions.
    if (targetStatus === "submitted") {
      const missing = [];

      // Required round-level questions must have an answer.
      approvedRoundQuestions
        .filter((q) => q.isRequired)
        .forEach((q) => {
          const ans = roundAnswers[q.id];
          const empty =
            ans === undefined ||
            ans === null ||
            ans === "" ||
            (Array.isArray(ans) && ans.length === 0);
          if (empty) missing.push(`Round question: "${q.prompt}"`);
        });

      // Required opportunity-level questions must be answered ONLY for opps
      // the student is actually ranking (rank or star set).
      opportunities.forEach((opp) => {
        const r = rankings[opp.id] || {};
        const isRankingThis =
          r.rank !== "" && r.rank !== undefined && r.rank !== null;
        const isStarringThis =
          r.starRating !== "" &&
          r.starRating !== undefined &&
          r.starRating !== null;
        if (!isRankingThis && !isStarringThis) return;
        (opp.questions || [])
          .filter((q) => q.status === "approved" && q.isRequired)
          .forEach((q) => {
            const ans = (oppAnswers[opp.id] || {})[q.id];
            const empty =
              ans === undefined ||
              ans === null ||
              ans === "" ||
              (Array.isArray(ans) && ans.length === 0);
            if (empty)
              missing.push(`"${opp.title}" question: "${q.prompt}"`);
          });
      });

      if (missing.length > 0) {
        alert(
          `Please answer these required questions before submitting:\n\n• ${missing.join("\n• ")}`
        );
        return;
      }
    }

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
      (r) => r.raterRole === "student" && r.rater?.id === me?.id
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
    const teammateRatings =
      draft.teammateRatings === undefined
        ? myExistingRating?.teammateRatings || null
        : draft.teammateRatings;

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
              teammateRatings,
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
              teammateRatings,
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

  if (round.status === "draft") {
    return (
      <Shell>
        <TopBar>
          <div>
            <BackLink type="button" onClick={handleCancel}>
              <Icon name="arrow left" /> Back to rounds
            </BackLink>
            <h1>{round.title}</h1>
          </div>
        </TopBar>
        <Card>
          <p className="helper">
            {t("matchingRound.notAvailableYet", {}, {
              default:
                "This round is not available yet. Your teacher is still setting it up.",
            })}
          </p>
        </Card>
      </Shell>
    );
  }

  const now = Date.now();
  const openAtMs = round.openAt ? new Date(round.openAt).getTime() : null;
  const closeAtMs = round.closeAt ? new Date(round.closeAt).getTime() : null;
  const beforeOpen = openAtMs && now < openAtMs;
  const afterClose = closeAtMs && now > closeAtMs;
  const inTimeWindow = !beforeOpen && !afterClose;
  const submitted = existingPreference?.status === "submitted";
  // Once submitted, lock the form. Students still see what they sent.
  // (If the round re-opens after a teacher pushed status back, the form
  // unlocks automatically because `submitted` is recomputed from data.)
  const isOpen =
    round.status === "preferences_open" && inTimeWindow && !submitted;

  let lockReason = null;
  if (round.status === "draft") {
    lockReason = t("matchingRound.notAvailableYet", {}, {
      default:
        "This round is not available yet. Your teacher is still setting it up.",
    });
  } else if (round.status !== "preferences_open") {
    lockReason = `Preferences are ${round.status.replace("_", " ")} for this round. You can review what you submitted, but changes are no longer accepted.`;
  } else if (beforeOpen) {
    const openDate = new Date(round.openAt).toLocaleDateString();
    lockReason = `This round opens on ${openDate}. Come back then to submit your preferences.`;
  } else if (afterClose) {
    const closeDate = new Date(round.closeAt).toLocaleDateString();
    lockReason = `Preferences closed on ${closeDate}. You can review what you submitted, but changes are no longer accepted.`;
  } else if (submitted) {
    const when = existingPreference?.submittedAt
      ? new Date(existingPreference.submittedAt).toLocaleString()
      : "earlier";
    lockReason = `You submitted your preferences ${when}. Need to change something? Ask your teacher — they can reopen your submission.`;
  }

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

      {!isOpen && lockReason && (
        <Card>
          <p className="helper">
            <Icon name="lock" /> {lockReason}
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
            (r) => r.raterRole === "student" && r.rater?.id === me?.id
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
          const teammateRatings =
            draft.teammateRatings ??
            myExistingRating?.teammateRatings ??
            {};
          // Other students matched to the same opportunity (excluding me)
          const teammates = (opp?.matches || [])
            .map((m) => m.student)
            .filter((s) => s?.id && s.id !== me?.id);
          const showTeammateSection =
            (opp?.teamSize || 1) > 1 &&
            teammates.length > 0 &&
            match.status !== "proposed";
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
                  {showTeammateSection && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 12,
                        borderRadius: 12,
                        background: "#f7f9f8",
                        border: "1px solid #d3dae0",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <strong style={{ color: "#171717", fontSize: 14 }}>
                        Rate your teammates
                      </strong>
                      <span className="helper">
                        Only the teacher sees individual teammate ratings.
                        Helpful for understanding how the team worked together.
                      </span>
                      {teammates.map((t) => {
                        const tName =
                          `${t.firstName || ""} ${t.lastName || ""}`.trim() ||
                          t.username;
                        const tEntry =
                          (teammateRatings && teammateRatings[t.id]) || {};
                        const tStars = tEntry.rating || 0;
                        const tComment = tEntry.comment || "";
                        const setTeammate = (changes) =>
                          setRatingDrafts((prev) => {
                            const prevDraft = prev[match.id] || {};
                            const prevTm =
                              prevDraft.teammateRatings ??
                              myExistingRating?.teammateRatings ??
                              {};
                            return {
                              ...prev,
                              [match.id]: {
                                ...prevDraft,
                                teammateRatings: {
                                  ...prevTm,
                                  [t.id]: {
                                    ...(prevTm[t.id] || {}),
                                    ...changes,
                                  },
                                },
                              },
                            };
                          });
                        return (
                          <div
                            key={t.id}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              padding: 10,
                              borderRadius: 10,
                              background: "#ffffff",
                              border: "1px solid #eef1f2",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              <strong
                                style={{ color: "#171717", fontSize: 14 }}
                              >
                                {tName}
                              </strong>
                              <div style={{ display: "flex", gap: 2 }}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setTeammate({ rating: n })}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      fontSize: 18,
                                      color:
                                        n <= tStars ? "#f5b800" : "#d3dae0",
                                      padding: 0,
                                    }}
                                  >
                                    {n <= tStars ? "★" : "☆"}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <input
                              type="text"
                              value={tComment}
                              placeholder="Optional note (private)"
                              onChange={(e) =>
                                setTeammate({ comment: e.target.value })
                              }
                              style={{
                                padding: "6px 10px",
                                border: "1px solid #d3dae0",
                                borderRadius: 8,
                                fontFamily: "Inter, sans-serif",
                                fontSize: 13,
                                outline: "none",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
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
          const availableToMs = opp.availableTo
            ? new Date(opp.availableTo).getTime()
            : null;
          const availableFromMs = opp.availableFrom
            ? new Date(opp.availableFrom).getTime()
            : null;
          const oppExpired = availableToMs && availableToMs < now;
          const oppNotYetAvailable =
            availableFromMs && availableFromMs > now;
          const oppAvailable = !oppExpired && !oppNotYetAvailable;
          const rankingEnabled = isOpen && oppAvailable;
          return (
            <OpportunityRow key={opp.id}>
              <OpportunityMedia opportunity={opp} />
              <OppHead>
                <div>
                  <h3 className="title">{opp.title}</h3>
                  <div className="meta">
                    By {mentorName}
                    {opp.timeCommitment && ` · ${opp.timeCommitment}`}
                    {opp.teamSize > 1 && ` · Team of ${opp.teamSize}`}
                    {opp.publicRatingCount > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <span style={{ color: "#f5b800" }}>★</span>
                        {opp.publicRatingAverage?.toFixed(1)} (
                        {opp.publicRatingCount})
                      </>
                    )}
                  </div>
                  {(opp.availableFrom || opp.availableTo) && (
                    <div
                      className="meta"
                      style={{
                        color: oppExpired ? "#b3261e" : "#5f6871",
                      }}
                    >
                      Available{" "}
                      {opp.availableFrom
                        ? new Date(opp.availableFrom).toLocaleDateString()
                        : "—"}{" "}
                      →{" "}
                      {opp.availableTo
                        ? new Date(opp.availableTo).toLocaleDateString()
                        : "—"}
                    </div>
                  )}
                </div>
              </OppHead>
              {opp.shortDescription && (
                <p style={{ margin: 0, color: "#5f6871", fontSize: 14 }}>
                  {opp.shortDescription}
                </p>
              )}
              {!oppAvailable && (
                <div
                  style={{
                    padding: "10px 14px",
                    border: "1px solid #f1c8c8",
                    background: "#fdf1f1",
                    borderRadius: 10,
                    color: "#b3261e",
                    fontSize: 13,
                  }}
                >
                  <Icon name="warning circle" />{" "}
                  {oppExpired
                    ? `This opportunity ended on ${new Date(opp.availableTo).toLocaleDateString()}. You can no longer rank it.`
                    : `This opportunity starts on ${new Date(opp.availableFrom).toLocaleDateString()}. Ranking will unlock once it's available.`}
                </div>
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
                    disabled={!rankingEnabled}
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
                    disabled={!rankingEnabled}
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
                    disabled={!rankingEnabled}
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
                    Search any student in this round&apos;s class network — not
                    just your own class — and pick the people you&apos;d like
                    to be teamed up with on this opportunity. Order matters: the
                    first person is your top choice. Mutual nominations (both
                    of you pick each other) are the strongest signal.
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
                    disabled={!rankingEnabled}
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
