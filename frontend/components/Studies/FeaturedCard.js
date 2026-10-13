import ReactHtmlParser from "react-html-parser";
import Link from "next/link";
import { getStudyImageUrl } from "../../lib/profileStudyImageUrls";
import useTranslation from "next-translate/useTranslation";
import Button from "../DesignSystem/Button";
import Card from "../DesignSystem/Card";

export default function StudyCard({ user, study, isDashboard }) {
  const { t } = useTranslation("common");
  const { t: tBuilder } = useTranslation("builder");
  const imageURL = getStudyImageUrl(study);

  const { description } = study;
  let publicCardDescription = description;
  if (description && description.split(" ").length > 50) {
    publicCardDescription = `${description
      .split(" ")
      .slice(0, 50)
      .join(" ")} ...`;
  }

  // Same entry points as the study landing page: authors and collaborators
  // preview as a guest, everyone else goes through the participation flow.
  // People who already joined continue from the study page instead.
  const isAuthor =
    !!user &&
    (study?.author?.id === user.id ||
      study?.collaborators?.some((c) => c?.id === user.id));
  const hasJoined = user?.participantIn?.some((s) => s?.id === study?.id);

  return (
    <Card variant="outline" padding={0} className="featuredCard">
      <div className="featuredCardBody">
        <div className="cardInfo">
          <div className="cardMain">
            <div className="studyHeader">
              <h2>{study.title}</h2>
            </div>

            <div className="studyDescription">
              {ReactHtmlParser(publicCardDescription)}
            </div>
          </div>
          <div className="studyLink">
            {!hasJoined &&
              (isAuthor ? (
                <Link
                  href={{
                    pathname: `/join/details`,
                    query: { id: study?.id, step: `select`, guest: `true` },
                  }}
                >
                  <Button variant="filled">
                    {tBuilder(
                      "participateAsGuest",
                      {},
                      { default: "Participate as a guest" }
                    )}
                  </Button>
                </Link>
              ) : (
                <Link
                  href={{
                    pathname: `/join/select`,
                    query: { id: study?.id },
                  }}
                >
                  <Button variant="filled">
                    {tBuilder("participate", {}, { default: "Participate" })}
                  </Button>
                </Link>
              ))}
            {user ? (
              <Link
                href={{
                  pathname: `/dashboard/discover/studies`,
                  query: { name: study?.slug },
                }}
              >
                <Button variant="outline">
                  {t("goToStudy", {}, { default: "Go to study" })}
                </Button>
              </Link>
            ) : (
              <Link
                href={{
                  pathname: `/studies/${study?.slug}`,
                }}
              >
                <Button variant="outline">
                  {t("goToStudy", {}, { default: "Go to study" })}
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="studyImage">
          {imageURL ? (
            <div>
              <img src={imageURL} alt={study?.title} />
            </div>
          ) : (
            <div className="noImage"></div>
          )}
        </div>
      </div>
    </Card>
  );
}
