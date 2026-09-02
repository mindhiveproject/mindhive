import { useRouter } from "next/router";

import { StyledWrapper } from "../../styles/StyledJoinStudyFlow";

import Selector from "./Selector";
import SignIn from "../../Auth/Login";
import RoleSignup from "../../Auth/SignupRoles/Role";
import Details from "./Details";
import Consents from "./Consents/Main";
import ConsentSkippedMessage from "./Consents/ConsentSkippedMessage";
import IconButton from "../../DesignSystem/IconButton";
import { CloseIcon } from "../../DesignSystem/Icons";
import useTranslation from "next-translate/useTranslation";

function JoinFlowHeader({ header, closeHref, closeLabel }) {
  const router = useRouter();

  return (
    <div className="header">
      <div className="logo">
        <img src="/logo.png" alt="icon" height="30" />
      </div>
      <div className="headerTitle">{header}</div>
      <div className="headerClose">
        <IconButton
          variant="subtle"
          icon={<CloseIcon />}
          ariaLabel={closeLabel}
          title={closeLabel}
          onClick={() => router.push(closeHref)}
        />
      </div>
    </div>
  );
}

export default function FlowWrapper({ query, user, study, step }) {
  const { guest } = query;
  const { t } = useTranslation("common");
  const closeLabel = t("close", {}, { default: "Close" });

  let header;
  switch (step) {
    case "select":
      header = t("flow.header.participation", {}, { default: "Participation" });
      break;
    case "signup":
      header = t("flow.header.participantDetails", {}, {
        default: "Participant details",
      });
      break;
    case "login":
      header = t("flow.header.login", {}, { default: "Login" });
      break;
    case "details":
      header = t("flow.header.participantDetails", {}, {
        default: "Participant details",
      });
      break;
    case "consent":
    case "consent-skipped":
      header = t("flow.header.studyConsent", {}, { default: "Study consent" });
      break;
    default:
      header = t("flow.header.participation", {}, { default: "Participation" });
  }

  const closeHref = user
    ? {
        pathname: `/dashboard/discover/studies`,
        query: { name: study?.slug },
      }
    : {
        pathname: `/studies/${study?.slug}`,
      };

  if (
    (step === "details" || step === "consent") &&
    guest === "false" &&
    !user
  ) {
    return (
      <StyledWrapper>
        <JoinFlowHeader
          header={t("flow.header.participation", {}, {
            default: "Participation",
          })}
          closeHref={{ pathname: `/studies/${study?.slug}` }}
          closeLabel={closeLabel}
        />
        <div className="main">
          <Selector user={user} study={study} query={query} />
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <JoinFlowHeader
        header={header}
        closeHref={closeHref}
        closeLabel={closeLabel}
      />
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
        {step === "consent-skipped" && (
          <ConsentSkippedMessage study={study} />
        )}
      </div>
    </StyledWrapper>
  );
}
