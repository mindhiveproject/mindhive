import absoluteUrl from "next-absolute-url";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";

const StyledNotes = styled.div`
  background: #fff3cd;
  border-radius: 4px;

  p {
    padding: 20px;
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0em;
    text-align: left;
    color: #666666;
  }

  a {
    font-family: Lato;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    line-height: 24px;
    letter-spacing: 0em;
    text-align: left;
    color: #666666;
  }
`;

export default function DataUsageForStudent({ dataUse, setDataUse }) {
  const { origin } = absoluteUrl();
  const { t } = useTranslation("builder");
  return (
    <div>
      <h1>{t("dataUsage.title")}</h1>
      <h3>{t("dataUsage.question")}</h3>

      <div>
        <div className="checkboxField">
          <input
            type="radio"
            id="useDataForScience"
            name="data"
            value="science"
            onChange={({ target }) => setDataUse(target?.value)}
            checked={dataUse === "science"}
          />
          <label htmlFor="useDataForScience">
            {t("dataUsage.scienceLabel")}
          </label>
        </div>
        {dataUse === "science" && (
          <StyledNotes>
            <p>
              {t("dataUsage.scienceNote.part1")} {" "}
              <a target="_blank" href={`${origin}/docs/privacy`}>
                {t("dataUsage.privacy")}
              </a>{" "}
              {t("dataUsage.and")} {" "}
              <a target="_blank" href={`${origin}/docs/terms`}>
                {t("dataUsage.terms")}
              </a>{" "}
              {t("dataUsage.scienceNote.part2")}
            </p>
          </StyledNotes>
        )}
      </div>
      <div>
        <div className="checkboxField">
          <input
            type="radio"
            id="educationalUse"
            name="data"
            value="education"
            onChange={({ target }) => setDataUse(target?.value)}
            checked={dataUse === "education"}
          />
          <label htmlFor="educationalUse">
            {t("dataUsage.educationLabel")}
          </label>
        </div>
        {dataUse === "education" && (
          <StyledNotes>
            <p>
              {t("dataUsage.educationNote.part1")} {" "}
              <a target="_blank" href={`${origin}/docs/privacy`}>
                {t("dataUsage.privacy")}
              </a>{" "}
              {t("dataUsage.and")} {" "}
              <a target="_blank" href={`${origin}/docs/terms`}>
                {t("dataUsage.terms")}
              </a>{" "}
              {t("dataUsage.educationNote.part2")}
            </p>
          </StyledNotes>
        )}
      </div>
      <div>
        <div className="checkboxField">
          <input
            type="radio"
            id="onlyForMe"
            name="data"
            value="self"
            onChange={({ target }) => setDataUse(target?.value)}
            checked={dataUse === "self"}
          />
          <label htmlFor="onlyForMe">
            {t("dataUsage.selfLabel")}
          </label>
        </div>
        {dataUse === "self" && (
          <StyledNotes>
            <p>
              {t("dataUsage.selfNote")}
            </p>
          </StyledNotes>
        )}
      </div>
      <div>
        <div className="checkboxField">
          <input
            type="radio"
            id="doNotRecord"
            name="data"
            value="no"
            onChange={({ target }) => setDataUse(target?.value)}
            checked={dataUse === "no"}
          />
          <label htmlFor="doNotRecord">
            {t("dataUsage.noLabel")}
          </label>
        </div>
        {dataUse === "no" && (
          <StyledNotes>
            <p>
              {t("dataUsage.noNote")}
            </p>
          </StyledNotes>
        )}
      </div>
    </div>
  );
}
