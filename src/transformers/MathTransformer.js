import { $createMathNode, $isMathNode, MathNode } from "../nodes/MathNode.js";
import {
	$isMathHighlightNodeInline,
	MathHighlightNodeInline,
} from "../nodes/MathHighlightNodeInline.js";
import {
	$isMathHighlightNodeBlock,
	MathHighlightNodeBlock,
	$createMathHighlightNodeBlock,
} from "../nodes/MathHighlightNodeBlock.js";

export const MATH_INLINE_TRANSFORMER = {
	dependencies: [MathNode, MathHighlightNodeInline],
	export: (node) => {
		if ($isMathNode(node) && node.isInline()) {
			return node.getEquation();
		}
		if ($isMathHighlightNodeInline(node)) {
			return node.getTextContent();
		}
		return null;
	},
	importRegExp: /(?<!\$)\$([^$]+?)\$(?!\$)/,
	regExp: new RegExp("(?<!\\$)\\$([^$\\s](?:[^$]*[^$\\s])?)\\$$"),
	replace: (textNode, match) => {
		const [, equation] = match;
		const mathNode = $createMathNode(`$${equation}$`, true);
		textNode.replace(mathNode);
	},
	trigger: "$",
	type: "text-match",
};

export const MATH_BLOCK_SINGLE_LINE_TRANSFORMER = {
	dependencies: [MathNode],
	export: (node) => {
		if ($isMathNode(node) && !node.isInline()) {
			return node.getEquation();
		}
		return null;
	},
	importRegExp: /(?<!\$)\$\$([^$]+?)\$\$(?!\$)/,
	regExp: new RegExp("(?<!\\$)\\$\\$([^$]+?)\\$\\$$"),
	replace: (textNode, match) => {
		const [, equation] = match;
		const mathNode = $createMathNode(`$$${equation}$$`, false);
		textNode.replace(mathNode);
	},
	trigger: "$",
	type: "text-match",
};

// Only used during imports
export const MATH_BLOCK_MULTILINE_TRANSFORMER = {
	dependencies: [MathNode],
	export: () => null,
	regExpEnd: {
		optional: false,
		regExp: /^\$\$/,
	},
	regExpStart: /^(\$\$)\s*$/,
	replace: (rootNode, children, startMatch, endMatch, linesInBetween, isImport) => {
		if (isImport && linesInBetween) {
			const equation = linesInBetween.join("\n").trim();
			const cleanEquation = equation.startsWith("$$") && equation.endsWith("$$")
				? equation
				: `$$${equation}$$`;
			const mathNode = $createMathNode(cleanEquation, false);
			rootNode.append(mathNode);
			return true;
		}
		return false;
	},
	type: "multiline-element",
};

export const MATH_HIGHLIGHT_BLOCK_TRANSFORMER = {
	dependencies: [MathHighlightNodeBlock],
	export: () => null,
	regExp: /^([ \t]*\$\$)/,
	replace: (parentNode) => {
		const mathHighlightNode = $createMathHighlightNodeBlock("");
		parentNode.replace(mathHighlightNode);
		mathHighlightNode.select(0, 0);
	},
	triggerOnEnter: true,
	type: "element",
};
