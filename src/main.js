import "./editor_styles.css";
import "./styles.css";
import { $getRoot } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $convertToMarkdownString } from "@lexical/markdown";
import copySvg from "@tabler/icons/outline/copy.svg?raw";
import initializeEditor from "./editor.js";
import { MEDIUM_TRANSFORMERS } from "./plugins/markdownTransformers.js";

const editorRef = document.getElementById("lexical-editor");
const editor = initializeEditor(editorRef, undefined, { isHeadingOneFirst: true, fontSize: 'small' });

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

const copyHtmlBtn = document.getElementById("copy-html-btn");
copyHtmlBtn.innerHTML = `${copySvg}<span>HTML</span>`;
copyHtmlBtn.addEventListener("click", () => {
  editor.read(() => {
    const html = $generateHtmlFromNodes(editor, null);
    copyToClipboard(html);
  });
});

const copyMarkdownBtn = document.getElementById("copy-markdown-btn");
copyMarkdownBtn.innerHTML = `${copySvg}<span>Markdown</span>`;
copyMarkdownBtn.addEventListener("click", () => {
  editor.read(() => {
    const markdown = $convertToMarkdownString(MEDIUM_TRANSFORMERS);
    // @lexical/markdown escapes every * _ ` ~ \ in text (e.g. input_features
    // -> input\_features). Remove those backslash escapes so the raw markdown
    // reads naturally. Fenced code blocks aren't escaped by lexical, so they
    // are left untouched here.
    const unescaped = unescapeMarkdown(markdown);
    copyToClipboard(unescaped);
  });
});

// Reverses the character escaping that @lexical/markdown applies on export.
// It only strips a backslash when it precedes a markdown special char it
// would have escaped, so legitimate text is preserved.
function unescapeMarkdown(markdown) {
  const lines = markdown.split("\n");
  let inFence = false;
  return lines
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return line.replace(/\\([*_`~\\])/g, "$1");
    })
    .join("\n");
}

const copyJsonBtn = document.getElementById("copy-json-btn");
copyJsonBtn.innerHTML = `${copySvg}<span>JSON</span>`;
copyJsonBtn.addEventListener("click", () => {
  const json = JSON.stringify(editor.getEditorState().toJSON(), null, 2);
  copyToClipboard(json);
});

const copyTextBtn = document.getElementById("copy-text-btn");
copyTextBtn.innerHTML = `${copySvg}<span>Text</span>`;
copyTextBtn.addEventListener("click", () => {
  editor.read(() => {
    const text = $getRoot().getTextContent();
    copyToClipboard(text);
  });
});
