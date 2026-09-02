import Link from "next/link";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";
import Button from "../../../DesignSystem/Button";

export default function ConsentSkippedMessage({ study }) {
  const { t } = useTranslation("common");
  const studyHref = study?.slug
    ? { pathname: `/studies/${study.slug}` }
    : { pathname: `/dashboard/discover` };

  return (
    <StyledContainer>
      <h1>
        {t("consent.skipped.header", {}, { default: "Unable to Participate" })}
      </h1>
      <p>
        {t("consent.skipped.message", {}, {
          default:
            "Unfortunately, you cannot participate in the study because you did not agree to the required consent form.",
        })}
      </p>
      <p>
        {t("consent.skipped.contact", {}, {
          default: "Please contact the study administrator for more information.",
        })}
      </p>
      <div className="actions">
        <Link href={studyHref}>
          <Button variant="filled">
            {t("goToStudy", {}, { default: "Go to study" })}
          </Button>
        </Link>
      </div>
    </StyledContainer>
  );
}

const StyledContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 8px 0 24px;
  text-align: center;

  h1 {
    font: var(--MH-Type-Heading-Small);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Black, #171717);
    margin-bottom: 16px;
  }

  p {
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
    margin-bottom: 16px;
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
`;
