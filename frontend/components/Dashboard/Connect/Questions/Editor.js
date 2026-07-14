import { useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import useTranslation from "next-translate/useTranslation";
import styled from "styled-components";
import { Dropdown } from "semantic-ui-react";

import useForm from "../../../../lib/useForm";
import {
  GET_QUESTION,
  QUESTION_LIBRARY,
} from "../../../Queries/ConnectQuestion";
import {
  CREATE_QUESTION,
  UPDATE_QUESTION,
} from "../../../Mutations/ConnectQuestion";
import Button from "../../../DesignSystem/Button";

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
  const { t } = useTranslation("connect");
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

  const entityTitle = (inputs.prompt || "").trim();
  const pageTitle = entityTitle
    ? entityTitle
    : isNew
    ? t("questionEditor.pageTitleNew", {}, {
        default: "New library question",
      })
    : t("questionEditor.pageTitleEdit", {}, {
        default: "Edit question",
      });
  const backLabel = t("questionEditor.backLink", {}, {
    default: "Back to library",
  });
  const primaryLabel = saving
    ? t("questionEditor.saving", {}, { default: "Saving…" })
    : isNew
    ? t("questionEditor.create", {}, { default: "Create question" })
    : t("questionEditor.save", {}, { default: "Save changes" });

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
    </Shell>
  );
}
