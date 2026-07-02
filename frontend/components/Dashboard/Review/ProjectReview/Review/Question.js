import {
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  Dropdown,
  Icon,
} from "semantic-ui-react";

import ReactStars from "react-rating-stars-component"; // https://www.npmjs.com/package/react-rating-stars-component
import TaskSelector from "./TaskSelector";
import useTranslation from "next-translate/useTranslation";

export default function Question({ stage, item, handleItemChange, answer }) {
  const { t } = useTranslation("builder");
  const { responseType } = item;

  if (responseType === "selectOne") {
    const options = item?.responseOptions.map((r) => ({
      key: r.value,
      value: r.value,
      content: (
        <div className="dropdownOption">
          <img src={`/assets/icons/status/${r?.icon}.svg`} />
          <div>
            <div className="title">{r?.title}</div>
            <div className="subtitle">{r?.subtitle}</div>
          </div>
        </div>
      ),
      text: (
        <div className="dropdownSelectedOption">
          <img src={`/assets/icons/status/${r?.icon}.svg`} />
          <div>
            <div className="title">{r?.title}</div>
          </div>
        </div>
      ),
    }));

    return (
      <div className="reviewItem">
        <div className="question">{item.question}</div>
        <Dropdown
          placeholder={t("reviewDetail.selectOption")}
          fluid
          selection
          options={options}
          onChange={(event, data) =>
            handleItemChange({
              className: "answer",
              name: item.name,
              value: data?.value,
            })
          }
          value={answer}
          className="custom-dropdown"
        />
      </div>
    );
  }

  if (responseType === "taskSelector") {
    return (
      <div className="reviewItem">
        <TaskSelector
          name={item?.name}
          handleItemChange={handleItemChange}
          answer={answer || []}
        />
      </div>
    );
  }

  if (responseType === "dualTextarea") {
    const answerObj =
      answer && typeof answer === "object"
        ? { subA: answer.subA ?? "", subB: answer.subB ?? "" }
        : { subA: "", subB: "" };

    const updateSubAnswer = (subKey, value) => {
      handleItemChange({
        className: "answer",
        name: item.name,
        value: { ...answerObj, [subKey]: value },
      });
    };

    return (
      <div className="reviewItem">
        <div className="question">{item.question}</div>
        {item.subQuestionA && (
          <div className="subtitle">{item.subQuestionA}</div>
        )}
        <textarea
          type="text"
          id={`${item.name}-subA`}
          name={`${item.name}-subA`}
          value={answerObj.subA}
          className="answer"
          onChange={({ target }) => updateSubAnswer("subA", target.value)}
        />
        {item.subQuestionB && (
          <div className="subtitle">{item.subQuestionB}</div>
        )}
        <textarea
          type="text"
          id={`${item.name}-subB`}
          name={`${item.name}-subB`}
          value={answerObj.subB}
          className="answer"
          onChange={({ target }) => updateSubAnswer("subB", target.value)}
        />
      </div>
    );
  }

  return (
    <div className="reviewItem">
      <div>
        <div className="question">{item.question}</div>
        {item.subtitle && <div className="subtitle">{item.subtitle}</div>}
        {item.subQuestionA && (
          <div className="subtitle">{item.subQuestionA}</div>
        )}
        {item.subQuestionB && (
          <div className="subtitle">{item.subQuestionB}</div>
        )}
        <p>{item.text}</p>
      </div>

      {stage === "IN_REVIEW" && (
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

      <textarea
        type="text"
        id={item.name}
        name={item.name}
        value={answer}
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
  );
}
