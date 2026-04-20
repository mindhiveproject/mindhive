import { useState } from "react";
import Page from "./Page";
import useTranslation from "next-translate/useTranslation";

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
