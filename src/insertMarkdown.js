import {
	$createParagraphNode,
	$getPreviousSelection,
	$getRoot,
	$getSelection,
	$insertNodes,
	$setSelection,
} from "lexical";
import { $convertFromMarkdownString } from "@lexical/markdown";

export function $insertMarkdown(markdown, transformers) {
	if (!markdown) return;

	// get current selection, falling back to the previous editor selection
	const selection = $getSelection() ?? $getPreviousSelection();

	// clone the selection if one is available
	const insertionSelection = selection?.clone();

	// Prevent the importer from moving the saved selection into the container.
	$setSelection(null);

	// parse markdown content into an isolated paragraph container
	const container = $createParagraphNode();
	$convertFromMarkdownString(
		markdown.replace(/\r\n?/g, "\n"),
		transformers,
		container,
	);
	$setSelection(insertionSelection ?? null);
	if (!$getSelection()) $getRoot().selectEnd();

	// insert parsed nodes at the current selection
	$insertNodes(container.getChildren());
}
