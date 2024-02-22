import ReactStars from "react-rating-stars-component"; // https://www.npmjs.com/package/react-rating-stars-component

export default function Question({ stage, item, handleItemChange }) {
  return (
    <div className="reviewItem">
      <div>
        <h2>{item.question}</h2>
        {item.subQuestionA && (
          <ol type="a">
            <li>{item.subQuestionA}</li>
            <li>{item.subQuestionB}</li>
          </ol>
        )}
        <p>{item.text}</p>
      </div>

      {stage === "INDIVIDUAL" && (
        <div>
          <ReactStars
            count={5}
            onChange={(value) =>
              handleItemChange({
                className: "rating",
                name: item.name,
                value,
              })
            }
            size={24}
            activeColor="#ffd700"
            isHalf
            value={item?.rating}
          />
        </div>
      )}

      <div>
        <textarea
          type="text"
          id={item.name}
          name={item.name}
          value={item.answer}
          className="answer"
          onChange={({ target }) =>
            handleItemChange({
              className: "answer",
              name: item.name,
              value: target.value,
            })
          }
        />
      </div>
    </div>
  );
}
