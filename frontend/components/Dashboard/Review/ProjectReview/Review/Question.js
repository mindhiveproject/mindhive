import {
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  Dropdown,
} from "semantic-ui-react";

import ReactStars from "react-rating-stars-component"; // https://www.npmjs.com/package/react-rating-stars-component
import TaskSelector from "./TaskSelector";

export default function Question({ stage, item, handleItemChange, answer }) {
  const { responseType } = item;

  if (responseType === "selectOne") {
    const options = item?.responseOptions.map((r) => ({
      key: r.value,
      text: r.title,
      value: r.value,
    }));

    return (
      // <Dropdown>
      //   <DropdownMenu>
      //     {options.map((option) => (
      //       <DropdownItem>
      //         <div></div>
      //       </DropdownItem>
      //     ))}
      //   </DropdownMenu>
      // </Dropdown>
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
        value={item?.answer}
      />
    );
  }

  if (responseType === "taskSelector") {
    return (
      <TaskSelector
        name={item?.name}
        handleItemChange={handleItemChange}
        answer={answer}
      />
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
