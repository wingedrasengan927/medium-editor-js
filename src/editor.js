import { registerRichText } from "@lexical/rich-text";
import { mergeRegister } from "@lexical/utils";
import { createEditor } from "lexical";

import { config as defaultConfig } from "./editorConfig.js";
import { registerInlineToolbarPlugin } from "./plugins/InlineToolbarPlugin.js";
import { registerBlockToolbarPlugin } from "./plugins/BlockToolbarPlugin.js";
import {
  registerMathInlinePlugin,
  registerMathBlockPlugin,
} from "./plugins/MathPlugin.js";
import { registerImagePlugin } from "./plugins/ImagePlugin.js";
import { registerListPlugin } from "./plugins/ListPlugin.js";
import { registerTabInterceptorPlugin } from "./plugins/TabInterceptorPlugin.js";
import { registerCodePlugin } from "./plugins/CodePlugin.js";
import { registerMarkdownPlugin } from "./plugins/MarkdownPlugin.js";

export default function initializeEditor(editorRef, config = defaultConfig) {
  const editor = createEditor(config);
  editor.setRootElement(editorRef);

  mergeRegister(
    registerRichText(editor),
    registerInlineToolbarPlugin(editor),
    registerBlockToolbarPlugin(editor),
    registerMathInlinePlugin(editor),
    registerMathBlockPlugin(editor),
    registerImagePlugin(editor),
    registerListPlugin(editor),
    registerTabInterceptorPlugin(editor),
    registerCodePlugin(editor),
    registerMarkdownPlugin(editor)
  );

  return editor;
}
