import { $createImageNode, ImageNode } from "../nodes/ImageNode.js";

export const IMAGE_TRANSFORMER = {
	dependencies: [ImageNode],
	export: () => null,
	regExp: /^!\[([^\]]*)\]\(([^)]+)\)$/,

	replace: (parentNode, children, match, isImport) => {
		const [, , src] = match;
		const imageNode = $createImageNode(src);

		parentNode.replace(imageNode);
	},

	triggerOnEnter: true,
	type: "element",
};
