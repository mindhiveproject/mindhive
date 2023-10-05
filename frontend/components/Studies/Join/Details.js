import Link from "next/link";

import MyDatePicker from "../../Utils/DatePicker";
import useForm from "../../../lib/useForm";

import {
  StyledDetails,
  ResponseButtons,
} from "../../styles/StyledJoinStudyFlow";

export default function Details({ user, study, query }) {
  const { inputs, handleChange } = useForm({
    zip: "",
    sona: "",
    sonaid: "",
    eng: "",
    bd: "",
    share: "true",
    ...query, // populate by information from query
    ...user?.generalInfo, // populate by the saved user information
    guest: query?.guest, // check whether guest participation is requested
  });

  // console.log({ inputs });

  return (
    <StyledDetails>
      <h1>Let's get started</h1>
      <h3>
        We are glad that you are interested in participating in "{study.title}
        ".
      </h3>

      <div>
        <label htmlFor="zip">
          <p className="questionTitle">Your zip code</p>
          <input
            type="number"
            id="zip"
            name="zip"
            onChange={handleChange}
            value={inputs?.zip}
          />
        </label>
      </div>

      <div>
        <label htmlFor="sona">
          <p className="questionTitle">Are you an NYU SONA participant?</p>
          <ResponseButtons>
            <button
              onClick={() =>
                handleChange({ target: { name: "sona", value: "yes" } })
              }
              className={inputs?.sona === "yes" ? "selectedBtn" : undefined}
            >
              Yes
            </button>
            <button
              onClick={() =>
                handleChange({ target: { name: "sona", value: "no" } })
              }
              className={inputs?.sona === "no" ? "selectedBtn" : undefined}
            >
              No
            </button>
          </ResponseButtons>
        </label>
      </div>

      <div>
        <label htmlFor="sonaid">
          <p className="questionTitle">What is your NYU ID?</p>
          <span>
            By entering your ID, we can ensure that you will receive course
            credit for your participation in this study.
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

      <div>
        <label htmlFor="eng">
          <p className="questionTitle">
            Do you understand basic instruction written in English?
          </p>

          <ResponseButtons>
            <button
              onClick={() =>
                handleChange({ target: { name: "eng", value: "yes" } })
              }
              className={inputs?.eng === "yes" ? "selectedBtn" : undefined}
            >
              Yes
            </button>
            <button
              onClick={() =>
                handleChange({ target: { name: "eng", value: "no" } })
              }
              className={inputs?.eng === "no" ? "selectedBtn" : undefined}
            >
              No
            </button>
          </ResponseButtons>
          <p className="translation">
            <em>
              (La versión en español de la plataforma estará disponible en poco
              tiempo.)
            </em>
          </p>
        </label>
      </div>

      <div>
        <p className="questionTitle">What is your date of birth?</p>
        <MyDatePicker
          onDateInput={(timestamp) =>
            handleChange({ target: { name: "bd", value: timestamp } })
          }
        />
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
            <span>Save my information for future studies</span>
          </div>
        </label>
      </div>

      <Link
        href={{
          pathname: `/join/consent`,
          query: { ...inputs, id: study?.id },
        }}
      >
        <button>Next</button>
      </Link>
    </StyledDetails>
  );
}
