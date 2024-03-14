import { StyledWrapper } from "../../styles/StyledJoinStudyFlow";
import Link from "next/link";

import Selector from "./Selector";
import SignIn from "../../Auth/Login";
import RoleSignup from "../../Auth/SignupRoles/Role";
import Details from "./Details";
import Consents from "./Consents/Main";

export default function FlowWrapper({ query, user, study, step }) {
  const { guest } = query;

  let header;
  switch (step) {
    case "select":
      header = "Participation";
      break;
    case "signup":
      header = "Participant details";
      break;
    case "login":
      header = "Login";
      break;
    case "details":
      header = "Participant details";
      break;
    case "consent":
      header = "Study consent";
      break;
    default:
      header = "Participation";
  }

  // for the cases when the direct link is copied in browser but there is no user logged in
  if (
    (step === "details" || step === "consent") &&
    guest === "false" &&
    !user
  ) {
    return (
      <StyledWrapper>
        <div className="header">
          <div className="logo">
            <img src="/logo.png" alt="icon" height="30" />
          </div>
          <div>Participation</div>
          <Link
            href={{
              pathname: `/studies/${study?.slug}`,
            }}
          >
            <div className="closeBtn">&times;</div>
          </Link>
        </div>
        <div className="main">
          <Selector user={user} study={study} query={query} />
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="header">
        <div className="logo">
          <img src="/logo.png" alt="icon" height="30" />
        </div>
        <div>{header}</div>
        {user ? (
          <Link
            href={{
              pathname: `/dashboard/discover/studies`,
              query: { name: study?.slug },
            }}
          >
            <div className="closeBtn">&times;</div>
          </Link>
        ) : (
          <Link
            href={{
              pathname: `/studies/${study?.slug}`,
            }}
          >
            <div className="closeBtn">&times;</div>
          </Link>
        )}
      </div>
      <div className="main">
        {step === "select" && (
          <Selector user={user} study={study} query={query} />
        )}
        {step === "login" && (
          <SignIn redirectType="JoinStudyFlow" redirectTo={study?.id} />
        )}
        {step === "signup" && (
          <RoleSignup
            role="participant"
            redirectType="JoinStudyFlow"
            redirectTo={study?.id}
          />
        )}
        {step === "details" && (
          <Details user={user} study={study} query={query} />
        )}
        {step === "consent" && (
          <Consents user={user} study={study} query={query} />
        )}
      </div>
    </StyledWrapper>
  );
}
