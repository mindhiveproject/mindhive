"use client";

import { createContext, useContext } from "react";

/**
 * Everything the builder's panels share.
 *
 * Deliberately *not* where live sample data goes. Once data sources land, the
 * per-sample values must stay outside React entirely — writing 256 Hz of EEG
 * into a context is what makes YQ re-render its whole tree per sample. Only the
 * things a panel renders from belong here.
 *
 * @typedef {object} VisualBuilderValue
 * @property {object} visual - The saved Visual record.
 * @property {boolean} canEdit - Author or collaborator; Viewers get a read-only shell.
 * @property {?{id: string, username: string}} user - Who is signed in, for collaborative carets.
 * @property {Array} files - Code files, entry and parameters.
 * @property {(fileId: string, content: string) => void} updateFile
 * @property {(name: string) => Promise<object>} addFile - Creates a module file.
 * @property {(fileId: string) => void} removeFile
 * @property {Record<string, object>} declared - The running sketch's declaration, normalized to the panel's kinds.
 * @property {boolean} hasDeclaration - False until the sketch has announced itself.
 * @property {string[]} [declarationWarnings] - What normalizing the declaration had to correct; builder only, a participant has no code to fix.
 * @property {object} bindings - Per-parameter binding + authoring overrides.
 * @property {(key: string, patch: object) => void} updateBinding
 * @property {?(next: boolean) => void} setDocsVisible - Builder only; absent in the Viewer.
 * @property {import("../Runtime/parameterBus").default} bus - Current parameter values, held outside React; read one with `bus.subscribe` / `bus.get`.
 * @property {Array} dataSources - Linked VisualDataSource rows, block included.
 * @property {Record<string, object>} sourceApis - Live `useSourceRuntime` API per linked source id: status, connect/disconnect, `streaming`.
 * @property {?(blockId: string) => Promise<void>} linkSource - Builder only.
 * @property {?(source: object) => Promise<void>} unlinkSource - Builder only; also clears mappings onto it.
 * @property {?(sourceId: string) => void} openSourceSettings - Builder only; opens the source's settings in the detail slot.
 * @property {?() => void} showDataSources - Builder only; switches to the Data Source tab.
 * @property {?string} detailSourceId - Which source's settings the detail panel shows.
 * @property {(panel: object) => void} openPanel - Pushes a panel to the right of the work area.
 * @property {(id: string) => void} closePanel
 * @property {Array<{kind, message, stack, line}>} logs - Output from the running sketch.
 * @property {() => void} clearLogs
 */
export const VisualBuilderContext = createContext(null);

export function useVisualBuilder() {
  const value = useContext(VisualBuilderContext);
  if (!value) {
    throw new Error("useVisualBuilder must be used inside the visual builder");
  }
  return value;
}
