import { KEY_TAB_COMMAND, COMMAND_PRIORITY_CRITICAL } from "lexical";

export function registerTabInterceptorPlugin(editor) {
  // KEY_TAB_COMMAND is only dispatched while the editor is focused, so this
  // never blocks Tab when focus is elsewhere on the page. Runs at CRITICAL
  // priority and returns false so lower-priority Tab handlers (e.g. list
  // indentation) still run after the browser default is prevented.
  return editor.registerCommand(
    KEY_TAB_COMMAND,
    (event) => {
      event.preventDefault();
      return false;
    },
    COMMAND_PRIORITY_CRITICAL
  );
}
