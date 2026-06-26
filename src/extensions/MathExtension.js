import {
	defineExtension,
	mergeRegister,
	$getSelection,
	$isNodeSelection,
	$isRangeSelection,
	$setSelection,
	$getNodeByKey,
	SELECTION_CHANGE_COMMAND,
	BLUR_COMMAND,
	COMMAND_PRIORITY_HIGH,
	$createTextNode,
	PASTE_COMMAND,
} from "lexical";
import { $findMatchingParent } from "@lexical/utils";
import { MathNode, $createMathNode, $isMathNode } from "../nodes/MathNode.js";
import {
	MathHighlightNodeBlock,
	$createMathHighlightNodeBlock,
	$isMathHighlightNodeBlock,
} from "../nodes/MathHighlightNodeBlock.js";
import {
	MathHighlightNodeInline,
	$createMathHighlightNodeInline,
	$isMathHighlightNodeInline,
} from "../nodes/MathHighlightNodeInline.js";

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

// Helper to strip math delimiters based on inline/block type
function stripDelimiters(equation, isInline) {
	if (isInline) {
		if (equation.startsWith("$") && equation.endsWith("$")) {
			return equation.slice(1, -1);
		}
	} else {
		if (equation.startsWith("$$") && equation.endsWith("$$")) {
			return equation.slice(2, -2);
		}
	}
	return equation;
}

// Helper to convert MathNode to the appropriate MathHighlight node
function convertMathToMathHighlightNode(mathNode) {
	const equation = stripDelimiters(
		mathNode.getEquation(),
		mathNode.isInline(),
	);
	const mathHighlightNode = mathNode.isInline()
		? $createMathHighlightNodeInline(equation)
		: $createMathHighlightNodeBlock(equation);
	mathNode.replace(mathHighlightNode);
	mathHighlightNode.select();
}

// Helper to convert MathHighlight node back to MathNode
function convertMathHighlightToMathNode(node) {
	let equation = node.getTextContent();
	if (!equation) {
		node.remove();
		return;
	}

	// Convert to block math node if the user wraps the inline equation with additional '$' delimiters.
	if ($isMathHighlightNodeInline(node)) {
		let isBlock = false;
		if (
			equation.startsWith("$") &&
			equation.endsWith("$") &&
			equation.length >= 2
		) {
			equation = equation.slice(1, -1);
			isBlock = true;
		}

		const mathNode = isBlock
			? $createMathNode(`$$${equation}$$`, false)
			: $createMathNode(`$${equation}$`, true);
		node.replace(mathNode);
	} else if ($isMathHighlightNodeBlock(node)) {
		const mathNode = $createMathNode(`$$${equation}$$`, false);
		node.replace(mathNode);
	}
}

// Helper to identify the single active math highlight node where the cursor is
function getActiveMathHighlightNode(selection) {
	if ($isRangeSelection(selection)) {
		const anchorNode = selection.anchor.getNode();
		return $findMatchingParent(
			anchorNode,
			(node) =>
				$isMathHighlightNodeInline(node) ||
				$isMathHighlightNodeBlock(node),
		);
	}
	return null;
}

// Helper to restore all unselected/inactive math highlight nodes back to MathNodes
function convertUnselectedMathHighlightNodes(editor, excludeKey = null) {
	const editorState = editor.getEditorState();
	const allNodes = editorState._nodeMap;
	for (const [, node] of allNodes) {
		if (
			node.isAttached() &&
			node.getKey() !== excludeKey &&
			($isMathHighlightNodeInline(node) ||
				$isMathHighlightNodeBlock(node))
		) {
			convertMathHighlightToMathNode(node);
		}
	}
}

// Toggle between MathNode <-> MathHighlightNode when selection changes
function registerMathSelectionToggle(editor) {
	return editor.registerCommand(
		SELECTION_CHANGE_COMMAND,
		() => {
			const selection = $getSelection();

			// A single math node is selected; convert it to editing/highlight mode.
			if ($isNodeSelection(selection)) {
				const nodes = selection.getNodes();
				if (
					nodes.length === 1 &&
					$isMathNode(nodes[0]) &&
					editor.isEditable()
				) {
					convertMathToMathHighlightNode(nodes[0]);
					return true;
				}
			}

			// Find the active highlight node where the cursor is, and protect it.
			const activeHighlightNode = getActiveMathHighlightNode(selection);
			const excludeKey = activeHighlightNode
				? activeHighlightNode.getKey()
				: null;

			// Convert unselected highlight nodes back to math nodes
			convertUnselectedMathHighlightNodes(editor, excludeKey);

			return false;
		},
		COMMAND_PRIORITY_HIGH,
	);
}

// Convert MathHighlightNodes to MathNodes on editor blur
function registerMathBlur(editor) {
	return editor.registerCommand(
		BLUR_COMMAND,
		() => {
			editor.update(() => {
				convertUnselectedMathHighlightNodes(editor);
				$setSelection(null);
			});
			return false;
		},
		COMMAND_PRIORITY_HIGH,
	);
}

// Select MathNode on click
function registerMathClick(editor) {
	return editor.registerMutationListener(
		MathNode,
		(mutatedNodes) => {
			for (const [nodeKey, mutation] of mutatedNodes) {
				if (mutation === "created") {
					const domElement = editor.getElementByKey(nodeKey);
					if (domElement) {
						domElement.addEventListener("click", () => {
							editor.update(() => {
								const node = $getNodeByKey(nodeKey);
								if (editor.isEditable() && node) {
									node.select();
								}
							});
						});
					}
				}
			}
		},
		{ skipInitialization: false },
	);
}

// Inserts a trailing space after creating an inline math or highlight node to prevent the cursor from getting stuck.
function registerMathAutospace(editor) {
	const handleAutospace = (nodeKey) => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (
				$isMathHighlightNodeInline(node) ||
				($isMathNode(node) && node.isInline())
			) {
				const nextSibling = node.getNextSibling();
				if (!nextSibling) {
					node.insertAfter($createTextNode(" "));
				}
			}
		});
	};

	return mergeRegister(
		editor.registerMutationListener(
			MathHighlightNodeInline,
			(mutations) => {
				for (const [nodeKey, mutation] of mutations) {
					if (mutation === "created") {
						handleAutospace(nodeKey);
					}
				}
			},
			{ skipInitialization: false },
		),
		editor.registerMutationListener(
			MathNode,
			(mutations) => {
				for (const [nodeKey, mutation] of mutations) {
					if (mutation === "created") {
						handleAutospace(nodeKey);
					}
				}
			},
			{ skipInitialization: false },
		),
	);
}

// Intercept paste inside MathHighlightNodeInline to prevent splitting the custom text node.
function registerMathPaste(editor) {
	return editor.registerCommand(
		PASTE_COMMAND,
		(event) => {
			const selection = $getSelection();
			const activeHighlightNode = getActiveMathHighlightNode(selection);

			if (
				!activeHighlightNode ||
				!$isMathHighlightNodeInline(activeHighlightNode)
			) {
				return false;
			}

			const clipboardData = event.clipboardData;
			if (!clipboardData) {
				return false;
			}

			const plainText =
				clipboardData.getData("text/plain") ||
				clipboardData.getData("text");
			if (!plainText) {
				return false;
			}

			event.preventDefault();
			selection.insertText(plainText);
			return true;
		},
		COMMAND_PRIORITY_HIGH,
	);
}

export const MathExtension = defineExtension({
	name: "math-extension",
	nodes: () => [MathNode, MathHighlightNodeBlock, MathHighlightNodeInline],

	register: (editor) => {
		// Clean up any transient math highlight nodes at startup
		editor.update(() => {
			convertUnselectedMathHighlightNodes(editor);
		});

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

			registerMathSelectionToggle(editor),
			registerMathBlur(editor),
			registerMathClick(editor),
			registerMathAutospace(editor),
			registerMathPaste(editor),
		);
	},
});
