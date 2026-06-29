import { $generateHtmlFromNodes } from "@lexical/html";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import copySvg from "@tabler/icons/outline/copy.svg?raw";
import { HR_TRANSFORMER } from "./transformers/HRTransformer";
import {
	MATH_INLINE_TRANSFORMER,
	MATH_BLOCK_SINGLE_LINE_TRANSFORMER,
	MATH_BLOCK_MULTILINE_TRANSFORMER,
	MATH_HIGHLIGHT_BLOCK_TRANSFORMER,
} from "./transformers/MathTransformer";
import { IMAGE_TRANSFORMER } from "./transformers/ImageTransformer";

async function copyToClipboard(text) {
	await navigator.clipboard.writeText(text);
}

export function setupNavbar(editor) {
	const copyHtmlBtn = document.getElementById("copy-html-btn");
	if (copyHtmlBtn) {
		copyHtmlBtn.innerHTML = `${copySvg}<span>HTML</span>`;
		copyHtmlBtn.addEventListener("click", () => {
			editor.read(() => {
				const html = $generateHtmlFromNodes(editor, null);
				copyToClipboard(html);
			});
		});
	}

	const copyMarkdownBtn = document.getElementById("copy-markdown-btn");
	if (copyMarkdownBtn) {
		copyMarkdownBtn.innerHTML = `${copySvg}<span>Markdown</span>`;
		copyMarkdownBtn.addEventListener("click", () => {
			editor.read(() => {
				const markdown = $convertToMarkdownString([
					HR_TRANSFORMER,
					MATH_INLINE_TRANSFORMER,
					MATH_BLOCK_SINGLE_LINE_TRANSFORMER,
					MATH_BLOCK_MULTILINE_TRANSFORMER,
					MATH_HIGHLIGHT_BLOCK_TRANSFORMER,
					IMAGE_TRANSFORMER,
					...TRANSFORMERS,
				]);
				copyToClipboard(markdown);
			});
		});
	}

	const copyJsonBtn = document.getElementById("copy-json-btn");
	if (copyJsonBtn) {
		copyJsonBtn.innerHTML = `${copySvg}<span>JSON</span>`;
		copyJsonBtn.addEventListener("click", () => {
			const json = JSON.stringify(
				editor.getEditorState().toJSON(),
				null,
				2,
			);
			copyToClipboard(json);
		});
	}
}
