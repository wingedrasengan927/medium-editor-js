import { defineExtension, mergeRegister } from "lexical";
import { MathNode } from "../nodes/MathNode.js";
import { MathHighlightNodeBlock } from "../nodes/MathHighlightNodeBlock.js";
import { MathHighlightNodeInline } from "../nodes/MathHighlightNodeInline.js";

function typesetMath(element) {
	const mathJax = window.MathJax;
	if (!mathJax) {
		return;
	}
	const run = () =>
		mathJax
			.typesetPromise([element])
			.catch((err) => console.error("MathJax typesetting failed:", err));
	if (mathJax.startup && mathJax.startup.promise) {
		mathJax.startup.promise.then(run);
	} else if (mathJax.typesetPromise) {
		run();
	}
}

export const MathExtension = defineExtension({
	name: "math-extension",
	nodes: () => [MathNode, MathHighlightNodeBlock, MathHighlightNodeInline],

	register: (editor) => {
		return mergeRegister(
			// Run MathJax typesetting whenever the mathnode is created or updated
			editor.registerMutationListener(MathNode, (mutatedNodes) => {
				for (const [nodeKey, mutation] of mutatedNodes) {
					if (mutation === "created" || mutation === "updated") {
						editor.update(() => {
							const domElement = editor.getElementByKey(nodeKey);
							if (domElement) {
								typesetMath(domElement);
							}
						});
					}
				}
			}),
		);
	},
});
