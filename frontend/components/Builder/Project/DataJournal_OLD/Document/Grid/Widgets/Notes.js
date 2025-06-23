import React from "react";
import useTranslation from "next-translate/useTranslation";

const NotesWidget = ({ id, settings, isActive, onSelect }) => {
  const { t } = useTranslation("builder");
  const notes =
    settings?.text || t("notes.noNotes", "No notes entered yet. Right-click to add notes.");

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Right-click on Notes widget ${id}, isActive: ${isActive}`);
    onSelect(id);
  };

  return (
    <div onContextMenu={handleRightClick}>
      <button className="absolute top-[-2.5rem] right-[-0.5rem] bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition duration-200 z-50 flex items-center justify-center">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
      <div className="p-4 h-full overflow-auto">
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{notes}</p>
      </div>
    </div>
  );
};

export default NotesWidget;
