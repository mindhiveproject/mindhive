import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { Dropdown } from "semantic-ui-react";

import useForm from "../../../../lib/useForm";
import {
  GET_CONNECT_ROUND,
  MY_CONNECT_ROUNDS,
  NETWORK_OPPORTUNITIES_FOR_ROUND,
} from "../../../Queries/ConnectRound";
import { MY_CLASS_NETWORKS_FOR_OPPORTUNITY } from "../../../Queries/Opportunity";
import { QUESTION_LIBRARY } from "../../../Queries/ConnectQuestion";
import {
  CREATE_CONNECT_ROUND,
  UPDATE_CONNECT_ROUND,
} from "../../../Mutations/ConnectRound";
import ReviewersPanel from "./ReviewersPanel";
import Button from "../../../DesignSystem/Button";
import {
  STATUS_OPTIONS,
  ALGO_OPTIONS,
  ALGO_DESCRIPTIONS,
  EMPTY_FORM,
  toDateInputValue,
  toIsoOrNull,
  formatDateShort,
  isExpired,
} from "./roundFormConfig";

const BACK_CHEVRON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"
      fill="currentColor"
    />
  </svg>
);

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0px;
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
  scroll-padding-top: 126px;
`;

const TopBar = styled.header.attrs({ className: "Editor__TopBar" })`
  position: sticky;
  top: 70px;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: -8px calc(-1 * clamp(16px, 6vw, 64px)) 8px;
  padding: 10px clamp(16px, 6vw, 64px);
  background: rgba(247, 249, 248, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(211, 218, 224, 0.85);
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1 1 220px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-width: 0;
  flex: 1 1 auto;

  h1 {
    margin: 0;
    min-width: 0;
    max-width: 100%;
    font-family: "Lato", sans-serif;
    font-size: clamp(20px, 2.8vw, 26px);
    font-weight: 600;
    color: #171717;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 8px;
  color: #336f8a;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(51, 111, 138, 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #336f8a;
    outline-offset: 2px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  flex: 0 0 auto;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }
`;

const Row = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: ${({ $cols }) => $cols || "1fr"};

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
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
  input[type="date"],
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

const OpportunityRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #d3dae0;
  border-radius: 12px;
  cursor: pointer;

  &.selected {
    border-color: #336f8a;
    background: #eef5f9;
  }

  input {
    margin-top: 4px;
    width: 18px;
    height: 18px;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    font-weight: 600;
    color: #171717;
    font-size: 14px;
  }

  .meta {
    color: #5f6871;
    font-size: 12px;
  }
`;

export default function RoundEditor({ roundId }) {
  const router = useRouter();
  const { t } = useTranslation("connect");
  const isNew = roundId === "new";

  const { data: existing, loading: loadingRound } = useQuery(
    GET_CONNECT_ROUND,
    {
      variables: { id: roundId },
      skip: isNew,
      fetchPolicy: "cache-and-network",
    }
  );

  const { data: networksData } = useQuery(MY_CLASS_NETWORKS_FOR_OPPORTUNITY);
  const allNetworks = networksData?.classNetworks || [];

  const round = existing?.connectRound;

  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [selectedOpportunities, setSelectedOpportunities] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const { inputs, handleChange, handleMultipleUpdate } = useForm(EMPTY_FORM);

  useEffect(() => {
    if (!round) return;
    handleMultipleUpdate({
      title: round.title || "",
      description: round.description || "",
      status: round.status || "draft",
      openAt: toDateInputValue(round.openAt),
      closeAt: toDateInputValue(round.closeAt),
      matchingAlgorithm: round.matchingAlgorithm || "stable_matching",
    });
    setSelectedNetwork(round.classNetwork?.id || null);
    setSelectedOpportunities(
      (round.opportunities || []).map((o) => o.id)
    );
    setSelectedQuestions((round.questions || []).map((q) => q.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id]);

  const { data: libraryData } = useQuery(QUESTION_LIBRARY, {
    fetchPolicy: "cache-and-network",
  });
  const libraryQuestions = (libraryData?.connectQuestions || []).filter(
    (q) => q.status === "approved"
  );

  const { data: opportunitiesData } = useQuery(
    NETWORK_OPPORTUNITIES_FOR_ROUND,
    {
      variables: { classNetworkId: selectedNetwork },
      skip: !selectedNetwork,
      fetchPolicy: "cache-and-network",
    }
  );
  const networkOpportunities = opportunitiesData?.opportunities || [];

  const [createConnectRound, { loading: creating }] = useMutation(
    CREATE_CONNECT_ROUND,
    { refetchQueries: [{ query: MY_CONNECT_ROUNDS }] }
  );
  const [updateConnectRound, { loading: updating }] = useMutation(
    UPDATE_CONNECT_ROUND,
    {
      refetchQueries: isNew
        ? [{ query: MY_CONNECT_ROUNDS }]
        : [
            { query: MY_CONNECT_ROUNDS },
            { query: GET_CONNECT_ROUND, variables: { id: roundId } },
          ],
      awaitRefetchQueries: true,
    }
  );
  const saving = creating || updating;

  const toggleOpportunity = (id) => {
    setSelectedOpportunities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleQuestion = (id) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleStatusChange = (value) => {
    if (
      inputs.status === "draft" &&
      value === "preferences_open" &&
      !window.confirm(
        "Students in this network will see this round and can submit preferences. Continue?"
      )
    ) {
      return;
    }
    handleMultipleUpdate({ status: value });
  };

  const handleSave = async () => {
    if (!inputs.title?.trim()) {
      alert("Title is required.");
      return;
    }
    if (!selectedNetwork) {
      alert("Pick a class network for this round.");
      return;
    }

    const opportunitiesConnect = selectedOpportunities.map((id) => ({ id }));
    const questionsConnect = selectedQuestions.map((id) => ({ id }));

    if (isNew) {
      await createConnectRound({
        variables: {
          input: {
            title: inputs.title,
            description: inputs.description || "",
            classNetwork: { connect: { id: selectedNetwork } },
            status: inputs.status || "draft",
            openAt: toIsoOrNull(inputs.openAt),
            closeAt: toIsoOrNull(inputs.closeAt),
            matchingAlgorithm:
              inputs.matchingAlgorithm || "stable_matching",
            opportunities: opportunitiesConnect.length
              ? { connect: opportunitiesConnect }
              : undefined,
            questions: questionsConnect.length
              ? { connect: questionsConnect }
              : undefined,
          },
        },
      });
    } else {
      await updateConnectRound({
        variables: {
          id: roundId,
          input: {
            title: inputs.title,
            description: inputs.description || "",
            classNetwork: { connect: { id: selectedNetwork } },
            status: inputs.status || "draft",
            openAt: toIsoOrNull(inputs.openAt),
            closeAt: toIsoOrNull(inputs.closeAt),
            matchingAlgorithm:
              inputs.matchingAlgorithm || "stable_matching",
            opportunities: { set: opportunitiesConnect },
            questions: { set: questionsConnect },
            updatedAt: new Date().toISOString(),
            publishedAt:
              inputs.status === "published" && !round?.publishedAt
                ? new Date().toISOString()
                : undefined,
          },
        },
      });
    }
    router.replace({ pathname: "/dashboard/connect/rounds" });
  };

  const handleCancel = () => {
    router.replace({ pathname: "/dashboard/connect/rounds" });
  };

  if (!isNew && loadingRound && !round) {
    return (
      <Shell>
        <p>Loading round…</p>
      </Shell>
    );
  }

  const entityTitle = (inputs.title || "").trim();
  const pageTitle = entityTitle
    ? entityTitle
    : isNew
    ? t("matchingRound.editor.pageTitleNew", {}, {
        default: "New matching round",
      })
    : t("matchingRound.editor.pageTitleEdit", {}, {
        default: "Edit round",
      });
  const backLabel = t("matchingRound.editor.backLink", {}, {
    default: "Back to rounds",
  });
  const primaryLabel = saving
    ? t("matchingRound.editor.saving", {}, { default: "Saving…" })
    : isNew
    ? t("matchingRound.editor.create", {}, { default: "Create round" })
    : t("matchingRound.editor.save", {}, { default: "Save changes" });
  const manageMatchesLabel = t("matchingRound.editor.manageMatches", {}, {
    default: "Manage matches",
  });

  return (
    <Shell>
      <TopBar>
        <TopBarLeft>
          <BackLink
            type="button"
            onClick={handleCancel}
            disabled={saving}
            aria-label={backLabel}
            title={backLabel}
          >
            {BACK_CHEVRON}
          </BackLink>
          <TitleRow>
            <h1 title={pageTitle}>{pageTitle}</h1>
          </TitleRow>
        </TopBarLeft>
        <Actions>
          {!isNew && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push({
                  pathname: "/dashboard/connect/matches",
                  query: { round: roundId },
                })
              }
            >
              {manageMatchesLabel}
            </Button>
          )}
          <Button
            type="button"
            variant="filled"
            onClick={handleSave}
            disabled={saving}
          >
            {primaryLabel}
          </Button>
        </Actions>
      </TopBar>

      <Card>
        <h2>Basics</h2>
        <Field>
          <span className="label-text">Title</span>
          <input
            type="text"
            name="title"
            value={inputs.title}
            onChange={handleChange}
            placeholder="e.g. Spring 2026 mentorship matching"
          />
        </Field>
        <Field>
          <span className="label-text">Description</span>
          <textarea
            name="description"
            value={inputs.description}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <span className="label-text">Class network</span>
          <span className="hint">
            Students and opportunities from this network will be in scope.
          </span>
          <Dropdown
            placeholder="Select a class network"
            fluid
            selection
            search
            options={allNetworks.map((n) => ({
              key: n.id,
              text: n.title,
              value: n.id,
            }))}
            value={selectedNetwork}
            onChange={(_, { value }) => {
              setSelectedNetwork(value);
              setSelectedOpportunities([]);
            }}
          />
        </Field>
      </Card>

      <Card>
        <h2>Lifecycle</h2>
        <Row $cols="1fr 1fr">
          <Field>
            <span className="label-text">Preferences open from</span>
            <input
              type="date"
              name="openAt"
              value={inputs.openAt}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">Preferences close on</span>
            <input
              type="date"
              name="closeAt"
              value={inputs.closeAt}
              onChange={handleChange}
            />
          </Field>
        </Row>
        <Row $cols="1fr 1fr">
          <Field>
            <span className="label-text">Status</span>
            <Dropdown
              selection
              options={STATUS_OPTIONS}
              value={inputs.status}
              onChange={(_, { value }) => handleStatusChange(value)}
            />
          </Field>
          <Field>
            <span className="label-text">Matching algorithm</span>
            <span className="hint">
              The algorithm runs when you click <strong>Run matching</strong>{" "}
              on the matches dashboard — not now. You can change this anytime
              before then, including after the round opens for preferences.
            </span>
            <Dropdown
              selection
              options={ALGO_OPTIONS}
              value={inputs.matchingAlgorithm}
              onChange={(_, { value }) =>
                handleMultipleUpdate({ matchingAlgorithm: value })
              }
            />
            {ALGO_DESCRIPTIONS[inputs.matchingAlgorithm] && (
              <div
                style={{
                  marginTop: 8,
                  padding: "10px 14px",
                  border: "1px solid #d3dae0",
                  borderRadius: 12,
                  background: "#f7f9f8",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#5f6871",
                }}
              >
                <strong style={{ color: "#171717" }}>
                  {ALGO_DESCRIPTIONS[inputs.matchingAlgorithm].title}
                </strong>
                <div style={{ marginTop: 4 }}>
                  {ALGO_DESCRIPTIONS[inputs.matchingAlgorithm].body}
                </div>
              </div>
            )}
          </Field>
        </Row>
      </Card>

      <Card>
        <h2>Opportunities in this round</h2>
        {!selectedNetwork && (
          <p style={{ color: "#5f6871", fontSize: 14 }}>
            Pick a class network above to see opportunities available for this
            round.
          </p>
        )}
        {selectedNetwork && networkOpportunities.length === 0 && (
          <p style={{ color: "#5f6871", fontSize: 14 }}>
            No opportunities have been added to this class network yet. Mentors
            can publish opportunities and select this network as a destination.
          </p>
        )}
        {selectedNetwork && networkOpportunities.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {networkOpportunities.map((opportunity) => {
              const checked = selectedOpportunities.includes(opportunity.id);
              const mentorName =
                opportunity.mentor?.firstName || opportunity.mentor?.username;
              const from = formatDateShort(opportunity.availableFrom);
              const to = formatDateShort(opportunity.availableTo);
              const expired = isExpired(opportunity.availableTo);
              return (
                <OpportunityRow
                  key={opportunity.id}
                  className={checked ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOpportunity(opportunity.id)}
                  />
                  <div className="body">
                    <div className="title">
                      {opportunity.title}
                      {expired && (
                        <span
                          style={{
                            marginLeft: 8,
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: 100,
                            background: "#f8e1e1",
                            color: "#b3261e",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Expired
                        </span>
                      )}
                    </div>
                    {opportunity.shortDescription && (
                      <div className="meta">
                        {opportunity.shortDescription}
                      </div>
                    )}
                    <div className="meta">
                      {mentorName && <>By {mentorName} · </>}
                      Capacity {opportunity.studentCapacity ?? 1}
                      {opportunity.teamSize > 1 &&
                        ` · Team of ${opportunity.teamSize}`}
                      {opportunity.status &&
                        opportunity.status !== "published" &&
                        ` · ${opportunity.status}`}
                    </div>
                    {(from || to) && (
                      <div
                        className="meta"
                        style={{ color: expired ? "#b3261e" : "#5f6871" }}
                      >
                        Available {from || "—"} → {to || "—"}
                        {opportunity.timeCommitment &&
                          ` · ${opportunity.timeCommitment}`}
                      </div>
                    )}
                  </div>
                </OpportunityRow>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2>Round questions</h2>
        <p style={{ color: "#5f6871", fontSize: 14, margin: 0 }}>
          Students answer these questions once when participating in this
          round. Pick from approved library questions.
        </p>
        {libraryQuestions.length === 0 ? (
          <p style={{ color: "#5f6871", fontSize: 14 }}>
            No approved library questions yet. Add some in{" "}
            <strong>Question library</strong>.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {libraryQuestions.map((question) => {
              const checked = selectedQuestions.includes(question.id);
              return (
                <OpportunityRow
                  key={question.id}
                  className={checked ? "selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleQuestion(question.id)}
                  />
                  <div className="body">
                    <div className="title">{question.prompt}</div>
                    <div className="meta">
                      {question.questionType}
                      {question.isRequired && " · required"}
                      {typeof question.weight === "number" &&
                        ` · weight ${question.weight}`}
                    </div>
                  </div>
                </OpportunityRow>
              );
            })}
          </div>
        )}
      </Card>

      {!isNew && round ? <ReviewersPanel round={round} /> : null}
    </Shell>
  );
}
