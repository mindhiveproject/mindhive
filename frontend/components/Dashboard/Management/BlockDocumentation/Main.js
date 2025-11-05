import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Icon } from "semantic-ui-react";

import StyledBlockDocumentation from "./StyledBlockDocumentation";
import { ALL_PUBLIC_TASKS } from "../../../Queries/Task";
import { UPDATE_TASK_I18N } from "../../../Mutations/Task";

// Get API configuration from environment variables
const API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY || "YOUR_API_KEY_HERE";
const DEFAULT_SPREADSHEET_ID =
  process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID ||
  "YOUR_SPREADSHEET_ID_HERE";

const DATA_RANGE = "A:Z"; // Fetch a wide range to ensure we capture all columns

// Helper function to decode common API errors from the response body
const getErrorDetails = async (response) => {
  try {
    const errorText = await response.text();
    if (!errorText) {
      return `HTTP Status ${response.status}: Failed to connect. Check URL or API permissions.`;
    }

    const errorJson = JSON.parse(errorText);
    const message =
      errorJson.error?.message ||
      errorJson.error_description ||
      `HTTP Status ${response.status} Error.`;

    if (message.includes("API key not valid")) {
      return "API Key Error: The provided key is invalid or unauthorized. Please check your key and API restrictions.";
    }
    if (message.includes("is not shared")) {
      return "Access Error: The spreadsheet is likely not shared publicly. Please set sharing to 'Anyone with the link can view'.";
    }
    if (message.includes("Not Found")) {
      return "Not Found Error: Check if the Spreadsheet ID or the Tab Name are correct.";
    }

    return `API Error (${response.status}): ${message}`;
  } catch (e) {
    return `API Error (${response.status}): Could not parse error details. Ensure the Sheets API is enabled and your key is valid.`;
  }
};

/**
 * Parses the raw header row (Row 4 in your sheet) to extract language codes and display names.
 * Example: "Key ☟ | Language ☞" | "(en) American"
 */
const parseLanguageHeaders = (headerRow) => {
  if (!headerRow || headerRow.length < 2) return [];

  const languages = [];
  // Start parsing from the second column (index 1), as index 0 is the 'Key' column
  for (let i = 1; i < headerRow.length; i++) {
    const cell = headerRow[i];
    if (!cell) continue;

    // Use a simple regex to extract (code) Name
    const match = cell.match(/\((.*?)\)\s*(.*)/);

    let code = `COL_${i}`; // Fallback code based on column index
    let name = cell;

    if (match) {
      code = match[1].trim(); // e.g., 'en', 'es-es'
      name = match[2].trim() || code; // e.g., 'American', 'Español SP'
    } else {
      // If no match, treat the entire cell content as the name
      name = cell.trim();
    }

    languages.push({
      // Store the original column index for easy fetching
      columnIndex: i,
      code,
      name,
    });
  }
  return languages;
};

/**
 * Utility function to set a nested value in an object using a dot-notation path (e.g., 'settings.addInfo').
 */
const setNestedValue = (obj, path, value) => {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === parts.length - 1) {
      // Final part of the path: set the value
      // We coerce the value to its appropriate type if it looks like a boolean or number
      let finalValue = value;
      if (typeof value === "string") {
        const lowerCaseValue = value.toLowerCase().trim();
        if (lowerCaseValue === "true") finalValue = true;
        else if (lowerCaseValue === "false") finalValue = false;
        else if (!isNaN(Number(value)) && value.trim() !== "")
          finalValue = Number(value);
      }
      current[part] = finalValue;
    } else {
      // Not the final part: ensure the path exists as an object
      if (!current[part] || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part];
    }
  }
};

/**
 * Converts the raw sheet data (Key and Translation columns) into the required nested JSON structure.
 * Handles special formatting for resources and aggregateVariables fields.
 * 
 * VERIFIED FORMAT FOR MUTATION:
 * - Returns: { [languageCode]: { ...translatedFields } }
 * - settings.resources: JSON STRING of array (e.g., "['link1', 'link2']")
 * - settings.aggregateVariables: JSON STRING of array of objects (e.g., "[{varName:'x',varDesc:'y'}]")
 * - descriptionForParticipants: HTML string (preserved as-is)
 * - All nested fields use dot notation in the sheet (e.g., settings.addInfo)
 * 
 * SPECIAL: aggregateVariables var fields fall back to en-us if empty in current language
 * 
 * This format matches the Task schema's i18nContent field structure.
 */
const generateTranslationJson = (dataRows, selectedLanguage, languages) => {
  if (!selectedLanguage || dataRows.length === 0) return null;

  const langCode = selectedLanguage.code;
  const translationObject = {};
  
  // Find en-us column index for fallback
  const enUsLanguage = languages?.find((lang) => lang.code === "en-us");
  const enUsColumnIndex = enUsLanguage?.columnIndex;
  
  // Temporary storage for multi-row fields
  const resourcesArray = [];
  const aggregateVariablesArray = [];
  
  dataRows.forEach((row) => {
    const key = String(row[0] || "").trim();
    const value = row[selectedLanguage.columnIndex];
    
    // Skip rows with no key
    if (!key) return;
    
    // For aggregateVariables.var fields, allow undefined values (we'll fall back to en-us)
    const isAggVarField = key.match(/^settings\.aggregateVariables\.var\d+$/);
    if (!isAggVarField && value === undefined) return;

    // Handle resources fields (resources1, resources2, etc.)
    if (key.match(/^settings\.resources\d+$/)) {
      if (value && value.trim()) {
        resourcesArray.push(value.trim());
      }
      return; // Don't add to main object yet
    }

    // Handle aggregateVariables fields
    const aggVarMatch = key.match(
      /^settings\.aggregateVariables\.(var|desc)(\d+)$/
    );
    if (aggVarMatch) {
      const [, type, index] = aggVarMatch;
      const idx = parseInt(index) - 1;

      if (!aggregateVariablesArray[idx]) {
        aggregateVariablesArray[idx] = { varName: "", varDesc: "" };
      }

      if (type === "var") {
        // Special case: for var fields, fall back to en-us if current language is empty
        // Convert value to string and trim whitespace
        let varValue = String(value || "").trim();
        
        // Check if value is truly empty (including "—" placeholder)
        const isEmpty = !varValue || varValue === "—" || varValue === "";
        
        if (isEmpty && enUsColumnIndex !== undefined && langCode !== "en-us") {
          // Current language is empty, try to get en-us value
          const enUsValue = String(row[enUsColumnIndex] || "").trim();
          
          // Only use en-us value if it's not empty or "—"
          if (enUsValue && enUsValue !== "—") {
            varValue = enUsValue;
            // Keep this log as it's useful for verifying fallback behavior
            console.log(
              `Fallback to en-us for aggregateVariables.var${index}: ${varValue}`
            );
          }
        }
        
        aggregateVariablesArray[idx].varName = varValue;
      } else {
        aggregateVariablesArray[idx].varDesc = value || "";
      }
      return; // Don't add to main object yet
    }

    // For all other fields, use the standard nested value setter
    setNestedValue(translationObject, key, value);
  });

  // Now construct the resources array as a JSON string
  if (resourcesArray.length > 0) {
    const resourcesJson = JSON.stringify(resourcesArray);
    setNestedValue(translationObject, "settings.resources", resourcesJson);
  }

  // Construct the aggregateVariables array as a JSON string
  if (aggregateVariablesArray.length > 0) {
    // Filter out any empty entries
    const validAggVars = aggregateVariablesArray.filter(
      (item) => item.varName || item.varDesc
    );
    if (validAggVars.length > 0) {
      const aggVarsJson = JSON.stringify(validAggVars);
      setNestedValue(
        translationObject,
        "settings.aggregateVariables",
        aggVarsJson
      );
    }
  }

  return {
    [langCode]: translationObject,
  };
};

export default function BlockDocumentation({ query, user }) {
  // Check if user is admin
  const isAdmin = user?.permissions?.map((p) => p?.name).includes("ADMIN");
  
  // If not admin, show access denied message
  if (!isAdmin) {
    return (
      <StyledBlockDocumentation>
        <div className="pageHeader">
          <div className="headerIcon">
            <img src="/assets/icons/visualize/database.svg" alt="Database" />
          </div>
          <h1>Block Documentation Manager</h1>
          <div className="description">Admin access required.</div>
        </div>
        <div className="errorBanner">
          <div className="title">Access Denied</div>
          <div className="message">
            You must have admin permissions to access this feature.
          </div>
        </div>
      </StyledBlockDocumentation>
    );
  }

  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_SPREADSHEET_ID);
  const [sheetTitles, setSheetTitles] = useState([]);
  const [sheetGids, setSheetGids] = useState({}); // Maps sheet title to gid
  const [tabName, setTabName] = useState(""); // Current selected sheet (task)

  // Data states
  const [rawData, setRawData] = useState([]); // All data rows, starting from row 5
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Language and UI states
  const [languages, setLanguages] = useState([]); // Parsed languages from Row 4
  const [selectedLanguageIndex, setSelectedLanguageIndex] = useState(null); // Column index of the selected language
  const [searchTerm, setSearchTerm] = useState(""); // Search state

  // JSON states
  const [parsedJson, setParsedJson] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [isMutating, setIsMutating] = useState(false); // State for the hypothetical mutation

  // Task matching states
  const [matchedTasks, setMatchedTasks] = useState([]); // Tasks that match the sheet title
  const [selectedTaskId, setSelectedTaskId] = useState(null); // Selected task ID for mutation

  // Fetch all public tasks (includes i18nContent)
  const { data: tasksData } = useQuery(ALL_PUBLIC_TASKS);
  const publicTasks = tasksData?.tasks || [];

  // Mutation to update task i18nContent
  const [updateTaskI18n] = useMutation(UPDATE_TASK_I18N, {
    // Refetch public tasks after mutation to get updated data
    refetchQueries: [{ query: ALL_PUBLIC_TASKS }],
  });

  // Helper to fetch just the list of sheet titles (metadata API)
  const fetchSheetTitles = async (id) => {
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${id}?key=${API_KEY}&fields=sheets.properties`;

    try {
      const response = await fetch(metadataUrl);
      if (!response.ok) {
        const detailedError = await getErrorDetails(response);
        throw new Error(detailedError);
      }
      const result = await response.json();
      
      if (!result.sheets) return { titles: [], gids: {} };
      
      // Build title array and gid mapping
      const gidMap = {};
      const allTitles = [];
      
      result.sheets.forEach((sheet) => {
        const title = sheet.properties.title;
        const gid = sheet.properties.sheetId;
        
        allTitles.push(title);
        gidMap[title] = gid;
      });
      
      // Exclude "Instruction" and "TEMPLATE" sheets
      const titles = allTitles.filter(
        (title) => title !== "Instruction" && title !== "TEMPLATE" && title !== "Tracker"
      );
      
      return { titles, gids: gidMap };
    } catch (err) {
      console.error("Failed to fetch sheet titles:", err);
      throw new Error(err.message);
    }
  };

  // Function to fetch and process data for the *selected* sheet
  const fetchData = async (id, tab) => {
    setLoading(true);
    setError(null);
    setRawData([]);
    setLanguages([]);
    setSelectedLanguageIndex(null);
    setSearchTerm("");
    setParsedJson(null); // Clear JSON on new fetch

    // Fetch the full sheet data (Range A:Z)
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${tab}!${DATA_RANGE}?key=${API_KEY}`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const detailedError = await getErrorDetails(response);
        throw new Error(detailedError);
      }

      const result = await response.json();
      const allValues = result.values || [];

      if (allValues.length >= 5) {
        // Row 4 (index 3) contains the languages
        const languageRow = allValues[3];
        const parsedLanguages = parseLanguageHeaders(languageRow);
        setLanguages(parsedLanguages);

        // Default to English ('en') if available, otherwise the first language found
        const defaultLanguage =
          parsedLanguages.find((lang) => lang.code === "en") ||
          parsedLanguages[0];
        if (defaultLanguage) {
          setSelectedLanguageIndex(defaultLanguage.columnIndex);
        }

        // Data starts from Row 5 (index 4)
        // We keep all columns in rawData for now, but only display the required ones
        const dataRows = allValues
          .slice(4)
          .filter((row) =>
            row.some((cell) => cell && cell.toString().trim() !== "")
          );
        setRawData(dataRows);
      } else {
        setError(
          `Sheet "${tab}" has too few rows. Expected at least 5 rows (including 4 header rows), but found ${allValues.length}.`
        );
      }
    } catch (err) {
      console.error(`Failed to fetch sheet ${tab}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize dashboard - fetch sheet titles
  const initializeDashboard = async (id) => {
    setError(null);
    setLoading(true);

    // Check for placeholders
    if (
      API_KEY.includes("YOUR_API_KEY_HERE") ||
      id.includes("YOUR_SPREADSHEET_ID_HERE")
    ) {
      setError(
        `Configuration Error: Please set up environment variables for API_KEY or SPREADSHEET_ID. See console for details.`
      );
      console.error(
        "Please create a .env.local file in the frontend directory with:\nNEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=your_key\nNEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID=your_id"
      );
      setLoading(false);
      return;
    }

    try {
      const { titles, gids } = await fetchSheetTitles(id);
      setSheetTitles(titles);
      setSheetGids(gids);

      if (titles.length > 0) {
        // Automatically select the first sheet
        setTabName(titles[0]);
      } else {
        setError(
          "Successfully accessed spreadsheet, but no tabs/sheets were found."
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Effect to run initialization on component mount or spreadsheetId change
  useEffect(() => {
    if (
      !API_KEY.includes("YOUR_API_KEY_HERE") &&
      !DEFAULT_SPREADSHEET_ID.includes("YOUR_SPREADSHEET_ID_HERE")
    ) {
      initializeDashboard(spreadsheetId);
    }
  }, [spreadsheetId]);

  // Effect to run data fetch when the active sheet (tabName) changes
  useEffect(() => {
    if (tabName && !API_KEY.includes("YOUR_API_KEY_HERE")) {
      fetchData(spreadsheetId, tabName);
    }
  }, [tabName, spreadsheetId]);

  // Find the currently selected language object
  const selectedLanguage = useMemo(() => {
    return languages.find((lang) => lang.columnIndex === selectedLanguageIndex);
  }, [languages, selectedLanguageIndex]);

  // Effect to match tasks when tab name changes
  useEffect(() => {
    if (tabName && publicTasks.length > 0) {
      // Find all public tasks with partial case-sensitive match
      // Sheet name should be contained in task title
      const matches = publicTasks.filter((task) =>
        task.title.includes(tabName)
      );
      setMatchedTasks(matches);
      
      // Auto-select if only one match
      if (matches.length === 1) {
        setSelectedTaskId(matches[0].id);
      } else {
        setSelectedTaskId(null);
      }
    } else {
      setMatchedTasks([]);
      setSelectedTaskId(null);
    }
  }, [tabName, publicTasks]);

  // Effect to generate JSON when source data or selected language changes
  useEffect(() => {
    if (rawData.length > 0 && selectedLanguage) {
      setJsonError(null);
      try {
        const json = generateTranslationJson(
          rawData,
          selectedLanguage,
          languages
        );
        setParsedJson(json);
      } catch (e) {
        console.error("Failed to generate JSON:", e);
        setJsonError(
          "Error generating JSON structure. Check key format and data types."
        );
        setParsedJson(null);
      }
    } else {
      setParsedJson(null);
    }
  }, [rawData, selectedLanguage, languages]);

  // The final visible data structure, filtered by search term
  const visibleData = useMemo(() => {
    const langColIndex = selectedLanguageIndex;
    if (langColIndex === null || rawData.length === 0) {
      return [];
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    return rawData
      .filter((row) => {
        // Check if any of the two visible cells (Key or Translation) contain the search term
        const keyCell = String(row[0] || "").toLowerCase();
        const translationCell = String(row[langColIndex] || "").toLowerCase();

        if (searchTerm) {
          return (
            keyCell.includes(lowerCaseSearchTerm) ||
            translationCell.includes(lowerCaseSearchTerm)
          );
        }

        // If no search term, return all rows
        return true;
      })
      .map((row) => ({
        key: row[0] || "—",
        translation: row[langColIndex] || "—",
      }));
  }, [rawData, searchTerm, selectedLanguageIndex]);

  const showPlaceholderWarning =
    API_KEY.includes("YOUR_API_KEY_HERE") ||
    DEFAULT_SPREADSHEET_ID.includes("YOUR_SPREADSHEET_ID_HERE");

  // Determine the selected language name for the header
  const selectedLanguageName = selectedLanguage?.name || "Translation";

  // Function to update the backend with proper i18nContent merging
  const handleUpdateBackend = async () => {
    if (!selectedTaskId) {
      alert("Please select a task to update.");
      return;
    }

    if (!selectedLanguage || !parsedJson) {
      alert("No translation data to update.");
      return;
    }

    setIsMutating(true);

    try {
      // Get the current task's i18nContent from the matched tasks
      // This data comes from ALL_PUBLIC_TASKS query (admin accessible)
      const currentTask = matchedTasks.find((t) => t.id === selectedTaskId);
      
      if (!currentTask) {
        throw new Error("Selected task not found in the matched tasks list.");
      }

      const currentI18nContent = currentTask.i18nContent || {};

      // Merge: keep all existing languages, update only the selected one
      const mergedI18nContent = {
        ...currentI18nContent,
        ...parsedJson, // This contains { [languageCode]: { ...translations } }
      };

      // Log key information for verification
      console.log("Updating task:", currentTask.title);
      console.log("Language:", selectedLanguage?.code);
      console.log("Preserving languages:", Object.keys(currentI18nContent).join(", "));

      // Execute the mutation
      const result = await updateTaskI18n({
        variables: {
          id: selectedTaskId,
          i18nContent: mergedI18nContent,
        },
      });

      console.log("✅ Mutation successful");

      alert(
        `✅ SUCCESS!\n\nUpdated task: "${currentTask.title}"\nLanguage: ${selectedLanguage?.code} (${selectedLanguage?.name})\n\nThe task documentation has been updated while preserving all other language translations.\n\nCheck the console for detailed information.`
      );

      // Data will auto-refresh via refetchQueries
    } catch (error) {
      console.error("❌ Mutation error:", error);
      alert(
        `❌ ERROR updating task\n\n${error.message}\n\nCheck the console for more details.`
      );
    } finally {
      setIsMutating(false);
    }
  };

  // Function to open Google Sheets in a new tab (specific sheet)
  const handleOpenGoogleSheet = () => {
    let sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    
    // If a tab is selected, use the actual gid for that sheet
    if (tabName && sheetGids[tabName] !== undefined) {
      const gid = sheetGids[tabName];
      sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${gid}`;
    }
    
    window.open(sheetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <StyledBlockDocumentation>
      <div className="pageHeader">
        <div className="headerIcon">
          <img src="/assets/icons/visualize/database.svg" alt="Database" />
        </div>
        <h1>Block Documentation Manager</h1>
      </div>
      <div className="description">
        Select a task (sheet) and a language to view the localized content and
        prepare the JSON export.
        <br />
        <small style={{ color: "#767676", marginTop: "8px", display: "block" }}>
          <strong>Supported language codes:</strong> en-us, es-es, es-la, zh-cn,
          fr-fr, ar-ae, hi-in, hi-ma, ru-ru, nl-nl, pt-br, Hebrew is NOT yet added to config.next etc
        </small>
      </div>

      {showPlaceholderWarning && (
        <div className="warningBanner">
          <Icon name="warning sign" className="icon" />
          <div className="content">
            <div className="title">Configuration Required</div>
            <div className="message">
              You must set up environment variables for <strong>API_KEY</strong>{" "}
              and <strong>SPREADSHEET_ID</strong>. Create a{" "}
              <code>.env.local</code> file in the frontend directory.
            </div>
          </div>
        </div>
      )}

      {/* 1. API Configuration Inputs & Sheet Selector */}
      <div className="configSection">
        <input
          type="text"
          placeholder="Spreadsheet ID"
          value={spreadsheetId}
          onChange={(e) => setSpreadsheetId(e.target.value)}
        />

        <select
          value={tabName}
          onChange={(e) => setTabName(e.target.value)}
          disabled={sheetTitles.length === 0 || loading}
        >
          <option value="" disabled>
            Select a Task (Sheet)
          </option>
          {sheetTitles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
          {sheetTitles.length === 0 && (
            <option value="" disabled>
              {loading ? "Finding Sheets..." : "No Sheets Found"}
            </option>
          )}
        </select>

        {/* Open Google Sheet Button */}
        {tabName && (
          <div className="configSection">
            <button
              onClick={handleOpenGoogleSheet}
              className="openSheetButton"
              style={{ gridColumn: "1 / -1" }}
            >
              Open {tabName}
            </button>
          </div>
        )}
        <button
          onClick={() => initializeDashboard(spreadsheetId)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Icon name="refresh" className="spinner" />
              Loading...
            </>
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      

      {/* Task Matching Section */}
      {tabName && (
        <div>
          {matchedTasks.length === 0 && (
            <div className="warningBanner">
              <Icon name="warning sign" className="icon" />
              <div className="content">
                <div className="title">No Matching Task Found</div>
                <div className="message">
                  No public task with title "{tabName}" was found in the
                  database. Please verify the sheet name matches a public task
                  title exactly.
                </div>
              </div>
            </div>
          )}

          {matchedTasks.length === 1 && (
            <div
              className="warningBanner"
              style={{ background: "#DEF8FB", borderColor: "#336F8A" }}
            >
              <Icon
                name="check circle"
                className="icon"
                style={{ color: "#336F8A" }}
              />
              <div className="content">
                <div className="title" style={{ color: "#274E5B" }}>
                  Task Matched Successfully
                </div>
                <div className="message" style={{ color: "#434343" }}>
                  Found task: <strong>{matchedTasks[0].title}</strong> (ID:{" "}
                  {matchedTasks[0].id}). The mutation will update this task's
                  i18n content.
                  {matchedTasks[0].i18nContent &&
                    Object.keys(matchedTasks[0].i18nContent).length > 0 && (
                      <>
                        <br />
                        <br />
                        <strong>Existing translations:</strong>{" "}
                        {Object.keys(matchedTasks[0].i18nContent).join(", ")}
                      </>
                    )}
                </div>
              </div>
            </div>
          )}

          {matchedTasks.length > 1 && (
            <div>
              <div className="warningBanner">
                <Icon name="info circle" className="icon" />
                <div className="content">
                  <div className="title">Multiple Tasks Found</div>
                  <div className="message">
                    Found {matchedTasks.length} public tasks with title "
                    {tabName}". Please select which task to update:
                  </div>
                </div>
              </div>
              <div className="configSection">
                <select
                  value={selectedTaskId || ""}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  style={{ gridColumn: "1 / -1" }}
                >
                  <option value="" disabled>
                    Select a task to update
                  </option>
                  {matchedTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} (ID: {task.id}) - Slug: {task.slug}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="errorBanner">
          <div className="title">Error</div>
          <div className="message">{error}</div>
        </div>
      )}

      {/* 2. Language Pills and Search */}
      {languages.length > 0 && (
        <div className="languageSection">
          <div className="languagePills">
            <span className="label">Select Language:</span>
            {languages.map((lang) => (
              <button
                key={lang.columnIndex}
                onClick={() => setSelectedLanguageIndex(lang.columnIndex)}
                className={
                  selectedLanguageIndex === lang.columnIndex ? "selected" : ""
                }
                disabled={loading}
              >
                {lang.name}{" "}
                ({lang.code})
              </button>
            ))}
          </div>

          <div className="searchBox">
            <input
              type="text"
              placeholder={`Search ${visibleData.length} Keys and Translations...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Icon name="search" className="searchIcon" />
          </div>
        </div>
      )}

      {/* 3. Results Table */}
      {visibleData.length > 0 && (
        <div className="resultsSection">
          <h2 className="sectionTitle">
            Translation Review ({selectedLanguageName})
          </h2>
          <div className="tableContainer">
            <div className="tableWrapper">
              <table>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>{selectedLanguageName}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleData.map((item, rowIndex) => (
                    <tr key={rowIndex}>
                      <td>{item.key}</td>
                      <td>{item.translation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visibleData.length === 0 && (
              <div className="emptyState">
                {searchTerm
                  ? `No results found for "${searchTerm}".`
                  : `No data rows found in the selected sheet.`}
              </div>
            )}

            {visibleData.length > 0 && (
              <div className="tableFooter">
                Displaying <strong>{visibleData.length}</strong> keys for{" "}
                <strong>{tabName}</strong> in{" "}
                <strong>{selectedLanguageName}</strong>.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. JSON Generation and Preview */}
      {selectedLanguage && (
        <div className="jsonSection">
          <div className="sectionHeader">
            <div className="headerIcon">
              <img src="/assets/icons/visualize/code.svg" alt="code" />
            </div>
            <h2>Generated JSON Payload</h2>
          </div>

          <div className="description">
            This JSON object is constructed from the <strong>Key</strong> column
            and the <strong>{selectedLanguageName}</strong> column. Review it
            before updating the backend.
          </div>

          {jsonError && <div className="jsonError">{jsonError}</div>}

          <textarea
            className="jsonTextarea"
            readOnly
            value={
              parsedJson
                ? JSON.stringify(parsedJson, null, 2)
                : "Loading or no data selected..."
            }
          />

          {/* 5. Action Buttons */}
          {parsedJson && (
            <div className="actionButtons">
              {selectedTaskId
                ? `Set to merge ${selectedLanguage?.code} content`
                : `Multiple or no task match with "${tabName}", please select a task first`}
              <button
                onClick={handleUpdateBackend}
                disabled={isMutating || jsonError || !selectedTaskId}
                className="sendButton"
                title={
                  !selectedTaskId
                    ? "Please select a task to update"
                    : jsonError
                    ? "Fix JSON errors before updating"
                    : "Execute the backend update mutation"
                }
              >
              {isMutating ? (
                <>
                  Updating Backend ...
                  <Icon name="refresh" className="spinner" />
                </>
              ) : (
                <>
                  {!selectedTaskId ? `Finish selection` : `Execute Mutation`}
                  {!selectedTaskId ? (
                    <Icon name="arrow up" />
                  ) : (
                    <Icon name="send" />
                  )}
                </>
              )}
            </button>
          </div>
          )}
        </div>
      )}

      {!loading && sheetTitles.length === 0 && !error && (
        <div className="noDataMessage">
          No sheet selected or available. Please enter a valid Spreadsheet ID
          and click 'Refresh Sheet List'.
        </div>
      )}
    </StyledBlockDocumentation>
  );
}

