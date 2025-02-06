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

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledInput } from "../../../../styles/StyledForm";
import { StyledSaveButton } from "../../../../styles/StyledProfile";

const optionsMentorPreferGrade = [
  { label: "Middle School", value: "middle" },
  { label: "9 - 10 Grade", value: "nine" },
  { label: "11 - 12 Grade", value: "eleven" },
  { label: "No Preference", value: "no" },
];

const optionsMentorPreferGroup = [
  { label: "Individual", value: "individual" },
  { label: "Group", value: "group" },
  { label: "No Preference", value: "no" },
];

const optionsMentorPreferClass = [
  { label: "Accelerated", value: "accelerated" },
  { label: "Non Accelerated", value: "nonAccelerated" },
  { label: "ELL", value: "ell" },
  { label: "No Preference", value: "no" },
];

export default function Preferences({ query, user }) {
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
        <div className="title">Your Involvement</div>
        <p>
          Please complete the following items to let us know the details of your
          involvement.
        </p>
      </div>
      <Divider />

      <StyledInput>
        <div className="inputLineBlock">
          <h3>
            Please indicate below how you are available to partner with us
            (select all that apply).
          </h3>

          <h3>Asynchronous</h3>
          <FormField>
            <Checkbox
              label="Answering student questions (based on your profile)."
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
              label="Providing feedback on student projects"
              onChange={(e, data) => {
                setChecked({
                  name: "async_providing_feedback",
                  checked: data.checked,
                });
              }}
              checked={inputs?.involvement?.mentor?.async_providing_feedback}
            />
          </FormField>

          <h3>Synchronous</h3>

          <FormField>
            <Checkbox
              label="Making an in-class visit to talk with program students about your work (in-person)."
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
              label="Making an in-class visit to talk with program students about your work (over Zoom)."
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
                    label={label}
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
          <h3>Grade Level</h3>
          <p>
            Tell us about the grade levels you feel most comfortable supporting
            as a mentor. Select all that apply.
          </p>

          <Form>
            <FormGroup widths="4">
              {optionsMentorPreferGrade.map(({ label, value }) => (
                <FormField>
                  <Radio
                    label={label}
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
          <h3>Individual vs Group</h3>
          <p>
            Do you prefer supporting individuals or groups in mentorship
            sessions? Select all that apply.
          </p>

          <Form>
            <FormGroup widths="4">
              {optionsMentorPreferGroup.map(({ label, value }) => (
                <FormField>
                  <Radio
                    label={label}
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
          <h3>Class Type</h3>
          <p>
            Tell us about what type of classroom you would most like to mentor.
            Select all that apply.
          </p>

          <Form>
            <FormGroup widths="4">
              {optionsMentorPreferClass.map(({ label, value }) => (
                <FormField>
                  <Radio
                    label={label}
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
            Save changes
          </button>
        </StyledSaveButton>
      </StyledInput>
    </div>
  );
}
