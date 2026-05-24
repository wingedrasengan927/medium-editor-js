import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  SELECTION_CHANGE_COMMAND,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
} from "lexical";
import {
  $isHeadingNode,
  $createHeadingNode,
  $isQuoteNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType, $isAtNodeEnd } from "@lexical/selection";
import { $toggleLink, $isLinkNode } from "@lexical/link";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import { $isMathNode } from "../nodes/MathNode.js";
import {
  $isMathHighlightNodeInline,
  $isMathHighlightNodeBlock,
} from "../nodes/MathHighlightNode.js";

import { InlineToolbar } from "../components/InlineToolbar/InlineToolbar.js";

export const TOGGLE_HEADING_COMMAND = createCommand("TOGGLE_HEADING_COMMAND");
export const TOGGLE_QUOTE_COMMAND = createCommand("TOGGLE_QUOTE_COMMAND");
export const TOGGLE_LINK_COMMAND = createCommand("TOGGLE_LINK_COMMAND");

/* -------- selection helpers used by the toolbar to read button state -------- */

export function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = anchor.getNode();
  const focusNode = focus.getNode();
  if (anchorNode === focusNode) return anchorNode;
  const isBackward = selection.isBackward();
  if (isBackward) return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
}

function fetchTagIfHeadingNode(node) {
  const headingNode = $findMatchingParent(node, $isHeadingNode);
  return headingNode ? headingNode.getTag() : null;
}

export function updateToolbarHeadingState(selection) {
  const result = {
    isHeadingOne: false,
    isHeadingTwo: false,
    isHeadingThree: false,
  };

  const nodes = selection.getNodes();
  if (!nodes.length) return result;

  const headingTag = fetchTagIfHeadingNode(nodes[0]);
  if (!headingTag) return result;

  const allMatch = nodes.every(
    (node) => fetchTagIfHeadingNode(node) === headingTag
  );
  if (!allMatch) return result;

  const key = { h1: "isHeadingOne", h2: "isHeadingTwo", h3: "isHeadingThree" }[
    headingTag
  ];
  if (key) result[key] = true;
  return result;
}

export function updateToolbarQuoteState(selection) {
  const nodes = selection.getNodes();
  if (!nodes.length) return false;
  return nodes.every((node) => $findMatchingParent(node, $isQuoteNode));
}

export function getLinkAtSelection(selection) {
  if (!$isRangeSelection(selection)) return null;
  const node = getSelectedNode(selection);
  return $findMatchingParent(node, $isLinkNode);
}

/* -------- plugin registration -------- */

export function registerInlineToolbarPlugin(editor) {
  const toolbar = new InlineToolbar(editor);

  const unregister = mergeRegister(
    /* Heading toggle: cycles None → H2 → H3 → None, H1 → H3 */
    editor.registerCommand(
      TOGGLE_HEADING_COMMAND,
      (toolbarState) => {
        const { isHeadingOne, isHeadingTwo, isHeadingThree } = toolbarState;
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return true;

        let tag;
        if (isHeadingOne) tag = "h3";
        else if (isHeadingTwo) tag = "h3";
        else if (isHeadingThree) tag = null;
        else tag = "h2";

        $setBlocksType(selection, () =>
          tag ? $createHeadingNode(tag) : $createParagraphNode()
        );
        return true;
      },
      COMMAND_PRIORITY_HIGH
    ),

    /* Quote toggle */
    editor.registerCommand(
      TOGGLE_QUOTE_COMMAND,
      (toolbarState) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return true;
        $setBlocksType(selection, () =>
          toolbarState.isQuote ? $createParagraphNode() : $createQuoteNode()
        );
        return true;
      },
      COMMAND_PRIORITY_HIGH
    ),

    /* Link toggle */
    editor.registerCommand(
      TOGGLE_LINK_COMMAND,
      (linkURL) => {
        $toggleLink(linkURL);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    ),

    /* Ctrl/Cmd-click a link to open it */
    editor.registerCommand(
      CLICK_COMMAND,
      (payload) => {
        const selection = $getSelection();
        const linkNode = getLinkAtSelection(selection);
        if (linkNode && (payload.metaKey || payload.ctrlKey)) {
          window.open(linkNode.getURL(), "_blank");
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    ),

    /* Show/hide toolbar based on selection */
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        if (!editor.isEditable()) {
          toolbar.hide();
          return false;
        }
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection.isCollapsed()) {
          toolbar.hide();
          return false;
        }

        const nodes = selection.getNodes();
        // Don't show if any Math node is in the selection
        const hasMathNode = nodes.some((node) => $isMathNode(node));
        // Don't show if a single MathHighlight node is selected
        const isSingleMathHighlight =
          nodes.length === 1 &&
          ($isMathHighlightNodeInline(nodes[0]) ||
            $findMatchingParent(nodes[0], $isMathHighlightNodeBlock));

        if (hasMathNode || isSingleMathHighlight) {
          toolbar.hide();
          return false;
        }

        toolbar.show();
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),

    /* Hide when editor blurs unless focus moved into the toolbar itself */
    editor.registerCommand(
      BLUR_COMMAND,
      () => {
        setTimeout(() => {
          const tb = document.getElementById("inline-toolbar");
          const lt = document.getElementById("link-toolbar");
          const active = document.activeElement;
          const insideToolbar =
            (tb && (tb === active || tb.contains(active))) ||
            (lt && (lt === active || lt.contains(active)));
          if (!insideToolbar) toolbar.hide();
        }, 0);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),

    /* Hide when editor becomes non-editable */
    editor.registerEditableListener((editable) => {
      if (!editable) toolbar.hide();
    })
  );

  return () => {
    unregister();
    toolbar.destroy();
  };
}
