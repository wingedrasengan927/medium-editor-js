import {
	defineExtension,
	createCommand,
	$getSelection,
	$isRangeSelection,
	$isParagraphNode,
	$getNodeByKey,
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
				(payload) => {
					const targetNodeKey = payload?.targetNodeKey;
					if (targetNodeKey) {
						const targetNode = $getNodeByKey(targetNodeKey);
						if (targetNode) {
							const codeBlockNode = $createCodeNode();
							targetNode.replace(codeBlockNode);
							codeBlockNode.select();
							return true;
						}
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
								node.getKey(),
							);
						}
					} else {
						toolbar.hide();
						toolbar.targetNodeKey = null;
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
