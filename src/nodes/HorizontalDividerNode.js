import { DecoratorNode, $applyNodeReplacement } from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

function createDotSVG() {
  const dotSize = 6;
  const r = dotSize / 2;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", dotSize);
  svg.setAttribute("height", dotSize);
  svg.setAttribute("viewBox", `0 0 ${dotSize} ${dotSize}`);
  svg.setAttribute("aria-hidden", "true");
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", r);
  circle.setAttribute("cy", r);
  circle.setAttribute("r", r);
  svg.appendChild(circle);
  return svg;
}

export class HorizontalDividerNode extends DecoratorNode {
  static getType() {
    return "horizontal-divider";
  }

  static clone(node) {
    return new HorizontalDividerNode(node.__key);
  }

  createDOM(config) {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.divider);
    element.appendChild(createDotSVG());
    element.appendChild(createDotSVG());
    element.appendChild(createDotSVG());
    return element;
  }

  getTextContent() {
    return "\n";
  }

  isInline() {
    return false;
  }

  updateDOM() {
    return false;
  }

  static importDOM() {
    return {
      div: (node) => {
        if (node.getAttribute("data-lexical-horizontal-divider") === "true") {
          return {
            conversion: $convertHorizontalDividerElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-horizontal-divider", "true");
    element.appendChild(createDotSVG());
    element.appendChild(createDotSVG());
    element.appendChild(createDotSVG());
    return { element };
  }

  static importJSON(serializedNode) {
    return $createHorizontalDividerNode().updateFromJSON(serializedNode);
  }

  exportJSON() {
    return { ...super.exportJSON(), type: "horizontal-divider" };
  }

  decorate() {
    return null;
  }
}

function $convertHorizontalDividerElement(element) {
  let node = null;
  if (element.getAttribute("data-lexical-horizontal-divider") === "true") {
    node = $createHorizontalDividerNode();
  }
  return { node };
}

export function $createHorizontalDividerNode() {
  return $applyNodeReplacement(new HorizontalDividerNode());
}

export function $isHorizontalDividerNode(node) {
  return node instanceof HorizontalDividerNode;
}
