import ReactStars from "react-rating-stars-component";

export default function Review({ review, reviewNumber, closeReview }) {
  return (
    <div className="review">
      <div className="header">
        <div className="headerLeft">
          <div className="backBtn" onClick={closeReview}>
            ← Exit{" "}
            {review?.stage === "INDIVIDUAL"
              ? " individual review"
              : "synthesis"}{" "}
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
