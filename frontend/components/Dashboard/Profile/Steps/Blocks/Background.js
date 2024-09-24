import useForm from "../../../../../lib/useForm";
import { useMutation } from "@apollo/client";
import { Divider, Icon } from "semantic-ui-react";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledInput } from "../../../../styles/StyledForm";

export default function Background({ query, user }) {
  const { inputs, handleChange } = useForm({
    bioInformal: user?.bioInformal,
    bio: user?.bio,
    occupation: user?.occupation,
    education: user?.education || [{ institution: "", degree: "" }],
    languages: user?.languages || [{ language: "" }],
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

  const handleArrayChange = ({ variable, property, position, value }) => {
    handleChange({
      target: {
        name: variable,
        value: inputs[variable].map((edu, num) => {
          if (num === position) {
            return {
              ...edu,
              [property]: value,
            };
          } else {
            return edu;
          }
        }),
      },
    });
  };

  const addToArray = ({ variable }) => {
    let newObj;
    if (variable === "education") {
      newObj = { institution: "", degree: "" };
    }
    if (variable === "languages") {
      newObj = { language: "" };
    }
    if (newObj) {
      handleChange({
        target: {
          name: variable,
          value: [...inputs[variable], newObj],
        },
      });
    }
  };

  const removeFromArray = ({ variable, position }) => {
    handleChange({
      target: {
        name: variable,
        value: inputs[variable].filter((edu, num) => num !== position),
      },
    });
  };

  return (
    <div className="profileBlock">
      <div>
        <div className="title">Background</div>
        <p>
          Let's get to know you better! Please fill out your background
          information so others in the MindHive community can connect with you
          more easily.
        </p>
      </div>
      <Divider />

      <StyledInput>
        <div className="inputLineBlock">
          <h3>Unofficial Bio</h3>
          <p>
            Give us a quick blurb about who you are - this is your place to get
            creative!
          </p>
          <textarea
            id="bioInformal"
            rows="5"
            name="bioInformal"
            placeholder=""
            value={inputs?.bioInformal || ""}
            onChange={handleChange}
          />
        </div>

        <div className="inputLineBlock">
          <h3>Offical Bio</h3>
          <p>
            Here you can present the more professional side of yourself. This is
            the perfect place to share your scientific research, professional
            background, and any other relevant details about your career and
            expertise.
          </p>
          <textarea
            id="bio"
            rows="5"
            name="bio"
            placeholder=""
            value={inputs?.bio || ""}
            onChange={handleChange}
          />
        </div>

        <div className="inputLineBlock">
          <h3>Occupation</h3>
          <input
            type="text"
            name="occupation"
            value={inputs?.occupation || ""}
            onChange={handleChange}
          />
        </div>

        <div className="inputLineBlock">
          <h3>Education</h3>
          <div>
            {inputs.education.map((edu, num) => (
              <div className="twoColumnsInputWithIcon">
                <div>
                  <div className="subtitle">Institution</div>
                  <input
                    type="text"
                    name={`institution-${num}`}
                    value={edu?.institution || ""}
                    onChange={({ target }) =>
                      handleArrayChange({
                        variable: "education",
                        property: "institution",
                        position: num,
                        value: target?.value,
                      })
                    }
                  />
                </div>

                <div>
                  <div className="subtitle">Degree</div>
                  <input
                    type="text"
                    name={`degree-${num}`}
                    value={edu?.degree || ""}
                    onChange={({ target }) =>
                      handleArrayChange({
                        variable: "education",
                        property: "degree",
                        position: num,
                        value: target?.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Icon
                    name="remove"
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromArray({ variable: "education", position: num });
                    }}
                  />
                </div>
              </div>
            ))}

            <div
              className="addLink"
              onClick={(e) => {
                e.preventDefault();
                addToArray({ variable: "education" });
              }}
            >
              <div>
                <img src={`/assets/icons/profile/plus.svg`} />
              </div>
              <p>Add another institution</p>
            </div>
          </div>
        </div>

        <div className="inputLineBlock">
          <h3>Language</h3>
          {inputs.languages.map((lang, num) => (
            <div className="oneColumnInputWithIcon">
              <label htmlFor={`language-${num}`}>
                <input
                  type="text"
                  name={`language-${num}`}
                  value={lang?.language || ""}
                  onChange={({ target }) =>
                    handleArrayChange({
                      variable: "languages",
                      property: "language",
                      position: num,
                      value: target?.value,
                    })
                  }
                />
              </label>

              <div>
                <Icon
                  name="remove"
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromArray({ variable: "languages", position: num });
                  }}
                />
              </div>
            </div>
          ))}

          <div
            className="addLink"
            onClick={(e) => {
              e.preventDefault();
              addToArray({ variable: "languages" });
            }}
          >
            <div>
              <img src={`/assets/icons/profile/plus.svg`} />
            </div>
            <p>Add another language</p>
          </div>
        </div>

        <div className="saveButtonBlock">
          <button onClick={handleSubmit}>Save changes</button>
        </div>
      </StyledInput>
    </div>
  );
}
