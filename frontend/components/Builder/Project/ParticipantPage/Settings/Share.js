import absoluteUrl from "next-absolute-url";
import { useState } from "react";
import { Radio } from "semantic-ui-react";
import useTranslation from "next-translate/useTranslation";

export default function ShareStudy({ study, handleChange }) {
  const { t } = useTranslation("builder");
  const { origin } = absoluteUrl();
  const [isCustomize, setIsCustomize] = useState(true);

  const copyLink = () => {
    const copyLink = `${origin}/studies/${study.slug}`;
    const temp = document.createElement("input");
    document.body.append(temp);
    temp.value = copyLink;
    temp.select();
    document.execCommand("copy");
    temp.remove();
    alert(t('share.linkCopied'));
  };

  const sanitizeInput = (e) => {
    const cleanedValue = e.target.value
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    handleChange({
      target: {
        name: e.target.name,
        value: cleanedValue,
      },
    });
  };

  return (
    <div>
      <h2>{t('share.shareYourStudy')}</h2>

      <div className="card">
        <h3>{t('share.studyUrl')}</h3>
        {study?.slug ? (
          <label htmlFor="slug" onClick={() => copyLink()}>
            <p className="accessLink">
              {origin}
              /studies/
              {study.slug}
            </p>
          </label>
        ) : (
          <p className="accessLink highlight">{t('share.customizeBelow')}</p>
        )}
      </div>

      <div className="card">
        <div className="settingsBlock">
          <div>
            <h3>{t('share.customizeUrl')}</h3>
            <p>{t('share.customizeUrlDesc')}</p>
            {isCustomize && (
              <div>
                <div>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={study.slug}
                    onChange={sanitizeInput}
                    required
                  />
                </div>
                <div>
                  {t('share.tip')}
                </div>
              </div>
            )}
          </div>
          <div className="input">
            <Radio
              toggle
              label={isCustomize ? t('share.on') : t('share.off')}
              checked={isCustomize}
              onChange={() => setIsCustomize(!isCustomize)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
