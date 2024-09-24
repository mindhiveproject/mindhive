import useForm from "../../../../../lib/useForm";
import { FormField, Form, FormGroup, Radio, Divider } from "semantic-ui-react";

import { useMutation } from "@apollo/client";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledInput } from "../../../../styles/StyledForm";

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
  const { inputs, handleChange } = useForm({
    mentorPreferGrade: user?.mentorPreferGrade || undefined,
    mentorPreferGroup: user?.mentorPreferGroup || undefined,
    mentorPreferClass: user?.mentorPreferClass || undefined,
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

  async function handleSubmit(e) {
    e.preventDefault();
    await updateProfile();
  }

  return (
    <div className="profileBlock">
      <div>
        <div className="title">Mentorship Preferences</div>
        <p>
          We'd love for you to upload an introduction video to share with
          students and fellow MindHive members. This is your chance to tell
          everyone who you are, highlight your research, and share what excites
          you about your work.
        </p>
      </div>
      <Divider />

      <StyledInput>
        <div className="inputLineBlock">
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
                      handleChange({
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
                      handleChange({
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
                      handleChange({
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

        <div className="saveButtonBlock">
          <button onClick={handleSubmit}>Save changes</button>
        </div>
      </StyledInput>
    </div>
  );
}
