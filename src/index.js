// src/index.js
import "./editor_style.css";

export { default as initializeEditor } from "./editor.js";
export { default as defaultEditorTheme } from "./editorTheme.js";

// Export custom transformers
export { HR_TRANSFORMER } from "./transformers/HRTransformer.js";
export { IMAGE_TRANSFORMER } from "./transformers/ImageTransformer.js";
export {
	MATH_INLINE_TRANSFORMER,
	MATH_BLOCK_SINGLE_LINE_TRANSFORMER,
	MATH_BLOCK_MULTILINE_TRANSFORMER,
	MATH_HIGHLIGHT_BLOCK_TRANSFORMER,
} from "./transformers/MathTransformer.js";