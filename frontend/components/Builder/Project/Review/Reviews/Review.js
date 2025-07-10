import ReactStars from "react-rating-stars-component";
import useTranslation from "next-translate/useTranslation";

export default function Review({ review, reviewNumber, closeReview }) {
  const { t } = useTranslation("builder");
  return (
    <div className="review">
      <div className="header">
        <div className="headerLeft">
          <div className="backBtn" onClick={closeReview}>
            ← {t("reviewDetail.exit", "Exit")} {" "}
            {review?.stage === "INDIVIDUAL"
              ? t("reviewDetail.individualReview", "individual review")
              : t("reviewDetail.synthesis", "synthesis")} {" "}
            {reviewNumber}
          </div>
        </div>
        <div className="headerRight"></div>
      </div>
      <div className="content">
        <div className="reviewBoard">
          {review?.content?.map((item) => (
            <div className="block">
              <h3>{item?.question}</h3>
              {review?.stage === "INDIVIDUAL" && (
                <div className="rating">
                  <ReactStars
                    count={5}
                    size={24}
                    activeColor="#ffd700"
                    isHalf
                    value={item.rating}
                    edit={false}
                  />
                </div>
              )}
              <p>{item?.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
