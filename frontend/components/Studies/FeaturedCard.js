import ReactHtmlParser from "react-html-parser";

import Link from "next/link";

export default function StudyCard({ user, study, isDashboard }) {
  const imageURL = study?.image?.image?.publicUrlTransformed;

  const { description } = study;
  let publicCardDescription = description;
  if (description && description.split(" ").length > 50) {
    publicCardDescription = `${description
      .split(" ")
      .slice(0, 50)
      .join(" ")} ...`;
  }

  return (
    <div className="card">
      <div className="cardInfo">
        <div className="cardMain">
          <div className="studyFeatured">Featured</div>

          <div className="studyHeader">
            <h2>{study.title}</h2>
          </div>

          <div className="studyDescription">
            {ReactHtmlParser(publicCardDescription)}
          </div>
        </div>
        <div className="studyLink">
          {user ? (
            <Link
              href={{
                pathname: `/dashboard/discover/studies`,
                query: { name: study?.slug },
              }}
            >
              <button>Go to study</button>
            </Link>
          ) : (
            <Link
              href={{
                pathname: `/studies/${study?.slug}`,
              }}
            >
              <button>Go to study</button>
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
  );
}
