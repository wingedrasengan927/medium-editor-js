import {
	defineExtension,
	mergeRegister,
	createCommand,
	COMMAND_PRIORITY_HIGH,
	COMMAND_PRIORITY_LOW,
	SELECTION_CHANGE_COMMAND,
	BLUR_COMMAND,
	PASTE_COMMAND,
	CLICK_COMMAND,
	$getPreviousSelection,
	$isRangeSelection,
	$createParagraphNode,
	$getSelection,
	$isNodeSelection,
	$setSelection,
	$getNearestNodeFromDOMNode,
	$nodesOfType,
	$getNodeByKey,
} from "lexical";
import {
	addClassNamesToElement,
	removeClassNamesFromElement,
} from "@lexical/utils";
import {
	$createImageNode,
	$isImageNode,
	ImageNode,
} from "../nodes/ImageNode.js";


export const INSERT_IMAGE_AT_TARGET_COMMAND = createCommand("INSERT_IMAGE_AT_TARGET_COMMAND");

function isImageFile(file) {
	return file && file.type && file.type.startsWith("image/");
}

// Helper function for INSERT_IMAGE_AT_TARGET_COMMAND
function $insertImageNode(payload) {
	const { src, targetNodeKey } = payload;
	const targetNode = $getNodeByKey(targetNodeKey);
	if (targetNode) {
		const imageNode = $createImageNode(src);
		targetNode.replace(imageNode);
		
		imageNode.select();
		return imageNode.getKey();
	}
	return null;
}

export const ImageExtension = defineExtension({
	name: "image-extension",
	nodes: () => [ImageNode],
	register: (editor) => {
		return mergeRegister(

			// Register INSERT_IMAGE_AT_TARGET_COMMAND
			editor.registerCommand(
				INSERT_IMAGE_AT_TARGET_COMMAND,
				(payload) => {
					if (payload && typeof payload.src === "string") {
						$insertImageNode(payload);
						editor.focus();
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_HIGH,
			),

			// Register SELECTION_CHANGE_COMMAND
			editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					const selection = $getSelection();
					const isNodeSelection = $isNodeSelection(selection);
					const theme = editor._config.theme;
					const selectedImgClassName = theme.imgSelected || "selected";

					const imageNodes = $nodesOfType(ImageNode);
					for (const node of imageNodes) {
						const element = editor.getElementByKey(node.getKey());
						if (element) {
							if (isNodeSelection && selection.has(node.getKey())) {
								addClassNamesToElement(element, selectedImgClassName);
							} else {
								removeClassNamesFromElement(element, selectedImgClassName);
							}
						}
					}
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),

			// Register BLUR_COMMAND
			editor.registerCommand(
				BLUR_COMMAND,
				() => {
					const selection = $getSelection();
					if (
						$isNodeSelection(selection) &&
						selection.getNodes().length === 1 &&
						$isImageNode(selection.getNodes()[0])
					) {
						$setSelection(null);
					}
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),

			// Register PASTE_COMMAND
			editor.registerCommand(
				PASTE_COMMAND,
				(event) => {
					const clipboardData = event.clipboardData;
					if (!clipboardData) return false;

					const imageFiles = Array.from(clipboardData.files).filter(
						isImageFile,
					);
					if (imageFiles.length !== 1) return false;

					const selection = $getSelection() || $getPreviousSelection();
					if (!$isRangeSelection(selection)) return false;

					event.preventDefault();

					const targetNodeKey = selection.anchor.getNode().getKey();
					const imageFile = imageFiles[0];
					const reader = new FileReader();
					reader.onload = (e) => {
						if (typeof e.target.result === "string") {
							editor.dispatchCommand(
								INSERT_IMAGE_AT_TARGET_COMMAND,
								{
									src: e.target.result,
									targetNodeKey,
								},
							);
						}
					};
					reader.readAsDataURL(imageFile);

					return true;
				},
				COMMAND_PRIORITY_HIGH,
			),

			// Register CLICK_COMMAND for selecting image nodes
			editor.registerCommand(
				CLICK_COMMAND,
				(event) => {
					if (!editor.isEditable()) {
						return false;
					}
					const target = event.target;
					if (target instanceof HTMLElement) {
						const node = $getNearestNodeFromDOMNode(target);
						if ($isImageNode(node)) {
							event.preventDefault();
							node.select();
							return true;
						}
					}
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	},
});
