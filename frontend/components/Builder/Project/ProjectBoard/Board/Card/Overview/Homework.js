import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_HOMEWORK_BY_ID } from "../../../../../../Queries/Homework";

import ReactHtmlParser from "react-html-parser";
import useForm from "../../../../../../../lib/useForm";
import { UPDATE_HOMEWORK } from "../../../../../../Mutations/Homework";

import JoditEditor from "../../../../../../Jodit/Editor";
import useTranslation from "next-translate/useTranslation";

export default function Homework({ homeworkId }) {
  const { t } = useTranslation("builder");
  const { data, loading, error } = useQuery(GET_HOMEWORK_BY_ID, {
    variables: { id: homeworkId },
  });
  const homework = data?.homework || {};

  const { inputs, handleChange } = useForm({
    ...homework,
  });

  const content = useRef(homework?.content);

  useEffect(() => {
    async function updateEditor() {
      content.current = homework?.content;
    }
    if (homework.content) {
      updateEditor();
    }
  }, [homework]);

  const [updateHomework, { loading: updateLoading }] = useMutation(
    UPDATE_HOMEWORK,
    {
      variables: { id: homeworkId },
      refetchQueries: [
        { query: GET_HOMEWORK_BY_ID, variables: { id: homeworkId } },
      ],
    }
  );

  // update the homework and close the modal
  const onUpdateHomework = async () => {
    await updateHomework({
      variables: {
        input: {
          comment: inputs?.comment,
          settings: inputs?.settings,
          content: content.current,
        },
      },
    });
  };

  // update the settings in the local state
  const handleSettingsChange = (name, value) => {
    handleChange({
      target: {
        name: "settings",
        value: { ...inputs.settings, [name]: value },
      },
    });
  };

  const options = [
    {
      text: "",
      value: "",
    },
    {
      text: t("homeworkCard.notStarted", "Not started"),
      value: "Not started",
    },
    {
      text: t("homeworkCard.started", "Started"),
      value: "Started",
    },
    {
      text: t("homeworkCard.needsFeedback", "Needs feedback"),
      value: "Needs feedback",
    },
    {
      text: t("homeworkCard.feedbackGiven", "Feedback given"),
      value: "Feedback given",
    },
    {
      text: t("homeworkCard.completed", "Completed"),
      value: "Completed",
    },
  ];

  return (
    <>
      <JoditEditor
        content={content?.current}
        setContent={(newContent) => {
          content.current = newContent;
        }}
      />

      <div className="proposalCardComments">
        <h4>{t("homeworkCard.comments", "Comments")}</h4>
        <textarea
          rows="5"
          type="text"
          id="comment"
          name="comment"
          value={inputs.comment}
          onChange={handleChange}
        />
      </div>
      <div>
        <h4>{t("homeworkCard.status", "Status")}</h4>
        <select
          value={inputs?.settings?.status || ""}
          onChange={(event) =>
            handleSettingsChange("status", event.target.value)
          }
        >
          {options.map((option) => (
            <option value={option?.value}>{option?.text}</option>
          ))}
        </select>
      </div>
      <div className="buttons">
        <button
          className="primary"
          onClick={() => onUpdateHomework()}
          disabled={updateLoading}
        >
          {updateLoading
            ? t("homeworkCard.saving", "Saving ...")
            : t("homeworkCard.save", "Save")}
        </button>
      </div>
    </>
  );
}
