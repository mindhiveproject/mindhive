import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";
import { GET_RESOURCE } from "../../Queries/Resource";
import StyledResource from "../../styles/StyledResource";
import Button from "../../DesignSystem/Button";

export default function ViewResource({ query, user, goBack }) {
  const { id } = query;
  const { data, loading, error } = useQuery(GET_RESOURCE, {
    variables: { id },
  });
  const resource = data?.resource || {};
  const { t } = useTranslation("classes");
  if (loading) return <p>{t("boardManagement.loadingDotdotdot")}</p>;
  if (error) return <p>{t("boardManagement.errorLoadingResources")}</p>;

  return (
    <StyledResource>
      <Button
        className="goBackBtn"
        variant="outline"
        onClick={goBack}
        // leadingIcon={<img src="/assets/icons/back.svg" alt="" aria-hidden width={18} height={18} />}
      >
        {t("boardManagement.goBackToResourceArea")}
      </Button>
      <h1>{resource?.title}</h1>
      <p>{resource?.description}</p>
      <div>{ReactHtmlParser(resource?.content?.main)}</div>
    </StyledResource>
  );
}
