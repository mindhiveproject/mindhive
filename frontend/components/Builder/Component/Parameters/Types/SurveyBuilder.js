import { useState } from "react";
import Page from "./Page";

// it holds all pages and displays the currently active page on the screen with surveyPageBuilder
export default function SurveyBuilder({ name, content, onChange }) {
  const [pages, setPages] = useState(JSON.parse(content) || []);
  const [currentPageNumber, setCurrentPageNumber] = useState(0);

  const packThePages = (value) => ({
    target: {
      name: name,
      type: "survey",
      value: JSON.stringify(value),
    },
  });

  const updateProps = (pages) => {
    const packed = packThePages(pages);
    onChange(packed);
  };

  const updatePages = ({ page, timeout, hideContinueBtn }) => {
    const updatedPages = pages;
    const cleanedTimeout = timeout >= 0 && timeout !== "" ? timeout : undefined;
    updatedPages[currentPageNumber] = {
      page,
      timeout: cleanedTimeout,
      hideContinueBtn,
    };
    updateProps(updatedPages);
  };

  const moveToPage = (e, number) => {
    e.preventDefault();
    setCurrentPageNumber(number);
  };

  const addNewPage = (e) => {
    e.preventDefault();
    const updatedPages = pages;
    updatedPages.push({ page: [] });
    updateProps(updatedPages);
  };

  const deletePage = (e, number) => {
    e.preventDefault();
    const nextPage = number > 0 ? number - 1 : number;
    setCurrentPageNumber(nextPage);
    pages.splice(number, 1);
    updateProps(pages);
  };

  return (
    <>
      <div className="pageHeader">
        {pages && pages.length > 0 ? (
          <h2>Page {currentPageNumber + 1}</h2>
        ) : (
          <h2>Add your first page</h2>
        )}

        <button
          className="notActivePageButton"
          onClick={(e) => deletePage(e, currentPageNumber)}
        >
          Delete this page
        </button>
      </div>

      <div className="pageButtons">
        {pages.map((page, number) => (
          <button
            onClick={(e) => moveToPage(e, number)}
            key={number}
            className={
              number === currentPageNumber
                ? "activePageButton"
                : "notActivePageButton"
            }
          >
            {number + 1}
          </button>
        ))}
        {pages && (
          <button
            className="notActivePageButton"
            onClick={(e) => addNewPage(e)}
          >
            +
          </button>
        )}
      </div>

      {pages && pages.length > 0 && (
        <Page
          name={name}
          items={pages[currentPageNumber]?.page || {}}
          timeout={pages[currentPageNumber]?.timeout || undefined}
          hideContinueBtn={pages[currentPageNumber]?.hideContinueBtn || false}
          onChange={updatePages}
        />
      )}
    </>
  );
}
