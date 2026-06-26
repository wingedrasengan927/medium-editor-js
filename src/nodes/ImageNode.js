import {
	DecoratorNode,
	$applyNodeReplacement,
	$createNodeSelection,
	$setSelection,
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

export class ImageNode extends DecoratorNode {
	static getType() {
		return "image";
	}

	static clone(node) {
		const clone = new ImageNode(node.__src, node.__key);
		clone.__attributes = { ...node.__attributes };
		return clone;
	}

	constructor(src, key) {
		super(key);
		this.__src = src;
		this.__attributes = {};
	}

	createDOM(config) {
		const element = document.createElement("figure");
		addClassNamesToElement(element, config.theme.img);

		const imgElement = document.createElement("img");
		imgElement.setAttribute("src", this.getSrc());

		// Apply stored attributes
		for (const [name, value] of Object.entries(this.__attributes)) {
			imgElement.setAttribute(name, value);
		}

		element.appendChild(imgElement);
		return element;
	}

	updateDOM(prevNode, dom, config) {
		const imgElement = dom.querySelector("img");
		if (imgElement && prevNode.__src !== this.__src) {
			imgElement.setAttribute("src", this.__src);
		}
		return false;
	}

	static importDOM() {
		return {
			figure: (node) => ({
				conversion: $convertImageElement,
				priority: 1,
			}),
			img: (node) => ({
				conversion: (element) => {
					const src = element.getAttribute("src");
					if (!src) return null;
					return { node: $createImageNode(src) };
				},
				priority: 0,
			}),
		};
	}

	exportDOM(editor) {
		const { element } = super.exportDOM(editor);
		element.setAttribute("data-lexical-image-container", "true");

		const imgElement = document.createElement("img");
		imgElement.setAttribute("src", this.getSrc());

		// Apply stored attributes
		for (const [name, value] of Object.entries(this.__attributes)) {
			imgElement.setAttribute(name, value);
		}

		element.appendChild(imgElement);
		return { element };
	}

	static importJSON(serializedNode) {
		const { src } = serializedNode;
		const node = $createImageNode(src);
		return node;
	}

	exportJSON() {
		return {
			...super.exportJSON(),
			src: this.getSrc(),
			type: "image",
		};
	}

	select() {
		const nodeSelection = $createNodeSelection();
		nodeSelection.add(this.getKey());
		$setSelection(nodeSelection);
		return nodeSelection;
	}

	getSrc() {
		return this.__src;
	}

	setSrc(src) {
		const writable = this.getWritable();
		writable.__src = src;
	}

	getTextContent() {
		return "\n";
	}

	isInline() {
		return false;
	}

	decorate() {
		return null;
	}
}

function $convertImageElement(element) {
	let node = null;
	if (element.getAttribute("data-lexical-image-container") === "true") {
		const imgElement = element.querySelector("img");
		const src = imgElement.getAttribute("src");
		node = $createImageNode(src);

		// Store attributes
		for (const attr of imgElement.attributes) {
			if (attr.name !== "src") {
				node.__attributes[attr.name] = attr.value;
			}
		}
	}

	return { node };
}

export function $createImageNode(src) {
	return $applyNodeReplacement(new ImageNode(src));
}

export function $isImageNode(node) {
	return node instanceof ImageNode;
}
