// components/DataJournal/Widgets/WidgetSizeContext.js
import { createContext, useContext } from "react";

/**
 * Per-widget container dimensions + monotonic version for effects that need to
 * re-run when layout stabilizes (resize-stop) even if width/height are unchanged.
 */
const WidgetSizeContext = createContext(null);

export function WidgetSizeProvider({ value, children }) {
  return (
    <WidgetSizeContext.Provider value={value}>
      {children}
    </WidgetSizeContext.Provider>
  );
}

export function useWidgetSize() {
  const ctx = useContext(WidgetSizeContext);
  if (!ctx) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "useWidgetSize must be used within a WidgetSizeProvider (inside Widget.js).",
      );
    }
    return { width: 0, height: 0, version: 0 };
  }
  return ctx;
}

export default WidgetSizeContext;
