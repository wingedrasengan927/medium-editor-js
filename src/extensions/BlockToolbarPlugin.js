import {
	$getSelection,
	$isRangeSelection,
	$isParagraphNode,
	$getPreviousSelection,
	$createParagraphNode,
	SELECTION_CHANGE_COMMAND,
	BLUR_COMMAND,
	COMMAND_PRIORITY_HIGH,
	createCommand,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { BlockToolbar } from "../components/BlockToolbar/BlockToolbar.js";
import { getSelectedNode } from "./InlineToolbarExtension.js";
import {
	HorizontalDividerNode,
	$createHorizontalDividerNode,
} from "../nodes/HorizontalDividerNode.js";

export const INSERT_HORIZONTAL_DIVIDER_COMMAND = createCommand(
	"INSERT_HORIZONTAL_DIVIDER_COMMAND",
);

export function registerBlockToolbarPlugin(
	editor,
	{ gap = 8, disableImage = false } = {},
) {
	if (!editor.hasNodes([HorizontalDividerNode])) {
		throw new Error("HorizontalDividerNode not registered on editor");
	}

	const toolbar = new BlockToolbar(editor, gap, disableImage);
	let selectionCoords = null;

	function updateVisibility() {
		if (selectionCoords) {
			toolbar.show(selectionCoords.x, selectionCoords.y);
		} else {
			toolbar.hide();
		}
	}

	const unregister = mergeRegister(
		editor.registerCommand(
			INSERT_HORIZONTAL_DIVIDER_COMMAND,
			() => {
				const prevSelection = $getPreviousSelection();
				if ($isRangeSelection(prevSelection)) {
					const dividerNode = $createHorizontalDividerNode();
					prevSelection.insertNodes([dividerNode]);

					let nextNode =
						dividerNode.getNextSibling() ||
						dividerNode.getParent()?.getNextSibling();
					if (!nextNode) {
						nextNode = $createParagraphNode();
						dividerNode.insertAfter(nextNode);
					}
					nextNode.selectStart();

					setTimeout(() => editor.focus(), 0);
					return true;
				}
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		),

		editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				if (!editor.isEditable()) {
					selectionCoords = null;
					updateVisibility();
					return false;
				}

				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					selectionCoords = null;
					updateVisibility();
					return false;
				}

				const node = getSelectedNode(selection);
				if ($isParagraphNode(node) && node.getTextContent() === "") {
					const domElement = editor.getElementByKey(node.getKey());
					const rect = domElement.getBoundingClientRect();
					selectionCoords = {
						x: rect.left,
						y: rect.top + rect.height / 2 + window.scrollY,
					};
				} else {
					selectionCoords = null;
				}

				updateVisibility();
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		),

		editor.registerCommand(
			BLUR_COMMAND,
			() => {
				setTimeout(() => {
					const active = document.activeElement;
					const inToolbar =
						toolbar.triggerElement.contains(active) ||
						toolbar.triggerElement === active ||
						(toolbar.popoverElement &&
							(toolbar.popoverElement.contains(active) ||
								toolbar.popoverElement === active));

					if (!inToolbar) {
						selectionCoords = null;
						toolbar.hide();
					}
				}, 10);
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		),
	);

	return () => {
		unregister();
		toolbar.destroy();
	};
}
