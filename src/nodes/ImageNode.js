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

const srcState = createState("src", {
	parse: (v) => (typeof v === "string" ? v : ""),
});

export class ImageNode extends DecoratorNode {
	$config() {
		return this.config("image", {
			extends: DecoratorNode,
			stateConfigs: [{ flat: true, stateConfig: srcState }],
		});
	}

	createDOM(config) {
		const element = document.createElement("figure");
		addClassNamesToElement(element, config.theme.img);

		const imgElement = document.createElement("img");
		imgElement.setAttribute("src", this.getSrc());

		element.appendChild(imgElement);
		return element;
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

		element.appendChild(imgElement);
		return { element };
	}

	select() {
		const nodeSelection = $createNodeSelection();
		nodeSelection.add(this.getKey());
		$setSelection(nodeSelection);
		return nodeSelection;
	}

	getSrc() {
		return $getState(this, srcState);
	}

	setSrc(src) {
		$setState(this, srcState, src);
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
	}

	return { node };
}

export function $createImageNode(src) {
	const node = $create(ImageNode);
	$setState(node, srcState, src);
	return $applyNodeReplacement(node);
}

export function $isImageNode(node) {
	return node instanceof ImageNode;
}
