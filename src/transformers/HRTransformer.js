import {
	$createHorizontalRuleNode,
	$isHorizontalRuleNode,
	HorizontalRuleNode,
} from "@lexical/extension";

export const HR_TRANSFORMER = {
	dependencies: [HorizontalRuleNode],
	export: (node) => {
		return $isHorizontalRuleNode(node) ? "---" : null;
	},
	regExp: /^(---)\s?$/,

	// If parent node has a next sibling, we replace the parent node with the hr node.
	// else we insert the hr node as the parent node's previous sibling
	replace: (parentNode, children, match, isImport) => {
		const node = $createHorizontalRuleNode();

		if (isImport || parentNode.getNextSibling() !== null) {
			parentNode.replace(node);
		} else {
			parentNode.insertBefore(node);
		}

		node.selectNext();
	},

	triggerOnEnter: true,
	type: "element",
};
