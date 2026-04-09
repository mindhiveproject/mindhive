// components/DataJournal/Wrappers/PyodideWrapper.js
import { useState, useEffect } from "react";
import { useDataJournal } from "../Context/DataJournalContext"; // Import Context hook
import { getSharedPyodide } from "../Helpers/PyodideUtils";
import {
  MessageHeader,
  Message,
} from "semantic-ui-react";

import JustOneSecondNotice from "../../../../DesignSystem/JustOneSecondNotice";

export default function PyodideWrapper({ children, user, projectId, studyId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setPyodide } = useDataJournal(); // Use Context to set pyodide globally

  useEffect(() => {
    async function loadAndInitializePyodide() {
      try {
        setIsLoading(true);
        const pyodideInstance = await getSharedPyodide();
        setPyodide(pyodideInstance); // Set in Context for global access
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        setError(
          "Error loading data analysis libraries. Please try refreshing the page."
        );
        setIsLoading(false);
      }
    }
    loadAndInitializePyodide();
  }, [setPyodide]);

  if (error) {
    return (
      <div className="pyodideErrorMessage">
        <Message negative>
          <MessageHeader>Error</MessageHeader>
          <p>{error}</p>
        </Message>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pyodideLoadingMessage">
        <JustOneSecondNotice variant="librariesLoading" />
      </div>
    );
  }

  // Render children (e.g., Journals) once loaded
  return <>{children}</>;
}
