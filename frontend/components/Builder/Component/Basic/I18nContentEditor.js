import { useState } from 'react';
import useTranslation from "next-translate/useTranslation";
import { StyledBuilder } from "../../../styles/StyledBuilder";

// Language configuration with display names
const SUPPORTED_LANGUAGES = {
  'en-us': 'English (US)',
  'es-es': 'Español (ES)',
  'zh-cn': '中文 (CN)',
  'fr-fr': 'Français (FR)',
  'ar-ae': 'العربية (AE)',
  'hi-in': 'हिन्दी (IN)',
  'hi-ma': 'हिन्दी (MA)',
  'ru-ru': 'Русский (RU)',
  'nl-nl': 'Nederlands (NL)',
  'pt-br': 'Português (BR)',
};

// Fields that should be treated as JSON
const JSON_FIELDS = ['settings', 'parameters'];

// Helper function to safely parse JSON
const safeJsonParse = (value) => {
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

// Helper function to safely stringify JSON
const safeJsonStringify = (value) => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
};

export default function I18nContentEditor({ task, handleChange }) {
  const { t } = useTranslation("builder");
  const [activeLanguage, setActiveLanguage] = useState('en-us');

  console.log("\n\n\n\n\nLet's see if we have it")
  console.log(task?.i18nContent)
  // Initialize i18nContent if it doesn't exist
  if (!task?.i18nContent) {
    task.i18nContent = {};
  }

  // Ensure all languages exist in i18nContent
  Object.keys(SUPPORTED_LANGUAGES).forEach(lang => {
    if (!task.i18nContent[lang]) {
      task.i18nContent[lang] = {
        title: '',
        description: '',
        descriptionForParticipants: '',
        settings: null,
        parameters: null,
      };
    }
  });

  // Handle changes to i18n content
  const handleI18nChange = (language, field, value) => {
    const updatedI18nContent = {
      ...task.i18nContent,
      [language]: {
        ...task.i18nContent[language],
        [field]: value,
      }
    };

    // Create a synthetic event to match the expected handleChange format
    const syntheticEvent = {
      target: {
        name: 'i18nContent',
        value: updatedI18nContent,
      }
    };

    handleChange(syntheticEvent);
  };

  // Handle changes to JSON fields within i18n content
  const handleI18nJsonChange = (language, field, jsonKey, value) => {
    const currentJson = task.i18nContent[language][field] || {};
    const updatedJson = {
      ...currentJson,
      [jsonKey]: value,
    };

    handleI18nChange(language, field, updatedJson);
  };

  // Get the available fields for editing (from en-us as template)
  const getEditableFields = () => {
    const enUsContent = task.i18nContent['en-us'] || {};
    return Object.keys(enUsContent).filter(field => field !== 'parameters'); // Skip parameters for now
  };

  return (
    <div
      className="i18n-editor"
      style={{
        // border: '0.5px solid #ffffff',
        borderRadius: '16px',
        background: '#F6F9F8',
        boxShadow: '2px 2px 8px 0 rgba(0, 0, 0, 0.10)',
        marginBottom: '2rem',
        padding: '4rem',
        maxWidth: '100%',

      }}
    >
      <h3>{t("createBlock.internationalContent") || "International Content"}</h3>
      <p>{t("createBlock.intro")}</p>
      <h2>{t("createBlock.howTo")}</h2>
      <ol>
        <li><p>{t("createBlock.howTo1")}</p></li>
        <li><p>{t("createBlock.howTo2")}</p></li>
      </ol>
      <p>{t("createBlock.notes")}</p>
      <ul>
        <li><p>{t("createBlock.notes1")}</p></li>
        <li><p>{t("createBlock.notes2")}</p></li>
      </ul>
      
      {/* Language Tabs */}
      <div className="language-tabs" style={{
        marginTop: '3rem',
        marginBottom: '1rem',
        display: 'flex',
        flexWrap: 'wrap',        
        gap: '10px',
        maxWidth: '100%',        
        boxSizing: 'border-box' 
    }}>
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <button
            key={code}
            type="button"
            onClick={() => setActiveLanguage(code)}
            style={{
              padding: '1rem 2rem',
              border: '0.5px solid #D3E0E3',
              background: activeLanguage === code ? '#0D3944' : 'white',
              color: activeLanguage === code ? 'white' : '#333',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '1.1rem'
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Content Editor for Active Language */}
      <div className="language-content">
        <p>{t("createBlock.currentlySelected")}{SUPPORTED_LANGUAGES[activeLanguage]}</p>
        
        {getEditableFields().map((field) => {
          const fieldValue = task.i18nContent[activeLanguage][field];
          console.log(task)
          
          if (JSON_FIELDS.includes(field)) {
            // Handle JSON fields (like settings)
            const jsonData = fieldValue || {};
            return (
              <div key={field} className="block" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                  {field}
                </h2>
                {Object.entries(jsonData).map(([jsonKey, jsonValue]) => (
                  <div key={jsonKey} className="json-field" style={{ 
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    width: '100%'}}>
                    <label style={{ width: '100%'}} htmlFor={`${activeLanguage}-${field}-${jsonKey}`}>
                      {jsonKey}:
                      {typeof jsonValue === 'boolean' ? (
                        <input
                          type="checkbox"
                          id={`${activeLanguage}-${field}-${jsonKey}`}
                          checked={jsonValue}
                          onChange={(e) => 
                            handleI18nJsonChange(activeLanguage, field, jsonKey, e.target.checked)
                          }
                        />
                      ) : (
                        <textarea
                          id={`${activeLanguage}-${field}-${jsonKey}`}
                          value={jsonValue || ''}
                          onChange={(e) => 
                            handleI18nJsonChange(activeLanguage, field, jsonKey, e.target.value)
                          }
                          rows={jsonValue && jsonValue.length > 50 ? 3 : 1}
                          style={{ width: '100%', minHeight: '2rem' }}
                        />
                      )}
                    </label>
                  </div>
                ))}
              </div>
            );
          } else {
            // Handle string fields
            return (
              <div key={field} className="block">
                <label htmlFor={`${activeLanguage}-${field}`}>
                  {field === 'title' ? t("title") : 
                   field === 'description' ? t("descriptionDevelop") :
                   field === 'descriptionForParticipants' ? t("descriptionDiscover") :
                   field}:
                  {field === 'title' ? (
                    <input
                      type="text"
                      id={`${activeLanguage}-${field}`}
                      value={fieldValue || ''}
                      onChange={(e) => handleI18nChange(activeLanguage, field, e.target.value)}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <textarea
                      id={`${activeLanguage}-${field}`}
                      value={fieldValue || ''}
                      onChange={(e) => handleI18nChange(activeLanguage, field, e.target.value)}
                      rows={3}
                      style={{ width: '100%' }}
                    />
                  )}
                </label>
              </div>
            );
          }
        })}
      </div>
      
      {/* Helper text */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '2rem', 
        background: '', 
        borderRadius: '4px',
        fontSize: '1.2rem',
        color: ''
      }}>
        <strong>Note:</strong> English (US) content is automatically populated from the main fields. 
        Use this editor to provide translations for other languages.
      </div>
    </div>
  );
}