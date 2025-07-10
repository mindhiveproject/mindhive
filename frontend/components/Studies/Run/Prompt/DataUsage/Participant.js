import useTranslation from "next-translate/useTranslation";

export default function DataUsageForParticipant({ dataUse, setDataUse }) {
  const { t } = useTranslation('common');
  return (
    <div>
      <h1>{t('dataUsage.header')}</h1>
      <h3>{t('dataUsage.question')}</h3>

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
            {t('dataUsage.science')}
          </label>
        </div>
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
            {t('dataUsage.education')}
          </label>
        </div>
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
            {t('dataUsage.no')}
          </label>
        </div>
      </div>
    </div>
  );
}
