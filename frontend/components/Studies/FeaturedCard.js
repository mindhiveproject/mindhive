import ReactHtmlParser from "react-html-parser";

export default function StudyCard({ study }) {
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
          <a href={`/studies/${study?.slug}`} target="_blank">
            <button>Go to study</button>
          </a>
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
