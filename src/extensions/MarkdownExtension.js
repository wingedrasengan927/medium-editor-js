import { defineExtension } from "lexical";
import { registerMarkdownShortcuts, TRANSFORMERS } from "@lexical/markdown";
import { HR_TRANSFORMER } from "../transformers/HRTransformer";
import {
	MATH_INLINE_TRANSFORMER,
	MATH_BLOCK_SINGLE_LINE_TRANSFORMER,
	MATH_BLOCK_MULTILINE_TRANSFORMER,
	MATH_HIGHLIGHT_BLOCK_TRANSFORMER,
} from "../transformers/MathTransformer";
import { IMAGE_TRANSFORMER } from "../transformers/ImageTransformer";
import { $isMathHighlightNodeBlock } from "../nodes/MathHighlightNodeBlock.js";
import { $findMatchingParent } from "@lexical/utils";

// Wraps markdown transformers to disable them inside math highlight node blocks
function wrapTransformer(transformer) {
	const originalReplace = transformer.replace;
	if (typeof originalReplace !== "function") {
		return transformer;
	}

	return {
		...transformer,
		replace: (nodeOrParent, ...args) => {
			if ($findMatchingParent(nodeOrParent, $isMathHighlightNodeBlock) !== null) {
				return;
			}
			return originalReplace(nodeOrParent, ...args);
		},
	};
}

export const MarkdownExtension = defineExtension({
	name: "MarkdownExtension",
	register: (editor) => {
		const transformers = [
			HR_TRANSFORMER,
			MATH_INLINE_TRANSFORMER,
			MATH_BLOCK_SINGLE_LINE_TRANSFORMER,
			MATH_BLOCK_MULTILINE_TRANSFORMER,
			MATH_HIGHLIGHT_BLOCK_TRANSFORMER,
			IMAGE_TRANSFORMER,
			...TRANSFORMERS,
		];
		const wrappedTransformers = transformers.map(wrapTransformer);
		return registerMarkdownShortcuts(editor, wrappedTransformers);
	},
});
