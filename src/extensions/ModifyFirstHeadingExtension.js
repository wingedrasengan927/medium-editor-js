import { defineExtension, $isRootNode } from "lexical";
import { HeadingNode } from "@lexical/rich-text";

const ModifyFirstHeadingExtension = defineExtension({
	name: "ModifyFirstHeadingExtension",
	nodes: () => [HeadingNode],

	register(editor) {
		const removeTransform = editor.registerNodeTransform(
			HeadingNode,
			(headingNode) => {
				const tag = headingNode.getTag();
				const parentNode = headingNode.getParent();

				if (
					tag === "h2" &&
					$isRootNode(parentNode) &&
					parentNode.getFirstChild() === headingNode
				) {
					headingNode.setTag("h1");
				}
			},
		);

		return removeTransform;
	},
});

export default ModifyFirstHeadingExtension;
