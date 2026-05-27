import { registerHistory, createEmptyHistoryState } from "@lexical/history";

export function registerHistoryPlugin(editor, delay = 300) {
  const historyState = createEmptyHistoryState();
  return registerHistory(editor, historyState, delay);
}
