import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import { loader } from "@monaco-editor/react";

/**
 * Self-host Monaco `vs` tree under `public/monaco-editor/vs` (see `scripts/copy-monaco-assets.cjs`
 * + `postinstall`). Default `@monaco-editor/loader` uses jsDelivr; this app's CSP only allows
 * style-src from 'self', fonts.googleapis.com, and cdnjs — so `editor.main.css` from jsDelivr
 * was blocked and the editor rendered without proper layout/token styling.
 */
const MONACO_VS_PATH = "/monaco-editor/vs";

if (typeof window !== "undefined") {
  loader.config({ paths: { vs: MONACO_VS_PATH } });
}

const DATA_JOURNAL_MONACO_THEME = "mindhiveDataJournal";

/**
 * Monaco loads only on the client (Next.js SSR/hydration).
 * Assets: `npm install` runs `copy-monaco-assets.cjs` → `public/monaco-editor/vs`.
 */
const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className="data-journal-monaco-loading"
      style={{
        width: "100%",
        minHeight: 320,
        boxSizing: "border-box",
        borderRadius: 5,
        background: "#fafbfc",
        border: "1px solid #eef2f6",
      }}
    />
  ),
});

const baseEditorOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  fontSize: 13,
  lineHeight: 21,
  tabSize: 4,
  insertSpaces: true,
  fontLigatures: false,
  fontFamily:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  padding: { top: 10, bottom: 10 },
  lineNumbers: "on",
  lineNumbersMinChars: 3,
  renderLineHighlight: "line",
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: "auto",
    horizontal: "auto",
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
    useShadows: false,
  },
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  bracketPairColorization: { enabled: false },
  glyphMargin: false,
  folding: true,
  foldingHighlight: false,
  occurrencesHighlight: false,
  selectionHighlight: true,
  renderWhitespace: "selection",
  roundedSelection: true,
  contextmenu: true,
  quickSuggestions: false,
  parameterHints: { enabled: true },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: "on",
  wordBasedSuggestions: "off",
};

function monacoInitLoadingPlaceholder(height) {
  const h = typeof height === "number" ? height : 320;
  return (
    <div
      className="data-journal-monaco-loading"
      style={{
        width: "100%",
        minHeight: h,
        boxSizing: "border-box",
        borderRadius: 5,
        background: "#fafbfc",
        border: "1px solid #eef2f6",
      }}
    />
  );
}

export default function MonacoPythonEditor({
  value,
  onChange,
  height = 320,
  className,
  readOnly = false,
}) {
  const beforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme(DATA_JOURNAL_MONACO_THEME, {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#FAFBFC",
        "editor.foreground": "#1e293b",
        "editorLineNumber.foreground": "#94a3b8",
        "editorLineNumber.activeForeground": "#64748b",
        "editorCursor.foreground": "#0d9488",
        "editor.selectionBackground": "#99f6e455",
        "editor.inactiveSelectionBackground": "#e2e8f0",
        "editor.lineHighlightBackground": "#f1f5f9",
        "editorLineHighlightBorder": "#00000000",
        "editorIndentGuide.background": "#e2e8f0",
        "editorIndentGuide.activeBackground": "#cbd5e1",
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.background": "#cbd5e166",
        "scrollbarSlider.hoverBackground": "#94a3b899",
        "scrollbarSlider.activeBackground": "#64748baa",
        focusBorder: "#69BBC4",
      },
    });
  }, []);

  const options = useMemo(() => ({ ...baseEditorOptions }), []);

  return (
    <div className="data-journal-monaco-root">
      <Editor
        className={className}
        height={height}
        width="100%"
        defaultLanguage="python"
        theme={DATA_JOURNAL_MONACO_THEME}
        value={value}
        onChange={onChange}
        options={options}
        readOnly={readOnly}
        beforeMount={beforeMount}
        loading={monacoInitLoadingPlaceholder(height)}
      />
    </div>
  );
}
