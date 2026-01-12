// components/DataJournal/Wrappers/PyodideWrapper.js
import { useState, useEffect } from "react";
import { useDataJournal } from "../Context/DataJournalContext"; // Import Context hook
import { initializePyodide } from "../Helpers/PyodideUtils"; // Extracted helper
import {
  MessageHeader,
  MessageContent,
  Message,
  Icon,
} from "semantic-ui-react";

export default function PyodideWrapper({ children, user, projectId, studyId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setPyodide } = useDataJournal(); // Use Context to set pyodide globally

  useEffect(() => {
    async function loadAndInitializePyodide() {
      try {
        setIsLoading(true);
        const pyodideInstance = await initializePyodide();
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
        <Message icon>
          <Icon name="circle notched" loading />
          <MessageContent>
            <MessageHeader>Just one second</MessageHeader>
            The data analysis libraries are loading.
          </MessageContent>
        </Message>
      </div>
    );
  }

  // Render children (e.g., Journals) once loaded
  return <>{children}</>;
}
