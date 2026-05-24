import {
  TextNode,
  $applyNodeReplacement,
  ElementNode,
  $createParagraphNode,
  $createTextNode,
  $isParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isLineBreakNode,
} from "lexical";
import { addClassNamesToElement, $findMatchingParent } from "@lexical/utils";
import { $createMathNode } from "./MathNode.js";

export class MathHighlightNodeInline extends TextNode {
  static getType() {
    return "math-highlight-inline";
  }

  static clone(node) {
    return new MathHighlightNodeInline(node.__equation, node.__key);
  }

  createDOM(config) {
    const element = super.createDOM(config);
    addClassNamesToElement(element, config.theme.math.highlightInline);
    return element;
  }

  static importJSON(serializedNode) {
    // Reconstitute as a rendered MathNode (inline)
    return $createMathNode(`$${serializedNode.text}$`, true);
  }

  exportJSON() {
    // Return a valid serialization with the correct type so Lexical's
    // type check passes. The text field carries the bare equation.
    return { ...super.exportJSON() };
  }

  exportDOM(editor) {
    // Export as a MathNode
    const element = document.createElement("span");
    addClassNamesToElement(element, editor._config.theme.math.renderedInline);
    element.textContent = this.getTextContent();
    element.setAttribute("data-lexical-math", "true");
    element.setAttribute("data-math-inline", "true");
    return { element };
  }
}

export function $createMathHighlightNodeInline(equation) {
  const mathHighlightNode = new MathHighlightNodeInline(equation);
  return $applyNodeReplacement(mathHighlightNode);
}

export function $isMathHighlightNodeInline(node) {
  return node instanceof MathHighlightNodeInline;
}

export class MathHighlightNodeBlock extends ElementNode {
  static getType() {
    return "math-highlight-block";
  }

  static clone(node) {
    return new MathHighlightNodeBlock(node.__equation, node.__key);
  }

  constructor(equation, key) {
    super(key);
    this.__equation = equation;
  }

  createDOM(config) {
    const element = document.createElement("span");
    addClassNamesToElement(element, config.theme.math.highlightBlock);
    return element;
  }

  updateDOM() {
    return false;
  }

  static importJSON(serializedNode) {
    // Reconstitute as a rendered MathNode (block)
    return $createMathNode(`$$${serializedNode.equation}$$`, false);
  }

  exportJSON() {
    // Return a valid serialization with the correct type so Lexical's
    // type check passes. ElementNode's super provides the children array.
    // equation is stored explicitly so importJSON can reconstruct without
    // traversing the children array.
    return { ...super.exportJSON(), equation: this.getTextContent() };
  }

  exportDOM(editor) {
    const element = document.createElement("span");
    addClassNamesToElement(element, editor._config.theme.math.renderedBlock);
    element.textContent = this.getTextContent();
    element.setAttribute("data-lexical-math", "true");
    element.setAttribute("data-math-inline", "false");
    return { element };
  }

  collapseAtStart() {
    this.remove();
    return true;
  }

  insertNewAfter() {
    const selection = $getSelection();
    if ($isRangeSelection(selection) && selection.isCollapsed()) {
      const lastChild = this.getLastChild();
      const anchorNode = selection.anchor.getNode();
      const isAtBlockEnd =
        (anchorNode.getKey() === this.getKey() &&
          selection.anchor.offset === 0 &&
          this.getChildrenSize() === 0) ||
        (lastChild &&
          $isLineBreakNode(lastChild) &&
          anchorNode.getKey() === this.getKey() &&
          selection.anchor.offset === this.getChildrenSize()) ||
        (lastChild &&
          $isTextNode(lastChild) &&
          anchorNode.getKey() === lastChild.getKey() &&
          selection.anchor.offset === lastChild.getTextContent().length);
      if (isAtBlockEnd) {
        // If the last child is a LineBreakNode, the user pressed Enter twice.
        // Exit the block.
        if (lastChild && $isLineBreakNode(lastChild)) {
          lastChild.remove();
          const parentNode = $findMatchingParent(this, $isParagraphNode);
          const paragraphNode = $createParagraphNode();
          if (!parentNode) {
            this.insertAfter(paragraphNode);
          } else {
            parentNode.insertAfter(paragraphNode);
          }
          paragraphNode.select();
          return paragraphNode;
        } else {
          // Otherwise insert a line break within the block.
          selection.insertLineBreak();
          return null;
        }
      }
    }
  }
}

export function $createMathHighlightNodeBlock(equation) {
  const equationTextNode = $createTextNode(equation);
  let mathHighlightNode = new MathHighlightNodeBlock(equation);
  return $applyNodeReplacement(mathHighlightNode.append(equationTextNode));
}

export function $isMathHighlightNodeBlock(node) {
  return node instanceof MathHighlightNodeBlock;
}
