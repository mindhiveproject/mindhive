import { useState } from "react";
import uniqid from "uniqid";
import Page from "./Page";
import useTranslation from "next-translate/useTranslation";

const buildExamplePage = () => [
  {
    id: uniqid.time(),
    type: "text",
    header: "Welcome",
    text: "Please answer the following questions honestly. Your responses are anonymous.",
    question: "",
    min_rating_label: "",
    max_rating_label: "",
    min_value: "",
    max_value: "",
    options: [""],
    items: [""],
  },
  {
    id: uniqid.time(),
    type: "select",
    header: "What is your age group?",
    text: "",
    question: "",
    name: "age_group",
    min_rating_label: "",
    max_rating_label: "",
    min_value: "",
    max_value: "",
    options: ["Under 18", "18–25", "26–35", "36–50", "Over 50"],
    items: [""],
  },
  {
    id: uniqid.time(),
    type: "checkbox",
    header: "Which activities do you enjoy? (Select all that apply)",
    text: "",
    question: "",
    name: "enjoyed_activities",
    min_rating_label: "",
    max_rating_label: "",
    min_value: "",
    max_value: "",
    options: ["Reading", "Exercise", "Music", "Cooking", "Gaming"],
    items: [""],
  },
  {
    id: uniqid.time(),
    type: "freeinput",
    header: "Please describe your experience in a few words",
    text: "",
    question: "",
    name: "experience_description",
    min_rating_label: "",
    max_rating_label: "",
    min_value: "",
    max_value: "",
    options: [""],
    items: [""],
  },
  {
    id: uniqid.time(),
    type: "vas",
    header: "How are you feeling right now?",
    text: "",
    question: "",
    name: "current_feeling",
    min_rating_label: "Not at all",
    max_rating_label: "Very much",
    min_value: "0",
    max_value: "100",
    options: [""],
    items: [""],
  },
  {
    id: uniqid.time(),
    type: "likert",
    header: "Rate your agreement with each statement",
    text: "",
    question: "",
    name: "agreement_ratings",
    min_rating_label: "",
    max_rating_label: "",
    min_value: "",
    max_value: "",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
    items: ["I enjoy learning new things", "I prefer quiet environments", "I work well in teams"],
  },
  {
    id: uniqid.time(),
    type: "block",
    header: "",
    text: "<p><strong>Thank you for completing this section!</strong> Click <em>Continue</em> to proceed.</p>",
    question: "",
    name: "",
    min_rating_label: "",
    max_rating_label: "",
    min_value: "",
    max_value: "",
    options: [""],
    items: [""],
  },
];

// it holds all pages and displays the currently active page on the screen with surveyPageBuilder
export default function SurveyBuilder({ name, content, onChange }) {
  const { t } = useTranslation("builder");
  const [pages, setPages] = useState(() => {
    try {
      return JSON.parse(content) || [];
    } catch {
      return [];
    }
  });
  const [currentPageNumber, setCurrentPageNumber] = useState(0);

  const packThePages = (value) => ({
    target: {
      name: name,
      type: "survey",
      value: JSON.stringify(value),
    },
  });

  const updateProps = (updatedPages) => {
    setPages(updatedPages);
    onChange(packThePages(updatedPages));
  };

  const updatePages = ({ page, timeout, hideContinueBtn }) => {
    const cleanedTimeout = timeout >= 0 && timeout !== "" ? timeout : undefined;
    const updatedPages = pages.map((p, i) =>
      i === currentPageNumber
        ? { page, timeout: cleanedTimeout, hideContinueBtn }
        : p
    );
    updateProps(updatedPages);
  };

  const moveToPage = (e, number) => {
    e.preventDefault();
    setCurrentPageNumber(number);
  };

  const addNewPage = (e) => {
    e.preventDefault();
    updateProps([...pages, { page: [] }]);
  };

  const addExamplePage = (e) => {
    e.preventDefault();
    const examplePage = { page: buildExamplePage() };
    const updatedPages = [...pages, examplePage];
    updateProps(updatedPages);
    setCurrentPageNumber(updatedPages.length - 1);
  };

  const deletePage = (e, number) => {
    e.preventDefault();
    const nextPage = number > 0 ? number - 1 : 0;
    setCurrentPageNumber(nextPage);
    updateProps(pages.filter((_, i) => i !== number));
  };

  return (
    // stopImmediatePropagation prevents key events from reaching CanvasWidget's document-level listener
    <div onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}>
      <div className="surveyPageNav">
        <span className="surveyPageNavLabel">
          {t("surveyBuilder.pages", "Pages")}
        </span>

        {pages.map((_page, number) => (
          <button
            onClick={(e) => moveToPage(e, number)}
            key={number}
            className={`pageTabButton${number === currentPageNumber ? " active" : ""}`}
          >
            {number + 1}
          </button>
        ))}

        <button className="addPageButton" onClick={(e) => addNewPage(e)}>
          + {t("surveyBuilder.addPage", "Add page")}
        </button>

        <button className="addPageButton examplePageButton" onClick={(e) => addExamplePage(e)}>
          {t("surveyBuilder.addExamplePage", "Show example")}
        </button>

{pages.length > 0 && (
          <button
            className="deletePageButton"
            onClick={(e) => deletePage(e, currentPageNumber)}
          >
            {t("surveyBuilder.deletePage", "Delete page")} {currentPageNumber + 1}
          </button>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="surveyEmptyState">
          {t("surveyBuilder.addFirstPage", "Add your first page to start building the survey")}
        </div>
      ) : (
        <Page
          name={name}
          items={pages[currentPageNumber]?.page || []}
          timeout={pages[currentPageNumber]?.timeout || undefined}
          hideContinueBtn={pages[currentPageNumber]?.hideContinueBtn || false}
          onChange={updatePages}
        />
      )}
    </div>
  );
}
