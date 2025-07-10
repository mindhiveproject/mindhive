import { StyledWrapper } from "../../styles/StyledJoinStudyFlow";
import Link from "next/link";

import Selector from "./Selector";
import SignIn from "../../Auth/Login";
import RoleSignup from "../../Auth/SignupRoles/Role";
import Details from "./Details";
import Consents from "./Consents/Main";
import ConsentSkippedMessage from "./Consents/ConsentSkippedMessage";
import useTranslation from "next-translate/useTranslation";

export default function FlowWrapper({ query, user, study, step }) {
  const { guest } = query;
  const { t } = useTranslation('common');

  let header;
  switch (step) {
    case "select":
      header = t('flow.header.participation');
      break;
    case "signup":
      header = t('flow.header.participantDetails');
      break;
    case "login":
      header = t('flow.header.login');
      break;
    case "details":
      header = t('flow.header.participantDetails');
      break;
    case "consent":
      header = t('flow.header.studyConsent');
      break;
    default:
      header = t('flow.header.participation');
  }

  if (step === "consent-skipped") {
    return <ConsentSkippedMessage />;
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
          <div>{t('flow.header.participation')}</div>
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
