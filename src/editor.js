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
import { registerHistoryPlugin } from "./plugins/HistoryPlugin.js";
import { registerTextBehaviourPlugin } from "./plugins/TextBehaviourPlugin.js";

export default function initializeEditor(editorRef, config = defaultConfig, { disableImage = false, isHeadingOneFirst = false, fontSize = 'medium' } = {}) {
  // Map font size parameter to base pixels
  let sizeValue = '21px'; // default (medium)
  if (fontSize === 'small') sizeValue = '18px';
  if (fontSize === 'large') sizeValue = '24px';
  
  // Set the root variable so all relative fonts scale perfectly
  editorRef.style.setProperty('--editor-base-font', sizeValue);

  const editor = createEditor(config);
  editor.setRootElement(editorRef);

  mergeRegister(
    registerRichText(editor),
    registerHistoryPlugin(editor),
    registerInlineToolbarPlugin(editor),
    registerBlockToolbarPlugin(editor, { disableImage }),
    registerMathInlinePlugin(editor),
    registerMathBlockPlugin(editor),
    ...(disableImage ? [] : [registerImagePlugin(editor)]),
    registerListPlugin(editor),
    registerTabInterceptorPlugin(editor),
    registerCodePlugin(editor),
    registerMarkdownPlugin(editor),
    registerTextBehaviourPlugin(editor, { isHeadingOneFirst })
  );

  return editor;
}
