import {
	defineExtension,
	createCommand,
	$getSelection,
	$isRangeSelection,
	$createParagraphNode,
	COMMAND_PRIORITY_HIGH,
	COMMAND_PRIORITY_LOW,
	CLICK_COMMAND,
	BLUR_COMMAND,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
	RichTextExtension,
	$createHeadingNode,
	$createQuoteNode,
} from "@lexical/rich-text";
import { LinkExtension, $toggleLink, $isLinkNode } from "@lexical/link";
import { $setBlocksType, $isAtNodeEnd } from "@lexical/selection";
import { mergeRegister, $findMatchingParent } from "@lexical/utils";
import { $isCodeNode } from "@lexical/code-core";
import { $isMathNode } from "../nodes/MathNode.js";
import { getActiveMathHighlightNode } from "./MathExtension.js";
import { InlineToolbar } from "../components/InlineToolbar/InlineToolbar.js";

export const TOGGLE_HEADING_COMMAND = createCommand("TOGGLE_HEADING_COMMAND");
export const TOGGLE_QUOTE_COMMAND = createCommand("TOGGLE_QUOTE_COMMAND");
export const TOGGLE_LINK_COMMAND = createCommand("TOGGLE_LINK_COMMAND");

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

export function getLinkAtSelection(selection) {
	if (!$isRangeSelection(selection)) return null;
	const node = getSelectedNode(selection);
	return $findMatchingParent(node, $isLinkNode);
}

export const InlineToolbarExtension = defineExtension({
	name: "InlineToolbarExtension",
	dependencies: [RichTextExtension, LinkExtension],

	register(editor) {
		const toolbar = new InlineToolbar(editor);

		const unregister = mergeRegister(
			// Heading toggle: cycles None → H2 → H3 → None, H1 → H3
			editor.registerCommand(
				TOGGLE_HEADING_COMMAND,
				(toolbarState) => {
					const { isHeadingOne, isHeadingTwo, isHeadingThree } =
						toolbarState;
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return false;

					let tag;
					if (isHeadingOne) tag = "h3";
					else if (isHeadingTwo) tag = "h3";
					else if (isHeadingThree) tag = null;
					else tag = "h2";

					$setBlocksType(selection, () =>
						tag ? $createHeadingNode(tag) : $createParagraphNode(),
					);
					return true;
				},
				COMMAND_PRIORITY_HIGH,
			),

			// Quote toggle
			editor.registerCommand(
				TOGGLE_QUOTE_COMMAND,
				(toolbarState) => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return false;
					$setBlocksType(selection, () =>
						toolbarState.isQuote
							? $createParagraphNode()
							: $createQuoteNode(),
					);
					return true;
				},
				COMMAND_PRIORITY_HIGH,
			),

			// Link toggle
			editor.registerCommand(
				TOGGLE_LINK_COMMAND,
				(linkURL) => {
					$toggleLink(linkURL);
					return true;
				},
				COMMAND_PRIORITY_HIGH,
			),

			// Ctrl/Cmd-click a link to open it
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
				COMMAND_PRIORITY_LOW,
			),

			// Hide when editor blurs unless focus moved into the toolbar itself
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
				COMMAND_PRIORITY_HIGH,
			),

			// Show/hide toolbar based on selection
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					if (!editor.isEditable()) {
						toolbar.hide();
						return false;
					}

					// Don't hide the inline toolbar when link toolbar is in focus
					const activeElement = document.activeElement;
					const linkToolbarElement = toolbar.linkToolbar?.element;
					if (
						linkToolbarElement &&
						(linkToolbarElement === activeElement ||
							linkToolbarElement.contains(activeElement))
					) {
						return false;
					}

					const selection = $getSelection();
					if (!$isRangeSelection(selection) || selection.isCollapsed()) {
						toolbar.hide();
						return false;
					}

					const nodes = selection.getNodes();
					// Don't show if any Math node or Code node is in the selection
					const hasMathNode = nodes.some((node) => $isMathNode(node));
					const hasCodeNode = nodes.some(
						(node) =>
							$isCodeNode(node) ||
							$findMatchingParent(node, $isCodeNode),
					);
					// Don't show if a single MathHighlight node is selected
					const isSingleMathHighlight =
						nodes.length === 1 &&
						getActiveMathHighlightNode(selection);

					if (hasMathNode || hasCodeNode || isSingleMathHighlight) {
						toolbar.hide();
						return false;
					}

					toolbar.show();
					return false;
				},
				COMMAND_PRIORITY_HIGH,
			),
		);

		return () => {
			unregister();
			toolbar.destroy();
		};
	},
});
