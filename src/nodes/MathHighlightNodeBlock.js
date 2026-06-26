import {
	ElementNode,
	$createParagraphNode,
	$createTextNode,
	$isTextNode,
	$isLineBreakNode,
	$createLineBreakNode,
	$create,
	$applyNodeReplacement,
	$isRangeSelection,
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

export class MathHighlightNodeBlock extends ElementNode {
	$config() {
		return this.config("math-highlight-block", {
			extends: ElementNode,
		});
	}

	createDOM(config) {
		const element = document.createElement("span");
		addClassNamesToElement(element, config.theme.math.highlightBlock);
		return element;
	}

	// Do not re-create the container element on update.
	updateDOM() {
		return false;
	}

	// Export as a standard MathNode (block). Hence import functions aren't required
	exportJSON() {
		return {
			type: "math",
			version: 1,
			equation: this.getTextContent(),
			inline: false,
		};
	}

	exportDOM(editor) {
		const element = document.createElement("span");
		addClassNamesToElement(
			element,
			editor._config.theme.math.renderedBlock,
		);
		element.textContent = this.getTextContent();
		element.setAttribute("data-lexical-math", "true");
		element.setAttribute("data-math-inline", "false");
		return { element };
	}

	canIndent() {
		return false;
	}

	// Collapse block into a Paragraph when Backspace is hit at the start
	collapseAtStart() {
		const paragraph = $createParagraphNode();
		const children = this.getChildren();
		children.forEach((child) => paragraph.append(child));
		this.replace(paragraph);
		return true;
	}

	// Handles inserting a newline or exiting the block when the Enter key is pressed
	insertNewAfter(selection) {
		if (!$isRangeSelection(selection)) {
			return null;
		}

		const { anchor } = selection;
		const childrenSize = this.getChildrenSize();

		// Exit block check. (See step 2 below for the normal Enter key behavior).
		// ---
		// Note: The cursor (selection) cannot position itself on a LineBreakNode.
		// Instead, it is placed at the element node level (anchor.type === "element")
		const lastChild = this.getLastChild();
		if (
			lastChild &&
			$isLineBreakNode(lastChild) &&
			anchor.type === "element" &&
			anchor.getNode().getKey() === this.getKey() &&
			anchor.offset === childrenSize
		) {
			// Exit the block since the cursor is at the empty line after the line break.
			lastChild.remove(); // Remove the trailing LineBreakNode
			const paragraphNode = $createParagraphNode();
			this.insertAfter(paragraphNode);
			paragraphNode.select();
			return paragraphNode;
		}

		// 2. Normal Enter key behavior: insert a line break
		const anchorNode = anchor.getNode();
		if ($isTextNode(anchorNode)) {
			// Split the text node at the cursor position and insert a LineBreakNode
			// between the split text nodes, then position the cursor at the start of the new line.
			const split = anchorNode.splitText(anchor.offset)[0];
			const x = anchor.offset === 0 ? 0 : 1;
			const index = split.getIndexWithinParent() + x;
			const nodesToInsert = [$createLineBreakNode()];
			this.splice(index, 0, nodesToInsert);
			split.getNextSibling().selectNext(0, 0);
		} else if (anchorNode.getKey() === this.getKey()) {
			// Cursor is positioned at an empty element block. Insert line break.
			const { offset } = anchor;
			this.splice(offset, 0, [$createLineBreakNode()]);
			this.select(offset + 1, offset + 1);
		}

		return null;
	}
}

export function $createMathHighlightNodeBlock(equation) {
	const equationTextNode = $createTextNode(equation);
	const mathHighlightNode = $create(MathHighlightNodeBlock);
	return $applyNodeReplacement(mathHighlightNode.append(equationTextNode));
}

export function $isMathHighlightNodeBlock(node) {
	return node instanceof MathHighlightNodeBlock;
}
