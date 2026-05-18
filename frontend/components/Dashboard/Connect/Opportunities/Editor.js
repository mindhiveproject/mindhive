import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

import useForm from "../../../../lib/useForm";
import {
  GET_OPPORTUNITY,
  MY_CLASS_NETWORKS_FOR_OPPORTUNITY,
  MY_OPPORTUNITIES,
} from "../../../Queries/Opportunity";
import { QUESTIONS_FOR_OPPORTUNITY } from "../../../Queries/ConnectQuestion";
import {
  CREATE_OPPORTUNITY,
  UPDATE_OPPORTUNITY,
} from "../../../Mutations/Opportunity";
import {
  CREATE_QUESTION,
  DELETE_QUESTION,
} from "../../../Mutations/ConnectQuestion";

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
  input[type="number"],
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
    min-height: 120px;
    resize: vertical;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid #d3dae0;
    border-radius: 100px;
    background: #ffffff;
    cursor: pointer;
    font-size: 13px;
  }

  label.active {
    background: #336f8a;
    color: #ffffff;
    border-color: #336f8a;
  }

  input {
    display: none;
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

const GRADE_OPTIONS = [
  { value: "middle", label: "Middle School" },
  { value: "nine", label: "9 - 10 Grade" },
  { value: "eleven", label: "11 - 12 Grade" },
];

const CLASS_TYPE_OPTIONS = [
  { value: "accelerated", label: "Accelerated" },
  { value: "nonAccelerated", label: "Non-Accelerated" },
  { value: "ell", label: "ELL" },
];

const GROUP_FORMAT_OPTIONS = [
  { key: "individual", text: "Individual", value: "individual" },
  { key: "team", text: "Team", value: "team" },
  { key: "either", text: "Either", value: "either" },
];

const STATUS_OPTIONS = [
  { key: "draft", text: "Draft (not visible to students)", value: "draft" },
  { key: "published", text: "Published", value: "published" },
  { key: "closed", text: "Closed", value: "closed" },
];

const EMPTY_FORM = {
  title: "",
  shortDescription: "",
  description: "",
  coverImageUrl: "",
  videoUrl: "",
  availableFrom: "",
  availableTo: "",
  timeCommitment: "",
  studentCapacity: 1,
  teamSize: 1,
  allowsTeamPreferences: false,
  preferGroupFormat: "either",
  status: "draft",
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

export default function OpportunityEditor({ opportunityId }) {
  const router = useRouter();
  const isNew = opportunityId === "new";

  const { data: existing, loading: loadingOpportunity } = useQuery(
    GET_OPPORTUNITY,
    {
      variables: { id: opportunityId },
      skip: isNew,
      fetchPolicy: "cache-and-network",
    }
  );

  const { data: networksData } = useQuery(MY_CLASS_NETWORKS_FOR_OPPORTUNITY);
  const allNetworks = networksData?.classNetworks || [];

  const opportunity = existing?.opportunity;

  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedClassTypes, setSelectedClassTypes] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState([]);

  const [questionDraft, setQuestionDraft] = useState({
    prompt: "",
    questionType: "short_text",
    optionsText: "",
    isRequired: false,
  });

  const { data: questionsData, refetch: refetchQuestions } = useQuery(
    QUESTIONS_FOR_OPPORTUNITY,
    {
      variables: { opportunityId },
      skip: isNew,
      fetchPolicy: "cache-and-network",
    }
  );
  const opportunityQuestions = questionsData?.connectQuestions || [];

  const [createQuestion, { loading: addingQuestion }] = useMutation(
    CREATE_QUESTION
  );
  const [deleteQuestion] = useMutation(DELETE_QUESTION);

  const { inputs, handleChange, handleMultipleUpdate, toggleBoolean } = useForm(
    EMPTY_FORM
  );

  useEffect(() => {
    if (!opportunity) return;
    handleMultipleUpdate({
      title: opportunity.title || "",
      shortDescription: opportunity.shortDescription || "",
      description: opportunity.description || "",
      coverImageUrl: opportunity.coverImageUrl || "",
      videoUrl: opportunity.videoUrl || "",
      availableFrom: toDateInputValue(opportunity.availableFrom),
      availableTo: toDateInputValue(opportunity.availableTo),
      timeCommitment: opportunity.timeCommitment || "",
      studentCapacity: opportunity.studentCapacity ?? 1,
      teamSize: opportunity.teamSize ?? 1,
      allowsTeamPreferences: !!opportunity.allowsTeamPreferences,
      preferGroupFormat: opportunity.preferGroupFormat || "either",
      status: opportunity.status || "draft",
    });
    setSelectedGrades(opportunity.preferGradeLevels || []);
    setSelectedClassTypes(opportunity.preferClassType || []);
    setSelectedNetworks(
      (opportunity.classNetworks || []).map((n) => n.id)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunity?.id]);

  const [createOpportunity, { loading: creating }] = useMutation(
    CREATE_OPPORTUNITY,
    {
      refetchQueries: [{ query: MY_OPPORTUNITIES }],
    }
  );
  const [updateOpportunity, { loading: updating }] = useMutation(
    UPDATE_OPPORTUNITY,
    {
      refetchQueries: isNew
        ? [{ query: MY_OPPORTUNITIES }]
        : [
            { query: MY_OPPORTUNITIES },
            { query: GET_OPPORTUNITY, variables: { id: opportunityId } },
          ],
      awaitRefetchQueries: true,
    }
  );

  const saving = creating || updating;

  const toggleGrade = (value) => {
    setSelectedGrades((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleClassType = (value) => {
    setSelectedClassTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const SELECT_TYPES = ["single_select", "multi_select"];

  const handleAddQuestion = async () => {
    if (!questionDraft.prompt?.trim()) {
      alert("Question prompt is required.");
      return;
    }
    const needsOptions = SELECT_TYPES.includes(questionDraft.questionType);
    const options = needsOptions
      ? questionDraft.optionsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((label) => ({ label, value: label }))
      : null;
    if (needsOptions && (!options || options.length === 0)) {
      alert("Provide at least one option for a select question.");
      return;
    }
    await createQuestion({
      variables: {
        input: {
          prompt: questionDraft.prompt,
          questionType: questionDraft.questionType,
          options,
          scope: "opportunity",
          opportunity: { connect: { id: opportunityId } },
          status: "approved",
          isRequired: !!questionDraft.isRequired,
          weight: 1.0,
          order: opportunityQuestions.length,
        },
      },
    });
    setQuestionDraft({
      prompt: "",
      questionType: "short_text",
      optionsText: "",
      isRequired: false,
    });
    refetchQuestions();
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    await deleteQuestion({ variables: { id } });
    refetchQuestions();
  };

  const handleSave = async () => {
    if (!inputs.title?.trim()) {
      alert("Title is required.");
      return;
    }

    const variables = {
      title: inputs.title,
      shortDescription: inputs.shortDescription || "",
      description: inputs.description || "",
      coverImageUrl: inputs.coverImageUrl || "",
      videoUrl: inputs.videoUrl || "",
      classNetworks: selectedNetworks.map((id) => ({ id })),
      availableFrom: toIsoOrNull(inputs.availableFrom),
      availableTo: toIsoOrNull(inputs.availableTo),
      timeCommitment: inputs.timeCommitment || "",
      studentCapacity: Number(inputs.studentCapacity) || 1,
      teamSize: Number(inputs.teamSize) || 1,
      allowsTeamPreferences: !!inputs.allowsTeamPreferences,
      preferGradeLevels: selectedGrades,
      preferGroupFormat: inputs.preferGroupFormat || "either",
      preferClassType: selectedClassTypes,
      status: inputs.status || "draft",
    };

    if (isNew) {
      const { data: created } = await createOpportunity({ variables });
      if (created?.createOpportunity?.id) {
        router.replace({
          pathname: "/dashboard/connect/opportunities",
        });
      }
    } else {
      await updateOpportunity({
        variables: {
          ...variables,
          id: opportunityId,
          updatedAt: new Date().toISOString(),
        },
      });
      router.replace({
        pathname: "/dashboard/connect/opportunities",
      });
    }
  };

  const handleCancel = () => {
    router.replace({ pathname: "/dashboard/connect/opportunities" });
  };

  if (!isNew && loadingOpportunity && !opportunity) {
    return (
      <Shell>
        <p>Loading opportunity…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar>
        <div>
          <BackLink type="button" onClick={handleCancel}>
            <Icon name="arrow left" /> Back to opportunities
          </BackLink>
          <h1>{isNew ? "New opportunity" : "Edit opportunity"}</h1>
        </div>
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
            placeholder="e.g. Neuroscience summer mentorship"
          />
        </Field>
        <Field>
          <span className="label-text">Short description</span>
          <span className="hint">One-sentence summary shown on cards.</span>
          <input
            type="text"
            name="shortDescription"
            value={inputs.shortDescription}
            onChange={handleChange}
          />
        </Field>
        <Field>
          <span className="label-text">Full description</span>
          <textarea
            name="description"
            value={inputs.description}
            onChange={handleChange}
            placeholder="What will students do? What will they learn?"
          />
        </Field>
        <Row $cols="1fr 1fr">
          <Field>
            <span className="label-text">Cover image URL</span>
            <span className="hint">Direct link to an image (upload coming).</span>
            <input
              type="text"
              name="coverImageUrl"
              value={inputs.coverImageUrl}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">Video URL</span>
            <span className="hint">YouTube, Vimeo, or other embed link.</span>
            <input
              type="text"
              name="videoUrl"
              value={inputs.videoUrl}
              onChange={handleChange}
            />
          </Field>
        </Row>
      </Card>

      <Card>
        <h2>Availability & capacity</h2>
        <Row $cols="1fr 1fr">
          <Field>
            <span className="label-text">Available from</span>
            <input
              type="date"
              name="availableFrom"
              value={inputs.availableFrom}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">Available to</span>
            <input
              type="date"
              name="availableTo"
              value={inputs.availableTo}
              onChange={handleChange}
            />
          </Field>
        </Row>
        <Field>
          <span className="label-text">Time commitment</span>
          <input
            type="text"
            name="timeCommitment"
            value={inputs.timeCommitment}
            onChange={handleChange}
            placeholder="e.g. 3 hours per week for 8 weeks"
          />
        </Field>
        <Row $cols="1fr 1fr 1fr">
          <Field>
            <span className="label-text">Student capacity</span>
            <input
              type="number"
              name="studentCapacity"
              min="1"
              value={inputs.studentCapacity}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">Team size</span>
            <span className="hint">1 = solo placement.</span>
            <input
              type="number"
              name="teamSize"
              min="1"
              value={inputs.teamSize}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">Group format</span>
            <Dropdown
              selection
              options={GROUP_FORMAT_OPTIONS}
              value={inputs.preferGroupFormat}
              onChange={(_, { value }) =>
                handleMultipleUpdate({ preferGroupFormat: value })
              }
            />
          </Field>
        </Row>
        <Field>
          <label
            style={{
              display: "inline-flex",
              gap: 8,
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              name="allowsTeamPreferences"
              checked={!!inputs.allowsTeamPreferences}
              onChange={toggleBoolean}
            />
            <span>
              Allow students to nominate preferred teammates for this opportunity
            </span>
          </label>
        </Field>
      </Card>

      <Card>
        <h2>Audience preferences</h2>
        <Field>
          <span className="label-text">Preferred grade levels</span>
          <CheckboxRow>
            {GRADE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={selectedGrades.includes(opt.value) ? "active" : ""}
              >
                <input
                  type="checkbox"
                  checked={selectedGrades.includes(opt.value)}
                  onChange={() => toggleGrade(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </CheckboxRow>
        </Field>
        <Field>
          <span className="label-text">Preferred class types</span>
          <CheckboxRow>
            {CLASS_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={
                  selectedClassTypes.includes(opt.value) ? "active" : ""
                }
              >
                <input
                  type="checkbox"
                  checked={selectedClassTypes.includes(opt.value)}
                  onChange={() => toggleClassType(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </CheckboxRow>
        </Field>
        <Field>
          <span className="label-text">Offered in class networks</span>
          <span className="hint">
            Pick which networks can see this opportunity.
          </span>
          <Dropdown
            placeholder="Select class networks"
            fluid
            multiple
            selection
            search
            options={allNetworks.map((n) => ({
              key: n.id,
              text: n.title,
              value: n.id,
            }))}
            value={selectedNetworks}
            onChange={(_, { value }) => setSelectedNetworks(value)}
          />
        </Field>
      </Card>

      <Card>
        <h2>Custom application questions</h2>
        <p style={{ color: "#5f6871", fontSize: 14, margin: 0 }}>
          Optional questions students answer when they rank this opportunity.
          Used by the matching algorithm.
        </p>
        {isNew ? (
          <p style={{ color: "#5f6871", fontSize: 14 }}>
            Save the opportunity first, then come back here to add custom
            questions.
          </p>
        ) : (
          <>
            {opportunityQuestions.length > 0 && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {opportunityQuestions.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: 12,
                      border: "1px solid #d3dae0",
                      borderRadius: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#171717" }}>
                        {q.prompt}
                      </div>
                      <div style={{ color: "#5f6871", fontSize: 12 }}>
                        {q.questionType}
                        {q.isRequired ? " · required" : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 100,
                        border: "1px solid #e8c4c4",
                        background: "#fff",
                        color: "#b3261e",
                        fontFamily: "Nunito",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                marginTop: 12,
                padding: 16,
                border: "1px dashed #d3dae0",
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <strong style={{ color: "#171717" }}>Add a question</strong>
              <Field>
                <span className="label-text">Prompt</span>
                <input
                  type="text"
                  value={questionDraft.prompt}
                  onChange={(e) =>
                    setQuestionDraft({
                      ...questionDraft,
                      prompt: e.target.value,
                    })
                  }
                  placeholder="e.g. Why are you interested in this project?"
                />
              </Field>
              <Field>
                <span className="label-text">Question type</span>
                <Dropdown
                  selection
                  options={[
                    { key: "short_text", text: "Short text", value: "short_text" },
                    { key: "long_text", text: "Long text", value: "long_text" },
                    {
                      key: "single_select",
                      text: "Single select",
                      value: "single_select",
                    },
                    {
                      key: "multi_select",
                      text: "Multi select",
                      value: "multi_select",
                    },
                    { key: "scale_1_5", text: "1-5 scale", value: "scale_1_5" },
                    { key: "yes_no", text: "Yes / no", value: "yes_no" },
                  ]}
                  value={questionDraft.questionType}
                  onChange={(_, { value }) =>
                    setQuestionDraft({
                      ...questionDraft,
                      questionType: value,
                    })
                  }
                />
              </Field>
              {SELECT_TYPES.includes(questionDraft.questionType) && (
                <Field>
                  <span className="label-text">Options (one per line)</span>
                  <textarea
                    value={questionDraft.optionsText}
                    onChange={(e) =>
                      setQuestionDraft({
                        ...questionDraft,
                        optionsText: e.target.value,
                      })
                    }
                  />
                </Field>
              )}
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
                  checked={questionDraft.isRequired}
                  onChange={(e) =>
                    setQuestionDraft({
                      ...questionDraft,
                      isRequired: e.target.checked,
                    })
                  }
                />
                <span>Required</span>
              </label>
              <div>
                <Button
                  type="button"
                  $primary
                  onClick={handleAddQuestion}
                  disabled={addingQuestion}
                >
                  {addingQuestion ? "Adding…" : "Add question"}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card>
        <h2>Publishing</h2>
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
      </Card>

      <Actions>
        <Button type="button" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" $primary onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : isNew ? "Create opportunity" : "Save changes"}
        </Button>
      </Actions>
    </Shell>
  );
}
