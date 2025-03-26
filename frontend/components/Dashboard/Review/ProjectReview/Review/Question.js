import {
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  Dropdown,
  Icon,
} from "semantic-ui-react";

import ReactStars from "react-rating-stars-component"; // https://www.npmjs.com/package/react-rating-stars-component
import TaskSelector from "./TaskSelector";

export default function Question({ stage, item, handleItemChange, answer }) {
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
          placeholder="Select an option"
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

  return (
    <div className="reviewItem">
      <div>
        <div className="question">{item.question}</div>
        {item.subtitle && <div className="subtitle">{item.subtitle}</div>}
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
