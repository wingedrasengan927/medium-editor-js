import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
} from "lexical";
import { $isCodeNode } from "@lexical/code-core";
import { $convertFromMarkdownString } from "@lexical/markdown";
import { MEDIUM_TRANSFORMERS } from "./markdownTransformers.js";

const getClipboardPlainText = (clipboardData) =>
  clipboardData.getData("text/plain") || clipboardData.getData("text") || "";

export function registerMarkdownPlugin(editor) {
  return editor.registerCommand(
    PASTE_COMMAND,
    (event) => {
      // Disabled markdown pasting
      return false;

      const clipboardData = event.clipboardData;
      if (!clipboardData) {
        return false;
      }

      const text = getClipboardPlainText(clipboardData);
      if (!text) {
        return false;
      }

      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }

      event.preventDefault();

      // Build the nodes inside a detached container so the conversion (which
      // clears its target root and moves the selection to its start) never
      // touches the live document. We then drop the converted blocks at the
      // original caret position.
      const savedSelection = selection.clone();
      const container = $createParagraphNode();
      $convertFromMarkdownString(text, MEDIUM_TRANSFORMERS, container, false);

      // Fenced code blocks are imported with their language but no theme;
      // default them to the editor's theme so Shiki highlights them.
      container.getChildren().forEach((child) => {
        if ($isCodeNode(child)) {
          child.setTheme("github-dark");
        }
      });

      const nodes = container.getChildren();

      $setSelection(savedSelection);
      const restoredSelection = $getSelection();
      if ($isRangeSelection(restoredSelection)) {
        restoredSelection.insertNodes(nodes);
      }

      return true;
    },
    COMMAND_PRIORITY_HIGH
  );
}
