import absoluteUrl from "next-absolute-url";
import styled from "styled-components";

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
  return (
    <div>
      <h1>Data usage</h1>
      <h3>
        Do you want to allow MindHive researchers and educators to access your
        responses for this task?
      </h3>

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
            Yes, for all uses - science, education, and community programs
          </label>
        </div>
        {dataUse === "science" && (
          <StyledNotes>
            <p>
              Note: MindHive researchers and educators are vetted by MindHive
              administrators and cannot access your personal data without your
              explicit consent. See our{" "}
              <a target="_blank" href={`${origin}/docs/privacy`}>
                Privacy Policy
              </a>{" "}
              and{" "}
              <a target="_blank" href={`${origin}/docs/terms`}>
                Terms and Conditions
              </a>{" "}
              for details on our commitment to protect your data.
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
            Yes, but just for educational and community programs use
          </label>
        </div>
        {dataUse === "education" && (
          <StyledNotes>
            <p>
              Note: MindHive educators are vetted by MindHive administrators and
              cannot access your personal data without your explicit consent.
              See our{" "}
              <a target="_blank" href={`${origin}/docs/privacy`}>
                Privacy Policy
              </a>{" "}
              and{" "}
              <a target="_blank" href={`${origin}/docs/terms`}>
                Terms and Conditions
              </a>{" "}
              for details on our commitment to protect your data.
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
            No, just save my responses for my own use
          </label>
        </div>
        {dataUse === "self" && (
          <StyledNotes>
            <p>
              Note: Your teacher will still have access to your responses.
              Choosing this option means your data won't be included in class
              demos
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
          <label htmlFor="doNotRecord">No, don't save my responses</label>
        </div>
        {dataUse === "no" && (
          <StyledNotes>
            <p>
              Note: Some MindHive features, like personalized data visualization
              might not be accessible to you if you choose this option
            </p>
          </StyledNotes>
        )}
      </div>
    </div>
  );
}
