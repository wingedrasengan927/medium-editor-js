import "./editor_styles.css";
import "./styles.css";
import { $getRoot } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import initializeEditor from "./editor.js";

const editorRef = document.getElementById("lexical-editor");
const editor = initializeEditor(editorRef);

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

document.getElementById("copy-html-btn").addEventListener("click", () => {
  editor.read(() => {
    const html = $generateHtmlFromNodes(editor, null);
    copyToClipboard(html);
  });
});

document.getElementById("copy-json-btn").addEventListener("click", () => {
  const json = JSON.stringify(editor.getEditorState().toJSON(), null, 2);
  copyToClipboard(json);
});

document.getElementById("copy-text-btn").addEventListener("click", () => {
  editor.read(() => {
    const text = $getRoot().getTextContent();
    copyToClipboard(text);
  });
});
