import Link from "next/link";

import useForm from "../../../lib/useForm";
import useTranslation from "next-translate/useTranslation";

import {
  StyledDetails,
  ResponseButtons,
} from "../../styles/StyledJoinStudyFlow";
import JoinStudy from "./JoinStudy";
import Button from "../../DesignSystem/Button";

function YesNoButtons({ labelledBy, value, onChange, yesLabel, noLabel }) {
  return (
    <ResponseButtons role="group" aria-labelledby={labelledBy}>
      <Button
        type="button"
        variant={value === "yes" ? "tonal" : "outline"}
        onClick={() => onChange("yes")}
        aria-pressed={value === "yes"}
      >
        {yesLabel}
      </Button>
      <Button
        type="button"
        variant={value === "no" ? "tonal" : "outline"}
        onClick={() => onChange("no")}
        aria-pressed={value === "no"}
      >
        {noLabel}
      </Button>
    </ResponseButtons>
  );
}

export default function Details({ user, study, query }) {
  const { t } = useTranslation("common");
  const { inputs, handleChange } = useForm({
    zip: "",
    sona: "",
    sonaid: "",
    eng: "",
    age: "",
    share: "true",
    ...query, // populate by information from query
    ...user?.generalInfo, // populate by the saved user information
    guest: query?.guest, // check whether guest participation is requested
  });

  const { settings } = study;
  const consents = study?.consent || [];

  const setField = (name, value) =>
    handleChange({ target: { name, value } });

  return (
    <StyledDetails>
      <h1>
        {t("join.details.header", {}, { default: "Let's get started" })}
      </h1>
      <p className="pageIntro">
        {t(
          "join.details.intro",
          { title: study.title },
          {
            default:
              'We are glad that you are interested in participating in "{{title}}".',
          },
        )}
      </p>

      {settings?.zipCode && (
        <div>
          <label htmlFor="zip">
            <p className="questionTitle">
              {t("join.details.zip", {}, { default: "Your zip code" })}
            </p>
            <input
              type="number"
              id="zip"
              name="zip"
              onChange={handleChange}
              value={inputs?.zip}
            />
          </label>
        </div>
      )}

      {settings?.sonaId && (
        <div>
          <p className="questionTitle" id="sona-label">
            {t("join.details.sona", {}, {
              default: "Are you an NYU SONA participant?",
            })}
          </p>
          <YesNoButtons
            labelledBy="sona-label"
            value={inputs?.sona}
            onChange={(value) => setField("sona", value)}
            yesLabel={t("join.details.sonaYes", {}, { default: "Yes" })}
            noLabel={t("join.details.sonaNo", {}, { default: "No" })}
          />
        </div>
      )}

      {settings?.askStudentsNYC && (
        <div>
          <label htmlFor="sonaid">
            <p className="questionTitle">
              {t("join.details.nyuId", {}, { default: "What is your NYU ID?" })}
            </p>
            <span className="pageIntro">
              {t("join.details.nyuIdDesc", {}, {
                default:
                  "By entering your ID, we can ensure that you will receive course credit for your participation in this study.",
              })}
            </span>
            <input
              type="text"
              id="sonaid"
              name="sonaid"
              onChange={handleChange}
              value={inputs?.sonaid}
            />
          </label>
        </div>
      )}

      <div>
        <p className="questionTitle" id="eng-label">
          {t("join.details.english", {}, {
            default:
              "Do you understand basic instruction written in English?",
          })}
        </p>
        <YesNoButtons
          labelledBy="eng-label"
          value={inputs?.eng}
          onChange={(value) => setField("eng", value)}
          yesLabel={t("join.details.englishYes", {}, { default: "Yes" })}
          noLabel={t("join.details.englishNo", {}, { default: "No" })}
        />
        <p className="translation">
          <em>
            {t("join.details.englishTranslationNote", {}, {
              default:
                "(La versión en español de la plataforma estará disponible en poco tiempo.)",
            })}
          </em>
        </p>
      </div>

      <div>
        <label htmlFor="age">
          <p className="questionTitle">
            {t("join.details.age", {}, { default: "What is your age?" })}
          </p>
          <input
            type="number"
            id="age"
            name="age"
            min="0"
            max="120"
            onChange={handleChange}
            value={inputs?.age}
          />
        </label>
      </div>

      <div>
        <label htmlFor="share">
          <div className="checkboxField">
            <input
              type="checkbox"
              id="share"
              name="share"
              checked={inputs?.share === "true"}
              onChange={() =>
                handleChange({
                  target: {
                    name: "share",
                    value: inputs?.share === "true" ? "false" : "true",
                  },
                })
              }
            />
            <span>
              {t("join.details.saveInfo", {}, {
                default: "Save my information for future studies",
              })}
            </span>
          </div>
        </label>
      </div>

      <div className="actions">
        {settings?.consentObtained && consents?.length > 0 ? (
          <Link
            href={{
              pathname: `/join/consent`,
              query: {
                ...inputs,
                id: study?.id,
                consent: study?.consent[0]?.id,
              },
            }}
          >
            <Button variant="filled" style={{ width: "100%" }}>
              {t("join.details.next", {}, { default: "Next" })}
            </Button>
          </Link>
        ) : (
          <JoinStudy
            user={user}
            study={study}
            userInfo={inputs}
            btnName={t("join.details.joinButton", {}, {
              default: "Join the study",
            })}
          />
        )}
      </div>
    </StyledDetails>
  );
}
