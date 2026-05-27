import { $insertList, $isListItemNode, $handleListInsertParagraph } from "@lexical/list";
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $createLineBreakNode,
  COMMAND_PRIORITY_HIGH,
  KEY_TAB_COMMAND,
  KEY_ENTER_COMMAND,
  TextNode,
  ParagraphNode,
} from "lexical";
import { mergeRegister, $findMatchingParent } from "@lexical/utils";
import { getSelectedNode } from "./InlineToolbarPlugin.js";

const MAX_INDENT_LEVEL = 3;

export function registerListPlugin(editor) {
  return mergeRegister(
    // Transform: Remove paragraph nodes inside list item nodes,
    // replacing them with a line break node.
    editor.registerNodeTransform(ParagraphNode, (paragraphNode) => {
      const parent = paragraphNode.getParent();

      if ($isListItemNode(parent)) {
        const lineBreakNode = $createLineBreakNode();
        paragraphNode.replace(lineBreakNode);
        lineBreakNode.selectEnd();
      }
    }),

    // If a text node begins with '1. ' or '- ', convert it into a list
    editor.registerNodeTransform(TextNode, (node) => {
      const parentNode = $findMatchingParent(node, $isParagraphNode);
      if (!parentNode) {
        return;
      }

      if (parentNode.getFirstDescendant() !== node) {
        return;
      }

      const selection = $getSelection();
      if ($isRangeSelection(selection) && selection.isCollapsed()) {
        const offset = selection.anchor.offset;

        if (node.getTextContent() === "1. " && offset === 3) {
          $insertList("number");
          node.setTextContent("");
        } else if (node.getTextContent() === "- " && offset === 2) {
          $insertList("bullet");
          node.setTextContent("");
        }
      }
    }),

    // Handle ENTER to outdent or exit empty list items
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const node = getSelectedNode(selection);
        const listItemNode = $findMatchingParent(node, $isListItemNode);
        if (!listItemNode) {
          return false;
        }

        if (listItemNode.getTextContent() === "") {
          if (event && event.preventDefault) {
            event.preventDefault();
          }
          const indent = listItemNode.getIndent();
          if (indent > 0) {
            listItemNode.setIndent(indent - 1);
            return true;
          } else {
            return $handleListInsertParagraph();
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),

    // Handle TAB to indent/outdent list items
    editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const node = getSelectedNode(selection);
        const listItemNode = $findMatchingParent(node, $isListItemNode);
        if (!listItemNode) {
          return false;
        }

        const indent = listItemNode.getIndent();
        if (event.shiftKey) {
          if (indent <= 0) {
            return false;
          }
          listItemNode.setIndent(indent - 1);
        } else {
          if (indent > MAX_INDENT_LEVEL) {
            return false;
          }
          listItemNode.setIndent(indent + 1);
        }

        return true;
      },
      COMMAND_PRIORITY_HIGH
    )
  );
}
