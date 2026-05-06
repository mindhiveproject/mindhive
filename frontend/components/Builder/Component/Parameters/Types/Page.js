import uniqid from "uniqid";
import JoditEditor from "../../../../Jodit/Editor";
import useTranslation from "next-translate/useTranslation";

export default function Page({ items, timeout, hideContinueBtn, onChange }) {
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
        item.id == name ? { ...item, [className]: options } : item,
      );
    } else {
      updatedItems = items.map((item) =>
        item.id == name ? { ...item, [className]: value } : item,
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
      item.id == id ? { ...item, [className]: options } : item,
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
      (opts, number) => number !== parseInt(num),
    );
    const updatedItems = items.map((item) =>
      item.id == id ? { ...item, [className]: options } : item,
    );
    updateProps({
      page: updatedItems,
      timeout: timeout,
      hideContinueBtn: hideContinueBtn,
    });
  };

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

  return (
    <div>
      <div className="pageSettingsPanel">
        <div className="pageSettingItem">
          <input
            type="checkbox"
            id="hideContinueBtn"
            name="hideContinueBtn"
            checked={hideContinueBtn}
            onChange={handleHideContinueBtnChange}
          />
          <label htmlFor="hideContinueBtn">
            {t("surveyBuilder.hideContinueBtn", "Hide Continue button")}
          </label>
        </div>
        <div className="pageSettingItem">
          <label>{t("surveyBuilder.pageTimeout", "Timeout")}</label>
          <input
            type="number"
            min="0"
            name="timeout"
            value={timeout}
            onChange={handleTimeoutChange}
          />
          <span className="timeoutUnit">ms</span>
        </div>
      </div>

      {items && items.length > 0 && (
        <div>
          {items.map((item, number) => (
            <Item
              item={item}
              key={item.id || number}
              handleItemChange={handleChange}
              deleteItem={deleteItem}
              moveDown={moveDown}
              moveUp={moveUp}
              number={number}
              totalItems={items.length}
              addNewOption={addNewOption}
              deleteOption={deleteOption}
              t={t}
            />
          ))}
        </div>
      )}

      <button className="addItemButton" onClick={addItem}>
        + {t("surveyBuilder.addItem", "Add question")}
      </button>
    </div>
  );
}

function Item({
  item,
  handleItemChange,
  deleteItem,
  moveDown,
  moveUp,
  number,
  totalItems,
  addNewOption,
  deleteOption,
  t,
}) {
  const {
    id,
    type,
    header,
    text,
    min_rating_label,
    max_rating_label,
    min_value,
    max_value,
    options,
    items,
    name,
  } = item;

  return (
    <div className={`surveyItemCard type-${type}`}>
      <div className="surveyItemCardHeader">
        <span className="itemNum">#{number + 1}</span>

        <select
          name={id}
          value={type}
          onChange={handleItemChange}
          className="type"
        >
          <option value="text">{t("surveyBuilder.text", "Text")}</option>
          <option value="select">
            {t("surveyBuilder.select", "Multiple choice (select one)")}
          </option>
          <option value="checkbox">
            {t("surveyBuilder.checkbox", "Multiple choice (select many)")}
          </option>
          <option value="freeinput">
            {t("surveyBuilder.freeinput", "Text input")}
          </option>
          <option value="vas">{t("surveyBuilder.vas", "Visual scale")}</option>
          <option value="likert">
            {t("surveyBuilder.likert", "Likert scale")}
          </option>
          <option value="block">{t("surveyBuilder.block", "Block")}</option>
        </select>

        <div className="itemCardControls">
          <button
            className="itemMoveBtn"
            onClick={(e) => moveUp(e, number)}
            disabled={number === 0}
            title="Move up"
          >
            ↑
          </button>
          <button
            className="itemMoveBtn"
            onClick={(e) => moveDown(e, number)}
            disabled={number === totalItems - 1}
            title="Move down"
          >
            ↓
          </button>
          <button
            className="itemDeleteBtn"
            onClick={(e) => deleteItem(e, number)}
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>

      <div className="surveyItemCardBody">
        {(type === "freeinput" ||
          type === "select" ||
          type === "checkbox" ||
          type === "likert" ||
          type === "vas") && (
          <>
            <div className="fieldLabel">
              {t("surveyBuilder.variableName", "Variable name")}
            </div>
            <input
              type="text"
              name={id}
              value={name}
              onChange={handleItemChange}
              className="name"
              placeholder={t("surveyBuilder.variableNamePlaceholder", "e.g. response_1 (used to store the answer)")}
              required
            />
          </>
        )}

        {type !== "block" && (
          <>
            <div className="fieldLabel">
              {t("surveyBuilder.header", "Header")}
            </div>
            <input
              type="text"
              name={id}
              value={header}
              onChange={handleItemChange}
              className="header"
              placeholder={t("surveyBuilder.headerPlaceholder", "e.g. Question title shown above the item")}
            />
          </>
        )}

        {type === "text" && (
          <>
            <div className="fieldLabel">
              {t("surveyBuilder.textLabel", "Text")}
            </div>
            <textarea
              name={id}
              value={text}
              onChange={handleItemChange}
              className="text"
              placeholder={t("surveyBuilder.textPlaceholder", "Enter descriptive or instructional text shown to participants")}
            />
          </>
        )}

        {(type === "select" || type === "checkbox" || type === "likert") && (
          <>
            <div className="fieldLabel">
              {t("surveyBuilder.options", "Options")}
            </div>
            {options.map((option, num) => (
              <div key={num} className="optionRow">
                <input
                  id={num}
                  type="text"
                  name={id}
                  value={option}
                  onChange={handleItemChange}
                  className="options"
                  placeholder={t("surveyBuilder.optionPlaceholder", "Option text")}
                />
                <button onClick={(e) => deleteOption(e, id, num, "options")}>
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={(e) => addNewOption(e, id, "options")}
              className="addOptionLink"
            >
              {t("surveyBuilder.addOption", "+ Add option")}
            </button>
          </>
        )}

        {type === "likert" && (
          <>
            <div className="fieldLabel">
              {t("surveyBuilder.likertItems", "Items for the Likert Scale")}
            </div>
            {items.map((item, num) => (
              <div key={num} className="optionRow">
                <input
                  id={num}
                  type="text"
                  name={id}
                  value={item}
                  onChange={handleItemChange}
                  className="items"
                  placeholder={t("surveyBuilder.likertItemPlaceholder", "Statement to rate")}
                />
                <button onClick={(e) => deleteOption(e, id, num, "items")}>
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={(e) => addNewOption(e, id, "items")}
              className="addOptionLink"
            >
              {t("surveyBuilder.addItemBtn", "+ Add item")}
            </button>
          </>
        )}

        {type === "vas" && (
          <>
            <div className="fieldLabel">
              {t("surveyBuilder.minValueLabel", "Minimum value label")}
            </div>
            <input
              type="text"
              name={id}
              value={min_rating_label}
              onChange={handleItemChange}
              className="min_rating_label"
              placeholder={t("surveyBuilder.minValueLabelPlaceholder", "e.g. Not at all")}
            />

            <div className="fieldLabel">
              {t("surveyBuilder.maxValueLabel", "Maximum value label")}
            </div>
            <input
              type="text"
              name={id}
              value={max_rating_label}
              onChange={handleItemChange}
              className="max_rating_label"
              placeholder={t("surveyBuilder.maxValueLabelPlaceholder", "e.g. Very much")}
            />

            <div className="fieldLabel">
              {t("surveyBuilder.minValue", "Minimum value")}
            </div>
            <input
              type="number"
              name={id}
              value={min_value}
              onChange={handleItemChange}
              className="min_value"
              placeholder="0"
            />

            <div className="fieldLabel">
              {t("surveyBuilder.maxValue", "Maximum value")}
            </div>
            <input
              type="number"
              name={id}
              value={max_value}
              onChange={handleItemChange}
              className="max_value"
              placeholder="100"
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
    </div>
  );
}
