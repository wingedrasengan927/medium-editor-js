import {
	createCommand,
	defineExtension,
	COMMAND_PRIORITY_HIGH,
	BLUR_COMMAND,
	$getSelection,
	$isRangeSelection,
	$findMatchingParent,
	$getNodeByKey,
	$getPreviousSelection,
} from "lexical";
import { CodeExtension, $isCodeNode, CodeNode } from "@lexical/code-core";
import { mergeRegister } from "@lexical/utils";
import { CodeMenu } from "../components/CodeMenu/CodeMenu.js";

const SET_CODE_LANGUAGE_COMMAND = createCommand("SET_CODE_LANGUAGE_COMMAND");
const SET_CODE_THEME_COMMAND = createCommand("SET_CODE_THEME_COMMAND");

export const CodeMenuExtension = defineExtension({
	name: "CodeMenuExtension",
	dependencies: [CodeExtension],

	register: (editor) => {
		const codeMenu = new CodeMenu(editor, {
			setLanguageCommand: SET_CODE_LANGUAGE_COMMAND,
			setThemeCommand: SET_CODE_THEME_COMMAND,
		});

		const isFocusInCodeMenu = () => {
			const active = document.activeElement;

			return !!(
				codeMenu.element &&
				active &&
				(codeMenu.element === active ||
					codeMenu.element.contains(active))
			);
		};

		return mergeRegister(
			// automatically set the default language to Python whenever a new code node is created
			editor.registerMutationListener(CodeNode, (mutations) => {
				editor.update(() => {
					for (const [nodeKey, mutation] of mutations) {
						if (mutation === "created") {
							const codeNode = $getNodeByKey(nodeKey);
							if ($isCodeNode(codeNode)) {
								codeNode.setLanguage("python");
							}
						}
					}
				});
			}),

			editor.registerCommand(
				SET_CODE_LANGUAGE_COMMAND,
				(payload) => {
					const [nodeKey, language] = payload;
					const codeNode = $getNodeByKey(nodeKey);
					if ($isCodeNode(codeNode)) {
						codeNode.selectStart();
						codeNode.setLanguage(language);
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_HIGH,
			),

			editor.registerCommand(
				SET_CODE_THEME_COMMAND,
				(payload) => {
					const [nodeKey, theme] = payload;
					const codeNode = $getNodeByKey(nodeKey);
					if ($isCodeNode(codeNode)) {
						codeNode.selectStart();
						codeNode.setTheme(theme);
						return true;
					}
					return false;
				},
				COMMAND_PRIORITY_HIGH,
			),

			// When the editor loses focus, hide the code menu unless the menu itself is focused
			editor.registerCommand(
				BLUR_COMMAND,
				() => {
					setTimeout(() => {
						if (!isFocusInCodeMenu()) {
							codeMenu.hide();
						}
					}, 10);

					return false;
				},
				COMMAND_PRIORITY_HIGH,
			),

			editor.registerUpdateListener(({ editorState }) => {
				editorState.read(
					() => {
						if (!editor.isEditable()) {
							codeMenu.hide();
							return;
						}

						// Show the menu if the active selection is inside a code block
						const selection = $getSelection();

						if (!$isRangeSelection(selection)) {
							return;
						}

						const node = selection.anchor.getNode();
						const codeNode = $findMatchingParent(node, $isCodeNode);

						if (codeNode) {
							const domElement = editor.getElementByKey(
								codeNode.getKey(),
							);
							if (domElement) {
								const rect = domElement.getBoundingClientRect();
								codeMenu.show(
									rect.right,
									Math.max(0, rect.top + window.scrollY),
									codeNode.getKey(),
								);
							}
						} else {
							codeMenu.hide();
						}
					},
					{ editor },
				);
			}),
		);
	},
});
