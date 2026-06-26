import { TextNode, $applyNodeReplacement, $create } from "lexical";
import { addClassNamesToElement } from "@lexical/utils";
import { $createMathNode } from "./MathNode.js";

export class MathHighlightNodeInline extends TextNode {
	$config() {
		return this.config("math-highlight-inline", {
			extends: TextNode,
		});
	}

	createDOM(config) {
		const element = super.createDOM(config);
		addClassNamesToElement(element, config.theme.math.highlightInline);
		return element;
	}

	// Since the Highlight node is transient, it exports itself as a MathNode.
	// Hence, import functions are not needed here as they are handled by the MathNode.

	exportJSON() {
		return {
			type: "math",
			version: 1,
			equation: this.getTextContent(),
			inline: true,
		};
	}

	exportDOM(editor) {
		const element = document.createElement("span");
		addClassNamesToElement(
			element,
			editor._config.theme.math.renderedInline,
		);
		element.textContent = this.getTextContent();
		element.setAttribute("data-lexical-math", "true");
		element.setAttribute("data-math-inline", "true");
		return { element };
	}
}

export function $createMathHighlightNodeInline(equation) {
	const mathHighlightNode = $create(MathHighlightNodeInline).setTextContent(
		equation,
	);
	return $applyNodeReplacement(mathHighlightNode);
}

export function $isMathHighlightNodeInline(node) {
	return node instanceof MathHighlightNodeInline;
}
