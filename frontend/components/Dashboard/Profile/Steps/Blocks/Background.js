import { useState } from "react";
import useForm from "../../../../../lib/useForm";
import { useMutation } from "@apollo/client";
import { Divider, Icon } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

import { GET_PROFILE } from "../../../../Queries/User";
import { UPDATE_PROFILE } from "../../../../Mutations/User";

import { StyledInput } from "../../../../styles/StyledForm";
import { StyledSaveButton } from "../../../../styles/StyledProfile";

export default function Background({ query, user }) {
  const { t } = useTranslation("connect");
  const [changed, setChanged] = useState(false);

  const { inputs, handleChange } = useForm({
    bioInformal: user?.bioInformal,
    bio: user?.bio,
    occupation: user?.occupation,
    education: user?.education || [{ institution: "", degree: "" }],
    languages: user?.languages || [{ language: "" }],
  });

  const handleUpdate = (data) => {
    setChanged(true);
    handleChange(data);
  };

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
    setChanged(false);
  }

  const handleArrayChange = ({ variable, property, position, value }) => {
    handleUpdate({
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
      handleUpdate({
        target: {
          name: variable,
          value: [...inputs[variable], newObj],
        },
      });
    }
  };

  const removeFromArray = ({ variable, position }) => {
    handleUpdate({
      target: {
        name: variable,
        value: inputs[variable].filter((edu, num) => num !== position),
      },
    });
  };

  return (
    <div className="profileBlock">
      <div>
        <div className="title">{t("background.title")}</div>
        <p>{t("background.description")}</p>
      </div>
      <Divider />

      <StyledInput>
        <div>
          <div className="inputLineBlock">
            <h3>{t("background.officialBio.title")}</h3>
            <p>{t("background.officialBio.description")}</p>
            <textarea
              id="bio"
              rows="5"
              name="bio"
              placeholder=""
              value={inputs?.bio || ""}
              onChange={handleUpdate}
            />
          </div>

          <h3>{t("background.unofficialBio.title")}</h3>
          <p>{t("background.unofficialBio.description")}</p>
          <textarea
            id="bioInformal"
            rows="5"
            name="bioInformal"
            placeholder=""
            value={inputs?.bioInformal || ""}
            onChange={handleUpdate}
          />
        </div>

        {/* <div className="inputLineBlock">
          <h3>{t("background.occupation.title")}</h3>
          <input
            type="text"
            name="occupation"
            value={inputs?.occupation || ""}
            onChange={handleUpdate}
          />
        </div>

        <div className="inputLineBlock">
          <h3>{t("background.education.title")}</h3>
          <div>
            {inputs.education.map((edu, num) => (
              <div className="twoColumnsInputWithIcon">
                <div>
                  <div className="subtitle">{t("background.education.institution")}</div>
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
                  <div className="subtitle">{t("background.education.degree")}</div>
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
              <p>{t("background.education.addInstitution")}</p>
            </div>
          </div>
        </div>

        <div className="inputLineBlock">
          <h3>{t("background.languages.title")}</h3>
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
            <p>{t("background.languages.addLanguage")}</p>
          </div>
        </div> */}

        <StyledSaveButton changed={changed}>
          <button onClick={handleSubmit} disabled={!changed}>
            {t("background.saveChanges")}
          </button>
        </StyledSaveButton>
      </StyledInput>
    </div>
  );
}
