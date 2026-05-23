import { registerRichText } from "@lexical/rich-text";
import { mergeRegister } from "@lexical/utils";
import { createEditor } from "lexical";

import { config as defaultConfig } from "./editorConfig.js";
import { registerInlineToolbarPlugin } from "./plugins/InlineToolbarPlugin.js";

export default function initializeEditor(editorRef, config = defaultConfig) {
  const editor = createEditor(config);
  editor.setRootElement(editorRef);

  mergeRegister(
    registerRichText(editor),
    registerInlineToolbarPlugin(editor)
  );

  return editor;
}
