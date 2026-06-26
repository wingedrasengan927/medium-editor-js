import {
	DecoratorNode,
	$applyNodeReplacement,
	$createNodeSelection,
	$setSelection,
	createState,
	$getState,
	$setState,
	$create,
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

// State definitions specify the node's properties
const equationState = createState("equation", {
	parse: (v) => (typeof v === "string" ? v : ""),
});

const inlineState = createState("inline", {
	parse: (v) => (typeof v === "boolean" ? v : false),
});

export class MathNode extends DecoratorNode {
	$config() {
		return this.config("math", {
			extends: DecoratorNode,
			stateConfigs: [
				{ flat: true, stateConfig: equationState },
				{ flat: true, stateConfig: inlineState },
			],
		});
	}

	getEquation() {
		return $getState(this, equationState);
	}

	isInline() {
		return $getState(this, inlineState);
	}

	getTextContent() {
		return this.getEquation();
	}

	select() {
		const nodeSelection = $createNodeSelection();
		nodeSelection.add(this.getKey());
		$setSelection(nodeSelection);
		return nodeSelection;
	}

	createDOM(config) {
		const element = document.createElement("span");
		if (this.isInline()) {
			addClassNamesToElement(element, config.theme.math.renderedInline);
		} else {
			addClassNamesToElement(element, config.theme.math.renderedBlock);
		}
		element.textContent = this.getEquation();
		return element;
	}

	updateDOM(prevNode, dom, config) {
		// If either property changes, lexical re-creates the element
		const hasChanged =
			this.isInline() !== prevNode.isInline() ||
			this.getEquation() !== prevNode.getEquation();

		return hasChanged;
	}

	// exportJSON and importJSON are implicitly handled by the config API

	static importDOM() {
		return {
			span: () => ({
				conversion: $convertMathElement,
				priority: 1,
			}),
		};
	}

	exportDOM(editor) {
		const { element } = super.exportDOM(editor);
		element.textContent = this.getEquation();
		element.setAttribute("data-lexical-math", "true");
		element.setAttribute("data-math-inline", this.isInline().toString());
		return { element };
	}

	decorate() {
		return null;
	}
}

function $convertMathElement(element) {
	let node = null;
	if (element.getAttribute("data-lexical-math") === "true") {
		const equation = element.textContent;
		const inlineAttr = element.getAttribute("data-math-inline");
		const inline = inlineAttr === "true";
		node = $createMathNode(equation, inline);
	}
	return { node };
}

export function $createMathNode(equation, inline) {
	const node = $create(MathNode);
	$setState(node, equationState, equation);
	$setState(node, inlineState, inline);
	return $applyNodeReplacement(node);
}

export function $isMathNode(node) {
	return node instanceof MathNode;
}
