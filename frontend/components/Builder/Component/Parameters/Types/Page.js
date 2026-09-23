import uniqid from "uniqid";
import TipTapEditor from "../../../../TipTap/Main";
import useTranslation from "next-translate/useTranslation";
import Button from "../../../../DesignSystem/Button";
import CompactActionButton from "../../../../DesignSystem/CompactActionButton";

const ArrowUpIcon = () => (
  <img src="/assets/icons/project/arrow_up.svg" alt="" width="20" height="20" aria-hidden />
);

const ArrowDownIcon = () => (
  <img
    src="/assets/icons/project/arrow_up.svg"
    alt=""
    width="20"
    height="20"
    aria-hidden
    style={{ transform: "rotate(180deg)" }}
  />
);

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
            {t("surveyBuilder.hideContinueBtn", {}, {
              default: "Hide Continue button",
            })}
          </label>
        </div>
        <div className="pageSettingItem">
          <label>
            {t("surveyBuilder.pageTimeout", {}, {
              default: "Page timeout (in milliseconds)",
            })}
          </label>
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

      <Button variant="outline" type="button" onClick={addItem}>
        {t("surveyBuilder.addItem", {}, { default: "Add question" })}
      </Button>
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
          <CompactActionButton
            kind="ghost"
            type="button"
            disabled={number === 0}
            icon={<ArrowUpIcon />}
            onClick={(e) => moveUp(e, number)}
            ariaLabel={t("surveyBuilder.moveUp", {}, { default: "Move up" })}
            title={t("surveyBuilder.moveUp", {}, { default: "Move up" })}
          />
          <CompactActionButton
            kind="ghost"
            type="button"
            disabled={number === totalItems - 1}
            icon={<ArrowDownIcon />}
            onClick={(e) => moveDown(e, number)}
            ariaLabel={t("surveyBuilder.moveDown", {}, { default: "Move down" })}
            title={t("surveyBuilder.moveDown", {}, { default: "Move down" })}
          />
          <CompactActionButton
            kind="delete"
            type="button"
            onClick={(e) => deleteItem(e, number)}
            ariaLabel={t("surveyBuilder.deleteQuestion", {}, {
              default: "Delete question",
            })}
            title={t("surveyBuilder.deleteQuestion", {}, {
              default: "Delete question",
            })}
          />
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
                  placeholder={t("surveyBuilder.optionPlaceholder", {}, {
                    default: "Option text",
                  })}
                />
                <CompactActionButton
                  kind="delete"
                  type="button"
                  onClick={(e) => deleteOption(e, id, num, "options")}
                  ariaLabel={t("surveyBuilder.deleteOption", {}, {
                    default: "Delete option",
                  })}
                  title={t("surveyBuilder.deleteOption", {}, {
                    default: "Delete option",
                  })}
                />
              </div>
            ))}
            <Button
              variant="text"
              type="button"
              onClick={(e) => addNewOption(e, id, "options")}
            >
              {t("surveyBuilder.addOption", {}, { default: "Add option" })}
            </Button>
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
                  placeholder={t("surveyBuilder.likertItemPlaceholder", {}, {
                    default: "Statement to rate",
                  })}
                />
                <CompactActionButton
                  kind="delete"
                  type="button"
                  onClick={(e) => deleteOption(e, id, num, "items")}
                  ariaLabel={t("surveyBuilder.deleteOption", {}, {
                    default: "Delete option",
                  })}
                  title={t("surveyBuilder.deleteOption", {}, {
                    default: "Delete option",
                  })}
                />
              </div>
            ))}
            <Button
              variant="text"
              type="button"
              onClick={(e) => addNewOption(e, id, "items")}
            >
              {t("surveyBuilder.addItemBtn", {}, { default: "Add item" })}
            </Button>
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
          <TipTapEditor
            content={typeof text === "string" ? text : ""}
            onUpdate={(value) =>
              handleItemChange({
                target: { value, id, className: "text", name: id },
              })
            }
            isEditable
            toolbarVisible
          />
        )}
      </div>
    </div>
  );
}
