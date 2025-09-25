import React, { useState, useEffect } from "react";
import useTranslation from "next-translate/useTranslation";

const SettingsPanel = ({ widget, onSettingsChange, onDelete, studies }) => {
  const { t } = useTranslation();
  const [localSettings, setLocalSettings] = useState(
    typeof widget?.settings === "string"
      ? JSON.parse(widget?.settings)
      : widget?.settings
  );

  const handleChange = (key, value) => {
    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);
    onSettingsChange(widget.id, updatedSettings);
  };

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-xl p-6 overflow-y-auto z-30 border-l border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-6">{t('builder:dataJournal.settingsPanel.widgetSettings')}</h3>

      <div className="mb-6">
        <label
          htmlFor="notes-text"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('builder:dataJournal.settingsPanel.notes')}
        </label>
        <textarea
          id="notes-text"
          value={localSettings.text || ""}
          onChange={(e) => handleChange("text", e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-y"
          placeholder={t('builder:dataJournal.settingsPanel.notesPlaceholder')}
        />
      </div>

      <button
        onClick={() => onDelete(widget.id)}
        className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200 text-sm font-medium"
      >
        {t('builder:dataJournal.settingsPanel.deleteWidget')}
      </button>
    </div>
  );
};

export default SettingsPanel;
