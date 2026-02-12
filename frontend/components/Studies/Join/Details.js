import Link from "next/link";

import useForm from "../../../lib/useForm";
import useTranslation from "next-translate/useTranslation";

import {
  StyledDetails,
  ResponseButtons,
} from "../../styles/StyledJoinStudyFlow";
import JoinStudy from "./JoinStudy";

export default function Details({ user, study, query }) {
  const { t } = useTranslation('common');
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

  return (
    <StyledDetails>
      <h1>{t('join.details.header')}</h1>
      <h3>
        {t('join.details.intro', { title: study.title })}
      </h3>

      {settings?.zipCode && (
        <div>
          <label htmlFor="zip">
            <p className="questionTitle">{t('join.details.zip')}</p>
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
          <label htmlFor="sona">
            <p className="questionTitle">{t('join.details.sona')}</p>
            <ResponseButtons>
              <button
                onClick={() =>
                  handleChange({ target: { name: "sona", value: "yes" } })
                }
                className={inputs?.sona === "yes" ? "selectedBtn" : undefined}
              >
                {t('join.details.sonaYes')}
              </button>
              <button
                onClick={() =>
                  handleChange({ target: { name: "sona", value: "no" } })
                }
                className={inputs?.sona === "no" ? "selectedBtn" : undefined}
              >
                {t('join.details.sonaNo')}
              </button>
            </ResponseButtons>
          </label>
        </div>
      )}

      {settings?.askStudentsNYC && (
        <div>
          <label htmlFor="sonaid">
            <p className="questionTitle">{t('join.details.nyuId')}</p>
            <span>{t('join.details.nyuIdDesc')}</span>
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
        <label htmlFor="eng">
          <p className="questionTitle">
            {t('join.details.english')}
          </p>

          <ResponseButtons>
            <button
              onClick={() =>
                handleChange({ target: { name: "eng", value: "yes" } })
              }
              className={inputs?.eng === "yes" ? "selectedBtn" : undefined}
            >
              {t('join.details.englishYes')}
            </button>
            <button
              onClick={() =>
                handleChange({ target: { name: "eng", value: "no" } })
              }
              className={inputs?.eng === "no" ? "selectedBtn" : undefined}
            >
              {t('join.details.englishNo')}
            </button>
          </ResponseButtons>
          <p className="translation">
            <em>{t('join.details.englishTranslationNote')}</em>
          </p>
        </label>
      </div>

      <div>
        <label htmlFor="age">
          <p className="questionTitle">{t('join.details.age')}</p>
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
            <span>{t('join.details.saveInfo')}</span>
          </div>
        </label>
      </div>

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
          <button>{t('join.details.next')}</button>
        </Link>
      ) : (
        <JoinStudy
          user={user}
          study={study}
          userInfo={inputs}
          btnName={t('join.details.joinButton')}
        />
      )}
    </StyledDetails>
  );
}
