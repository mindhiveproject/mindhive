import { useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";

import useForm from "../../../../lib/useForm";
import {
  GET_QUESTION,
  QUESTION_LIBRARY,
} from "../../../Queries/ConnectQuestion";
import {
  CREATE_QUESTION,
  UPDATE_QUESTION,
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
    font-family: "Inter", sans-serif;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
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

const TYPE_OPTIONS = [
  { key: "short_text", text: "Short text", value: "short_text" },
  { key: "long_text", text: "Long text", value: "long_text" },
  { key: "single_select", text: "Single select", value: "single_select" },
  { key: "multi_select", text: "Multi select", value: "multi_select" },
  { key: "scale_1_5", text: "1-5 scale", value: "scale_1_5" },
  { key: "scale_1_10", text: "1-10 scale", value: "scale_1_10" },
  { key: "yes_no", text: "Yes / no", value: "yes_no" },
];

const STATUS_OPTIONS = [
  { key: "draft", text: "Draft", value: "draft" },
  { key: "proposed", text: "Proposed", value: "proposed" },
  { key: "approved", text: "Approved", value: "approved" },
  { key: "rejected", text: "Rejected", value: "rejected" },
  { key: "archived", text: "Archived", value: "archived" },
];

const EMPTY_FORM = {
  prompt: "",
  helperText: "",
  questionType: "short_text",
  optionsText: "",
  status: "draft",
  reviewNotes: "",
  weight: 1.0,
  isRequired: false,
  order: 0,
};

const SELECT_TYPES = ["single_select", "multi_select"];

function optionsToText(options) {
  if (!Array.isArray(options)) return "";
  return options
    .map((opt) =>
      typeof opt === "string" ? opt : `${opt.label || opt.value || ""}`
    )
    .join("\n");
}

function textToOptions(text) {
  if (!text?.trim()) return null;
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label) => ({ label, value: label }));
}

export default function QuestionEditor({ questionId }) {
  const router = useRouter();
  const isNew = questionId === "new";

  const { data: existing, loading: loadingQuestion } = useQuery(GET_QUESTION, {
    variables: { id: questionId },
    skip: isNew,
    fetchPolicy: "cache-and-network",
  });
  const question = existing?.connectQuestion;

  const { inputs, handleChange, handleMultipleUpdate, toggleBoolean } = useForm(
    EMPTY_FORM
  );

  useEffect(() => {
    if (!question) return;
    handleMultipleUpdate({
      prompt: question.prompt || "",
      helperText: question.helperText || "",
      questionType: question.questionType || "short_text",
      optionsText: optionsToText(question.options),
      status: question.status || "draft",
      reviewNotes: question.reviewNotes || "",
      weight: question.weight ?? 1.0,
      isRequired: !!question.isRequired,
      order: question.order ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  const [createQuestion, { loading: creating }] = useMutation(CREATE_QUESTION, {
    refetchQueries: [{ query: QUESTION_LIBRARY }],
  });
  const [updateQuestion, { loading: updating }] = useMutation(UPDATE_QUESTION, {
    refetchQueries: isNew
      ? [{ query: QUESTION_LIBRARY }]
      : [
          { query: QUESTION_LIBRARY },
          { query: GET_QUESTION, variables: { id: questionId } },
        ],
    awaitRefetchQueries: true,
  });
  const saving = creating || updating;

  const needsOptions = SELECT_TYPES.includes(inputs.questionType);

  const handleSave = async () => {
    if (!inputs.prompt?.trim()) {
      alert("Prompt is required.");
      return;
    }
    if (needsOptions && !textToOptions(inputs.optionsText)) {
      alert("Provide at least one option for a select question.");
      return;
    }

    const input = {
      prompt: inputs.prompt,
      helperText: inputs.helperText || "",
      questionType: inputs.questionType || "short_text",
      options: needsOptions ? textToOptions(inputs.optionsText) : null,
      scope: "library",
      status: inputs.status || "draft",
      weight: Number(inputs.weight) || 1.0,
      isRequired: !!inputs.isRequired,
      order: Number(inputs.order) || 0,
    };

    if (isNew) {
      await createQuestion({ variables: { input } });
    } else {
      await updateQuestion({
        variables: {
          id: questionId,
          input: {
            ...input,
            reviewNotes: inputs.reviewNotes || "",
            updatedAt: new Date().toISOString(),
          },
        },
      });
    }
    router.replace({ pathname: "/dashboard/connect/questions" });
  };

  const handleCancel = () => {
    router.replace({ pathname: "/dashboard/connect/questions" });
  };

  if (!isNew && loadingQuestion && !question) {
    return (
      <Shell>
        <p>Loading question…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar>
        <div>
          <BackLink type="button" onClick={handleCancel}>
            <Icon name="arrow left" /> Back to library
          </BackLink>
          <h1>{isNew ? "New library question" : "Edit question"}</h1>
        </div>
      </TopBar>

      <Card>
        <h2>Question</h2>
        <Field>
          <span className="label-text">Prompt</span>
          <input
            type="text"
            name="prompt"
            value={inputs.prompt}
            onChange={handleChange}
            placeholder="e.g. What is your preferred research domain?"
          />
        </Field>
        <Field>
          <span className="label-text">Helper text</span>
          <span className="hint">
            Optional clarifying note shown under the prompt.
          </span>
          <input
            type="text"
            name="helperText"
            value={inputs.helperText}
            onChange={handleChange}
          />
        </Field>
        <Row $cols="1fr 1fr">
          <Field>
            <span className="label-text">Question type</span>
            <Dropdown
              selection
              options={TYPE_OPTIONS}
              value={inputs.questionType}
              onChange={(_, { value }) =>
                handleMultipleUpdate({ questionType: value })
              }
            />
          </Field>
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
        </Row>
        {needsOptions && (
          <Field>
            <span className="label-text">Options</span>
            <span className="hint">
              One option per line. Used for single/multi select questions.
            </span>
            <textarea
              name="optionsText"
              value={inputs.optionsText}
              onChange={handleChange}
              placeholder={"Neuroscience\nPsychology\nBiology"}
            />
          </Field>
        )}
      </Card>

      <Card>
        <h2>Matching weight</h2>
        <Row $cols="1fr 1fr 1fr">
          <Field>
            <span className="label-text">Weight</span>
            <span className="hint">
              How strongly this question influences matching score.
            </span>
            <input
              type="number"
              name="weight"
              min="0"
              step="0.1"
              value={inputs.weight}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <span className="label-text">Order</span>
            <span className="hint">
              Lower values display first when answering.
            </span>
            <input
              type="number"
              name="order"
              value={inputs.order}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <label
              style={{
                display: "inline-flex",
                gap: 8,
                alignItems: "center",
                marginTop: 24,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="isRequired"
                checked={!!inputs.isRequired}
                onChange={toggleBoolean}
              />
              <span>Required to submit</span>
            </label>
          </Field>
        </Row>
      </Card>

      {!isNew && (
        <Card>
          <h2>Review notes</h2>
          <Field>
            <span className="hint">
              Visible to the proposer. Use when rejecting or requesting changes.
            </span>
            <textarea
              name="reviewNotes"
              value={inputs.reviewNotes}
              onChange={handleChange}
            />
          </Field>
        </Card>
      )}

      <Actions>
        <Button type="button" onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" $primary onClick={handleSave} disabled={saving}>
          {saving
            ? "Saving…"
            : isNew
            ? "Create question"
            : "Save changes"}
        </Button>
      </Actions>
    </Shell>
  );
}
