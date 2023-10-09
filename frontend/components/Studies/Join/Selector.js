import { StyledSelector } from "../../styles/StyledJoinStudyFlow";
import Link from "next/link";

export default function Selector({ user, study, query }) {

  const { settings } = study;

  return (
    <StyledSelector>
      <div className="selectorHeader">
        <h1>How would you like to participate today?</h1>
      </div>
      <div className="selectorOptions">
        
        { settings?.guestParticipation && (
          <div className="option borderRight">
            <h2>Guest participant</h2>
            <p>
              Proceed directly to the study. Guests cannot save information for
              the next time.
            </p>
            <Link
              href={{
                pathname: `/join/details`,
                query: { ...query, guest: true },
              }}
            >
              <button>Continue as guest</button>
            </Link>
          </div>
        )}

        {!user && (
          <div className="option borderRight">
            <h2>Returning MindHive member</h2>
            <p>
              Already have a MindHive account? Log in for a faster study
              experience.
            </p>
            <Link
              href={{
                pathname: `/join/login`,
                query: { ...query },
              }}
            >
              <button>Log in</button>
            </Link>
          </div>
        )}

        {!user && (
          <div className="option">
            <h2>New MindHive member</h2>
            <p>Sign up to speed up study participation next time</p>
            <Link
              href={{
                pathname: `/join/signup`,
                query: { ...query },
              }}
            >
              <button>Sign up</button>
            </Link>
          </div>
        )}

        {user && (
          <div className="option">
            <h2>MindHive member</h2>
            <p>Continue as a member for a faster study experience.</p>
            <Link
              href={{
                pathname: `/join/details`,
                query: { ...query, guest: false },
              }}
            >
              <button>Continue as a member</button>
            </Link>
          </div>
        )}
      </div>
    </StyledSelector>
  );
}
