import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

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

const STATUS_OPTIONS = [
  { key: "preferences_open", text: "Preferences open", value: "preferences_open" },
  { key: "preferences_closed", text: "Preferences closed", value: "preferences_closed" },
  { key: "matching", text: "Matching", value: "matching" },
  { key: "published", text: "Published", value: "published" },
  { key: "archived", text: "Archived", value: "archived" },
];

const ALGO_OPTIONS = [
  { key: "stable_matching", text: "Stable matching (Gale-Shapley)", value: "stable_matching" },
  { key: "score_based", text: "Score-based", value: "score_based" },
  { key: "teacher_curated", text: "Teacher-curated", value: "teacher_curated" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "preferences_open",
  openAt: "",
  closeAt: "",
  matchingAlgorithm: "stable_matching",
};

function toDateInputValue(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function toIsoOrNull(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

export default function RoundEditor({ roundId }) {
  const router = useRouter();
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
      status: round.status || "preferences_open",
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
            status: inputs.status || "preferences_open",
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
            status: inputs.status || "preferences_open",
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

  return (
    <Shell>
      <TopBar>
        <div>
          <BackLink type="button" onClick={handleCancel}>
            <Icon name="arrow left" /> Back to rounds
          </BackLink>
          <h1>{isNew ? "New matching round" : "Edit round"}</h1>
        </div>
        {!isNew && (
          <Link
            href={{
              pathname: "/dashboard/connect/matches",
              query: { round: roundId },
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 100,
              border: "1px solid #336f8a",
              color: "#336f8a",
              fontFamily: "Nunito",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            <Icon name="random" /> Manage matches
          </Link>
        )}
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
              onChange={(_, { value }) =>
                handleMultipleUpdate({ status: value })
              }
            />
          </Field>
          <Field>
            <span className="label-text">Matching algorithm</span>
            <span className="hint">
              Used when you trigger matching after preferences close.
            </span>
            <Dropdown
              selection
              options={ALGO_OPTIONS}
              value={inputs.matchingAlgorithm}
              onChange={(_, { value }) =>
                handleMultipleUpdate({ matchingAlgorithm: value })
              }
            />
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
                    <div className="title">{opportunity.title}</div>
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

      <Actions>
        <Button type="button" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" $primary onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isNew ? "Create round" : "Save changes"}
        </Button>
      </Actions>
    </Shell>
  );
}
