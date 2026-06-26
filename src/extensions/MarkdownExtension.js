import { defineExtension } from "lexical";
import { registerMarkdownShortcuts, TRANSFORMERS } from "@lexical/markdown";
import { HR_TRANSFORMER } from "../transformers/HRTransformer";
import {
	MATH_INLINE_TRANSFORMER,
	MATH_BLOCK_SINGLE_LINE_TRANSFORMER,
	MATH_BLOCK_MULTILINE_TRANSFORMER,
	MATH_HIGHLIGHT_BLOCK_TRANSFORMER,
} from "../transformers/MathTransformer";

export const MarkdownExtension = defineExtension({
	name: "MarkdownExtension",
	register: (editor) =>
		registerMarkdownShortcuts(editor, [
			HR_TRANSFORMER,
			MATH_INLINE_TRANSFORMER,
			MATH_BLOCK_SINGLE_LINE_TRANSFORMER,
			MATH_BLOCK_MULTILINE_TRANSFORMER,
			MATH_HIGHLIGHT_BLOCK_TRANSFORMER,
			...TRANSFORMERS,
		]),
});
