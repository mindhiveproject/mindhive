import absoluteUrl from "next-absolute-url";
import { useState } from "react";
import { Radio } from "semantic-ui-react";

export default function ShareStudy({ study, handleChange }) {
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
    alert("The link is copied");
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
      <h2>Share your study</h2>

      <div className="card">
        <h3>Study url</h3>
        {study?.slug ? (
          <label htmlFor="slug" onClick={() => copyLink()}>
            <p className="accessLink">
              {origin}
              /studies/
              {study.slug}
            </p>
          </label>
        ) : (
          <p className="accessLink highlight">Customize your study url below</p>
        )}
      </div>

      <div className="card">
        <div className="settingsBlock">
          <div>
            <h3>Customize url</h3>
            <p>Customize your study url</p>
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
                  A tip - avoid spaces in the url. Use dashes instead, for
                  example.
                </div>
              </div>
            )}
          </div>
          <div className="input">
            <Radio
              toggle
              label={isCustomize ? "On" : "Off"}
              checked={isCustomize}
              onChange={() => setIsCustomize(!isCustomize)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
