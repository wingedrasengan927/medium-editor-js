import {
	defineExtension,
	createCommand,
	$getSelection,
	$getPreviousSelection,
	$isRangeSelection,
	$isParagraphNode,
	$setSelection,
	COMMAND_PRIORITY_HIGH,
	BLUR_COMMAND,
	SELECTION_CHANGE_COMMAND,
} from "lexical";
import { HorizontalRuleExtension } from "@lexical/extension";
import { CodeExtension, $createCodeNode } from "@lexical/code-core";
import { ImageExtension } from "./ImageExtension.js";
import { mergeRegister } from "@lexical/utils";
import { BlockToolbar } from "../components/BlockToolbar/BlockToolbar.js";
import { getSelectedNode } from "./InlineToolbarExtension.js";

// Safely retrieves the active selection or falls back to a cloned and restored previous selection.
export function $getMutableSelection() {
	let selection = $getSelection();
	if (selection === null) {
		const prevSelection = $getPreviousSelection();
		if (prevSelection !== null) {
			selection = prevSelection.clone();
			$setSelection(selection);
		}
	}
	return selection;
}

export const INSERT_CODE_BLOCK_COMMAND = createCommand(
	"INSERT_CODE_BLOCK_COMMAND",
);

export const BlockToolbarExtension = defineExtension({
	name: "BlockToolbarExtension",
	dependencies: [HorizontalRuleExtension, CodeExtension, ImageExtension],

	register(editor) {
		const toolbar = new BlockToolbar(editor);

		const unregister = mergeRegister(
			editor.registerCommand(
				INSERT_CODE_BLOCK_COMMAND,
				() => {
					const selection = $getMutableSelection();
					if ($isRangeSelection(selection)) {
						const codeBlockNode = $createCodeNode();
						selection.insertNodes([codeBlockNode]);
						codeBlockNode.select();
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
						toolbar.hide();
						return false;
					}

					const selection = $getSelection();
					if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
						toolbar.hide();
						return false;
					}

					const node = getSelectedNode(selection);
					if ($isParagraphNode(node) && node.getTextContent() === "") {
						const domElement = editor.getElementByKey(node.getKey());
						if (domElement) {
							const rect = domElement.getBoundingClientRect();
							toolbar.show(
								rect.left,
								rect.top + rect.height / 2 + window.scrollY,
							);
						}
					} else {
						toolbar.hide();
					}

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
	},
});
