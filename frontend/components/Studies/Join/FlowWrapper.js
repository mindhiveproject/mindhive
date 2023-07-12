import { StyledWrapper } from "../../styles/StyledJoinStudyFlow";
import Link from "next/link";

import Selector from "./Selector";
import SignIn from "../../Auth/Login";
import RoleSignup from "../../Auth/SignupRoles/Role";
import Details from "./Details";
import Consent from "./Consent";

export default function FlowWrapper({ query, user, study, step }) {
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

  // console.log({ user });

  return (
    <StyledWrapper>
      <div className="header">
        <div className="logo">
          <img src="/logo.png" alt="icon" height="30" />
        </div>
        <div>{header}</div>
        <Link
          href={{
            pathname: `/studies/${study?.slug}`,
          }}
        >
          <div className="closeBtn">&times;</div>
        </Link>
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
          <Consent user={user} study={study} query={query} />
        )}
      </div>
    </StyledWrapper>
  );
}
