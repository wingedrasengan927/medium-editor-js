import {
  $createCodeNode,
  $isCodeNode,
  CodeNode,
  CodeHighlightNode
} from "@lexical/code-core";
import { registerCodeHighlighting } from "@lexical/code-shiki";
import {
  $getPreviousSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  createCommand,
  $getSelection,
  SELECTION_CHANGE_COMMAND,
  BLUR_COMMAND,
  $getNodeByKey,
  KEY_BACKSPACE_COMMAND,
  TextNode,
  $isLineBreakNode,
  $isParagraphNode,
} from "lexical";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { CodeMenu } from "../components/CodeMenu/CodeMenu.js";

export const INSERT_CODE_BLOCK_COMMAND = createCommand("INSERT_CODE_BLOCK_COMMAND");
export const SET_CODE_LANGUAGE_COMMAND = createCommand("SET_CODE_LANGUAGE_COMMAND");
export const SET_CODE_THEME_COMMAND = createCommand("SET_CODE_THEME_COMMAND");

export function registerCodePlugin(editor) {
  if (!editor.hasNodes([CodeNode, CodeHighlightNode])) {
    throw new Error("CodePlugin: CodeNode or CodeHighlightNode not registered on editor");
  }

  const codeMenu = new CodeMenu(editor);

  const isFocusInCodeMenu = () => {
    const active = document.activeElement;
    return !!(
      codeMenu.element &&
      active &&
      (codeMenu.element === active || codeMenu.element.contains(active))
    );
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!isFocusInCodeMenu()) {
        codeMenu.hide();
      }
    }, 10);
  };

  // Register Shiki
  const unregisterHighlighting = registerCodeHighlighting(editor);

  const unregisterTransforms = mergeRegister(
    editor.registerNodeTransform(TextNode, (node) => {
      if (!node.isSimpleText()) return;
      const text = node.getTextContent();
      if (text.startsWith("\`\`\` ")) {
        const prevSibling = node.getPreviousSibling();
        const parentNode = $findMatchingParent(node, $isParagraphNode);
        const isStartOfParagraph = parentNode !== null && parentNode.getChildrenSize() === 1;
        const isAfterLineBreak = $isLineBreakNode(prevSibling);

        if (isStartOfParagraph || isAfterLineBreak) {
          if (text.length > 4) return;
          const codeNode = $createCodeNode();
          codeNode.setTheme("github-dark");
          node.replace(codeNode);
          codeNode.select();
          const nextSibling = codeNode.getNextSibling();
          if ($isLineBreakNode(nextSibling)) {
            nextSibling.remove();
          }
        }
      }
    }),
    editor.registerCommand(
      INSERT_CODE_BLOCK_COMMAND,
      () => {
        const prevSelection = $getPreviousSelection();
        if ($isRangeSelection(prevSelection)) {
          const codeBlockNode = $createCodeNode();
          codeBlockNode.setTheme("github-dark");
          prevSelection.insertNodes([codeBlockNode]);
          codeBlockNode.selectStart();
          setTimeout(() => editor.focus(), 0);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(
      SET_CODE_LANGUAGE_COMMAND,
      (payload) => {
        const [nodeKey, language] = payload;
        const codeNode = $getNodeByKey(nodeKey);
        if ($isCodeNode(codeNode)) {
          // Set selection to element type to bypass Shiki's buggy text offset retention
          codeNode.selectStart();
          codeNode.setLanguage(language);
          setTimeout(() => editor.focus(), 10);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(
      SET_CODE_THEME_COMMAND,
      (payload) => {
        const [nodeKey, theme] = payload;
        const codeNode = $getNodeByKey(nodeKey);
        if ($isCodeNode(codeNode)) {
          // Set selection to element type to bypass Shiki's buggy text offset retention
          codeNode.selectStart();
          codeNode.setTheme(theme);
          setTimeout(() => editor.focus(), 10);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
        const node = selection.anchor.getNode();
        const codeNode = $findMatchingParent(node, $isCodeNode);

        if (codeNode && selection.anchor.offset === 0) {
          const textContent = codeNode.getTextContent();
          if (textContent === "") {
            codeNode.remove();
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        if (!editor.isEditable()) {
          codeMenu.hide();
          return false;
        }
        
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          if (!isFocusInCodeMenu()) codeMenu.hide();
          return false;
        }

        const node = selection.anchor.getNode();
        const codeNode = $findMatchingParent(node, $isCodeNode);
        
        if (codeNode) {
          const domElement = editor.getElementByKey(codeNode.getKey());
          if (domElement) {
            const rect = domElement.getBoundingClientRect();
            // Pass the top-right corner coordinates; CodeMenu will handle the offsets
            codeMenu.show(rect.right, Math.max(0, rect.top + window.scrollY), codeNode.getKey());
          }
        } else {
          if (!isFocusInCodeMenu()) codeMenu.hide();
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),
    editor.registerCommand(
      BLUR_COMMAND,
      () => {
        handleBlur();
        return false;
      },
      COMMAND_PRIORITY_HIGH
    )
  );

  return () => {
    unregisterHighlighting();
    unregisterTransforms();
    codeMenu.destroy();
  };
}
