import { createContext, useContext } from "react";

// What the blocks on the canvas can ask the builder to do: open a side panel
// or preview, duplicate a block, save a comment. Provided by FlowEngine.
const CanvasActions = createContext({});

export const CanvasActionsProvider = CanvasActions.Provider;

export const useCanvasActions = () => useContext(CanvasActions);
