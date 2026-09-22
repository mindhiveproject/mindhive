import { useEffect, useState } from "react";
import uniqid from "uniqid";
import Page from "./Page";
import useTranslation from "next-translate/useTranslation";
import Button from "../../../../DesignSystem/Button";
import IconButton from "../../../../DesignSystem/IconButton";
import CompactActionButton from "../../../../DesignSystem/CompactActionButton";
import { AddIcon } from "../../../../DesignSystem/Icons";

const PageNumberIcon = ({ number }) => (
  <span className="MH-Type-Label-Base" aria-hidden>
    {number}
  </span>
);

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

function parseSurveyPages(content) {
  if (Array.isArray(content)) return content;
  if (typeof content !== "string" || !content.trim()) return [];
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// it holds all pages and displays the currently active page on the screen with surveyPageBuilder
export default function SurveyBuilder({ name, content, onChange }) {
  const { t } = useTranslation("builder");
  const [pages, setPages] = useState(() => parseSurveyPages(content));
  const [currentPageNumber, setCurrentPageNumber] = useState(0);

  useEffect(() => {
    const parsed = parseSurveyPages(content);
    setPages((current) => (current.length === 0 && parsed.length > 0 ? parsed : current));
  }, [content]);

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
          {t("surveyBuilder.pages", {}, { default: "Pages" })}
        </span>

        {pages.map((_page, number) => (
          <IconButton
            key={number}
            type="button"
            variant={number === currentPageNumber ? "tonal" : "text"}
            elevated={false}
            ariaLabel={t("surveyBuilder.page", { number: number + 1 }, {
              default: "Page {{number}}",
            })}
            title={t("surveyBuilder.page", { number: number + 1 }, {
              default: "Page {{number}}",
            })}
            onClick={(e) => moveToPage(e, number)}
            icon={<PageNumberIcon number={number + 1} />}
          />
        ))}

        <Button
          variant="tonal"
          type="button"
          leadingIcon={<AddIcon />}
          onClick={addNewPage}
        >
          {t("surveyBuilder.addPage", {}, { default: "Add page" })}
        </Button>

        <Button variant="text" type="button" onClick={addExamplePage}>
          {t("surveyBuilder.addExamplePage", {}, { default: "Show example" })}
        </Button>

        {pages.length > 0 && (
          <span className="surveyPageNavDelete">
            <CompactActionButton
              kind="delete"
              type="button"
              onClick={(e) => deletePage(e, currentPageNumber)}
              ariaLabel={t(
                "surveyBuilder.deletePage",
                { number: currentPageNumber + 1 },
                { default: "Delete page" }
              )}
              title={t(
                "surveyBuilder.deletePage",
                { number: currentPageNumber + 1 },
                { default: "Delete page" }
              )}
            />
          </span>
        )}
      </div>

      {pages.length === 0 ? (
        <div className="surveyEmptyState">
          {t("surveyBuilder.addFirstPage", {}, {
            default: "Add your first page to start building the survey",
          })}
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
