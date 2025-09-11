import uniqid from "uniqid";
import JoditEditor from "../../../../Jodit/Editor";
import useTranslation from "next-translate/useTranslation";
// import JoditEditorPro from "../../../../Jodit/EditorPro";

export default function Page({
  name,
  items,
  timeout,
  hideContinueBtn,
  onChange,
}) {
  const { t } = useTranslation("builder");
  const updateProps = ({ page, timeout, hideContinueBtn }) => {
    onChange({ page, timeout, hideContinueBtn });
  };

  const handleChange = (e) => {
    const { id, value, className, name } = e.target;
    let updatedItems;
    if (className === "options" || className === "items") {
      const updatedOptions = items
        .filter((item) => item.id == name)
        .map((item) => item[className]);
      const options = updatedOptions[0];
      options[id] = value;
      updatedItems = items.map((item) =>
        item.id == name ? { ...item, [className]: options } : item
      );
    } else {
      updatedItems = items.map((item) =>
        item.id == name ? { ...item, [className]: value } : item
      );
    }
    updateProps({
      page: updatedItems,
      timeout: timeout,
      hideContinueBtn: hideContinueBtn,
    });
  };

  const handleTimeoutChange = (e) => {
    const { value } = e.target;
    updateProps({
      page: items,
      timeout: value,
      hideContinueBtn: hideContinueBtn,
    });
  };

  const handleHideContinueBtnChange = (e) => {
    const value = e.target.checked;
    updateProps({
      page: items,
      timeout: timeout,
      hideContinueBtn: value,
    });
  };

  const addNewOption = (e, id, className) => {
    e.preventDefault();
    const updatedOptions = items
      .filter((item) => item.id == id)
      .map((item) => item[className])
      .map((opts) => opts.concat([""]));
    const options = updatedOptions[0];
    const updatedItems = items.map((item) =>
      item.id == id ? { ...item, [className]: options } : item
    );
    updateProps({
      page: updatedItems,
      timeout: timeout,
      hideContinueBtn: hideContinueBtn,
    });
  };

  const deleteOption = (e, id, num, className) => {
    e.preventDefault();
    const updatedOptions = items
      .filter((item) => item.id == id)
      .map((item) => item[className]);
    const options = updatedOptions[0].filter(
      (opts, number) => number !== parseInt(num)
    );
    const updatedItems = items.map((item) =>
      item.id == id ? { ...item, [className]: options } : item
    );
    updateProps({
      page: updatedItems,
      timeout: timeout,
      hideContinueBtn: hideContinueBtn,
    });
  };

  const packTheObject = (value) => ({
    target: {
      name: name,
      type: "survey",
      value: JSON.stringify(value),
    },
  });

  const addItem = (e) => {
    e.preventDefault();
    const updatedItems = [
      ...items,
      {
        id: uniqid.time(),
        type: "text",
        header: "",
        text: "",
        question: "",
        min_rating_label: "",
        max_rating_label: "",
        min_value: "",
        max_value: "",
        options: [""],
        items: [""],
      },
    ];
    updateProps({
      page: updatedItems,
      timeout: timeout,
      hideContinueBtn: hideContinueBtn,
    });
  };

  const deleteItem = (e, number) => {
    e.preventDefault();
    const updatedItems = items.filter((item, num) => num !== number);
    updateProps({
      page: updatedItems,
      timeout: timeout,
      hideContinueBtn: hideContinueBtn,
    });
  };

  const moveUp = (e, number) => {
    e.preventDefault();
    if (number > 0) {
      const currentItem = items[number];
      const nextItem = items[number - 1];
      const updatedItems = [...items];
      updatedItems[number] = nextItem;
      updatedItems[number - 1] = currentItem;
      updateProps({
        page: updatedItems,
        timeout: timeout,
        hideContinueBtn: hideContinueBtn,
      });
    }
  };

  const moveDown = (e, number) => {
    e.preventDefault();
    if (number < items.length - 1) {
      const currentItem = items[number];
      const nextItem = items[number + 1];
      const updatedItems = [...items];
      updatedItems[number] = nextItem;
      updatedItems[number + 1] = currentItem;
      updateProps({
        page: updatedItems,
        timeout: timeout,
        hideContinueBtn: hideContinueBtn,
      });
    }
  };

  if (items && items.length > 0) {
    return (
      <div>
        <div className="hideContinueBtn">
          <div>
            <input
              type="checkbox"
              id="hideContinueBtn"
              name="hideContinueBtn"
              checked={hideContinueBtn}
              onChange={handleHideContinueBtnChange}
            />
          </div>
          <div>
            <label htmlFor="hideContinueBtn">{t("surveyBuilder.hideContinueBtn", "Hide Continue button")}</label>
          </div>
        </div>
        <div className="timeout">
          <div>{t("surveyBuilder.pageTimeout", "Page timeout (in milliseconds)")}</div>
          <div>
            <input
              type="number"
              min="0"
              name="timeout"
              value={timeout}
              onChange={handleTimeoutChange}
              className="timeout"
            />
          </div>
        </div>

        <div>
          {items.map((item, number) => (
            <Item
              item={item}
              key={number}
              handleItemChange={handleChange}
              deleteItem={deleteItem}
              moveDown={moveDown}
              moveUp={moveUp}
              number={number}
              addNewOption={addNewOption}
              deleteOption={deleteOption}
              t={t}
            />
          ))}
        </div>

        <button className="addButton" onClick={addItem}>
          {t("surveyBuilder.addItem", "+")}
        </button>
      </div>
    );
  }
  return (
    <button className="addButton" onClick={addItem}>
      {t("surveyBuilder.addItem", "+")}
    </button>
  );
}

function Item({
  item,
  handleItemChange,
  deleteItem,
  moveDown,
  moveUp,
  number,
  addNewOption,
  deleteOption,
  t,
}) {
  const {
    id,
    type,
    header,
    text,
    question,
    min_rating_label,
    max_rating_label,
    min_value,
    max_value,
    options,
    items,
    name,
  } = item;

  return (
    <div className="surveyBuilderItemLine">
      <div className="input">
        <div>{t("surveyBuilder.type", "Type")}</div>
        <select
          type="text"
          name={id}
          value={type}
          onChange={handleItemChange}
          className="type"
        >
          <option value="text">{t("surveyBuilder.text", "Text")}</option>
          <option value="select">{t("surveyBuilder.select", "Multiple choice (select one)")}</option>
          <option value="checkbox">{t("surveyBuilder.checkbox", "Multiple choice (select many options)")}</option>
          <option value="freeinput">{t("surveyBuilder.freeinput", "Text input")}</option>
          <option value="vas">{t("surveyBuilder.vas", "Visual scale")}</option>
          <option value="likert">{t("surveyBuilder.likert", "Likert scale")}</option>
          <option value="block">{t("surveyBuilder.block", "Block")}</option>
        </select>

        {(type === "freeinput" ||
          type === "select" ||
          type === "checkbox" ||
          type === "likert" ||
          type === "vas") && (
          <>
            <div>{t("surveyBuilder.variableName", "Variable name")}</div>
            <input
              type="text"
              name={id}
              value={name}
              onChange={handleItemChange}
              className="name"
              required
            />
          </>
        )}

        {type !== "block" && (
          <>
            <div>{t("surveyBuilder.header", "Header")}</div>
            <input
              type="text"
              name={id}
              value={header}
              onChange={handleItemChange}
              className="header"
            />
          </>
        )}

        {type === "text" && (
          <>
            <div>{t("surveyBuilder.textLabel", "Text")}</div>
            <textarea
              type="text"
              name={id}
              value={text}
              onChange={handleItemChange}
              className="text"
            />
          </>
        )}

        {(type === "select" || type === "checkbox" || type === "likert") && (
          <>
            <div>{t("surveyBuilder.options", "Options")}</div>
            {options.map((option, num) => (
              <div key={num} className="optionRow">
                <input
                  key={num}
                  id={num}
                  type="text"
                  name={id}
                  value={option}
                  onChange={handleItemChange}
                  className="options"
                />
                <button onClick={(e) => deleteOption(e, id, num, "options")}> &times; </button>
              </div>
            ))}
            <button
              onClick={(e) => addNewOption(e, id, "options")}
              className="addOptionButton"
            >
              {t("surveyBuilder.addOption", "+ option")}
            </button>
          </>
        )}

        {type === "likert" && (
          <>
            <div>{t("surveyBuilder.likertItems", "Items for the Likert Scale")}</div>
            {items.map((item, num) => (
              <div key={num} className="optionRow">
                <input
                  key={num}
                  id={num}
                  type="text"
                  name={id}
                  value={item}
                  onChange={handleItemChange}
                  className="items"
                />
                <button onClick={(e) => deleteOption(e, id, num, "items")}> &times; </button>
              </div>
            ))}
            <button
              onClick={(e) => addNewOption(e, id, "items")}
              className="addOptionButton"
            >
              {t("surveyBuilder.addItemBtn", "+ item")}
            </button>
          </>
        )}

        {type === "vas" && (
          <>
            <div>{t("surveyBuilder.minValueLabel", "Minimum value label")}</div>
            <input
              type="text"
              name={id}
              value={min_rating_label}
              onChange={handleItemChange}
              className="min_rating_label"
            />

            <div>{t("surveyBuilder.maxValueLabel", "Maximum value label")}</div>
            <input
              type="text"
              name={id}
              value={max_rating_label}
              onChange={handleItemChange}
              className="max_rating_label"
            />

            <div>{t("surveyBuilder.minValue", "Minimum value")}</div>
            <input
              type="number"
              name={id}
              value={min_value}
              onChange={handleItemChange}
              className="min_value"
            />

            <div>{t("surveyBuilder.maxValue", "Maximum value")}</div>
            <input
              type="number"
              name={id}
              value={max_value}
              onChange={handleItemChange}
              className="max_value"
            />
          </>
        )}

        {type === "block" && (
          <JoditEditor
            content={text}
            setContent={(value) =>
              handleItemChange({
                target: { value, id, className: "text", name: id },
              })
            }
          />
        )}
      </div>
      <div className="controlButtons">
        <div className="deleteDiv">
          <button onClick={(e) => deleteItem(e, number)}>&times;</button>
        </div>
        <div className="moveButtons">
          <button onClick={(e) => moveUp(e, number)}>↑</button>
          <button onClick={(e) => moveDown(e, number)}>↓</button>
        </div>
      </div>
    </div>
  );
}
