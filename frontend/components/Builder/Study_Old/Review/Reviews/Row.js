export default function Row({ number, review, stage, selectReview }) {
  return (
    <div
      className="row"
      onClick={() => {
        selectReview(review, number);
      }}
    >
      {stage === "INDIVIDUAL" ? "Review" : "Synthesis"} {number}
    </div>
  );
}
