import { useState } from "react";
import useForm from "../../../../../lib/useForm";
import {
  FormField,
  Form,
  FormGroup,
  Radio,
  Divider,
  Checkbox,
} from "semantic-ui-react";
import { useMutation } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledInput } from "../../../../styles/StyledForm";
import { StyledSaveButton } from "../../../../styles/StyledProfile";

const optionsMentorPreferGrade = [
  { label: "middle", value: "middle" },
  { label: "nine", value: "nine" },
  { label: "eleven", value: "eleven" },
  { label: "no", value: "no" },
];

const optionsMentorPreferGroup = [
  { label: "individual", value: "individual" },
  { label: "group", value: "group" },
  { label: "no", value: "no" },
];

const optionsMentorPreferClass = [
  { label: "accelerated", value: "accelerated" },
  { label: "nonAccelerated", value: "nonAccelerated" },
  { label: "ell", value: "ell" },
  { label: "no", value: "no" },
];

export default function Preferences({ query, user }) {
  const { t } = useTranslation("connect");
  const [changed, setChanged] = useState(false);

  const { inputs, handleChange } = useForm({
    mentorPreferGrade: user?.mentorPreferGrade || undefined,
    mentorPreferGroup: user?.mentorPreferGroup || undefined,
    mentorPreferClass: user?.mentorPreferClass || undefined,
    involvement: user?.involvement,
  });

  const [updateProfile, { data, loading, error }] = useMutation(
    UPDATE_PROFILE,
    {
      variables: {
        id: user?.id,
        input: { ...inputs },
      },
      refetchQueries: [{ query: GET_PROFILE }],
    }
  );

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    await updateProfile();
    setChanged(false);
  }

  const setChecked = ({ name, checked }) => {
    const involvement = {
      ...inputs?.involvement,
      mentor: {
        ...inputs?.involvement?.mentor,
        [name]: checked,
      },
    };
    handleUpdate({
      target: {
        name: "involvement",
        value: involvement,
      },
    });
  };

  return (
    <div className="profileBlock">
      <div>
        <div className="title">{t("preferences.title")}</div>
        <p>{t("preferences.description")}</p>
      </div>
      <Divider />

      <StyledInput>
        <div className="inputLineBlock">
          <h3>{t("preferences.availability.title")}</h3>

          <h3>{t("preferences.availability.async.title")}</h3>
          <FormField>
            <Checkbox
              label={t("preferences.availability.async.answeringQuestions")}
              onChange={(e, data) => {
                setChecked({
                  name: "async_answering_questions",
                  checked: data.checked,
                });
              }}
              checked={inputs?.involvement?.mentor?.async_answering_questions}
            />
          </FormField>
          <FormField>
            <Checkbox
              label={t("preferences.availability.async.providingFeedback")}
              onChange={(e, data) => {
                setChecked({
                  name: "async_providing_feedback",
                  checked: data.checked,
                });
              }}
              checked={inputs?.involvement?.mentor?.async_providing_feedback}
            />
          </FormField>

          <h3>{t("preferences.availability.sync.title")}</h3>

          <FormField>
            <Checkbox
              label={t("preferences.availability.sync.inPersonVisit")}
              onChange={(e, data) => {
                setChecked({
                  name: "sync_making_visit_in_person",
                  checked: data.checked,
                });
              }}
              checked={inputs?.involvement?.mentor?.sync_making_visit_in_person}
            />
          </FormField>
          <FormField>
            <Checkbox
              label={t("preferences.availability.sync.zoomVisit")}
              onChange={(e, data) => {
                setChecked({
                  name: "sync_making_visit_in_person_over_zoom",
                  checked: data.checked,
                });
              }}
              checked={
                inputs?.involvement?.mentor
                  ?.sync_making_visit_in_person_over_zoom
              }
            />
          </FormField>

          {/* <Form>
            <FormGroup widths="4">
              {optionsMentorPreferGrade.map(({ label, value }) => (
                <FormField>
                  <Radio
                    label={t(`preferences.gradeLevel.options.${label}`)}
                    name="mentorPreferGrade"
                    value={value}
                    checked={inputs.mentorPreferGrade === value}
                    onChange={(e, content) => {
                      handleUpdate({
                        target: {
                          name: content?.name,
                          value: content?.value,
                        },
                      });
                    }}
                  />
                </FormField>
              ))}
            </FormGroup>
          </Form> */}
        </div>
        {/* <div className="inputLineBlock">
          <h3>{t("preferences.gradeLevel.title")}</h3>
          <p>{t("preferences.gradeLevel.description")}</p>

          <Form>
            <FormGroup widths="4">
              {optionsMentorPreferGrade.map(({ label, value }) => (
                <FormField>
                  <Radio
                    label={t(`preferences.gradeLevel.options.${label}`)}
                    name="mentorPreferGrade"
                    value={value}
                    checked={inputs.mentorPreferGrade === value}
                    onChange={(e, content) => {
                      handleUpdate({
                        target: {
                          name: content?.name,
                          value: content?.value,
                        },
                      });
                    }}
                  />
                </FormField>
              ))}
            </FormGroup>
          </Form>
        </div>

        <div className="inputLineBlock">
          <h3>{t("preferences.groupPreference.title")}</h3>
          <p>{t("preferences.groupPreference.description")}</p>

          <Form>
            <FormGroup widths="4">
              {optionsMentorPreferGroup.map(({ label, value }) => (
                <FormField>
                  <Radio
                    label={t(`preferences.groupPreference.options.${label}`)}
                    name="mentorPreferGroup"
                    value={value}
                    checked={inputs.mentorPreferGroup === value}
                    onChange={(e, content) => {
                      handleUpdate({
                        target: {
                          name: content?.name,
                          value: content?.value,
                        },
                      });
                    }}
                  />
                </FormField>
              ))}
            </FormGroup>
          </Form>
        </div>

        <div className="inputLineBlock">
          <h3>{t("preferences.classType.title")}</h3>
          <p>{t("preferences.classType.description")}</p>

          <Form>
            <FormGroup widths="4">
              {optionsMentorPreferClass.map(({ label, value }) => (
                <FormField>
                  <Radio
                    label={t(`preferences.classType.options.${label}`)}
                    name="mentorPreferClass"
                    value={value}
                    checked={inputs.mentorPreferClass === value}
                    onChange={(e, content) => {
                      handleUpdate({
                        target: {
                          name: content?.name,
                          value: content?.value,
                        },
                      });
                    }}
                  />
                </FormField>
              ))}
            </FormGroup>
          </Form>
        </div> */}
        <StyledSaveButton changed={changed}>
          <button onClick={handleSubmit} disabled={!changed}>
            {t("preferences.saveChanges")}
          </button>
        </StyledSaveButton>
      </StyledInput>
    </div>
  );
}
