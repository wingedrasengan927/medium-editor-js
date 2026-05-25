import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode } from "@lexical/link";
import { HorizontalDividerNode } from "./nodes/HorizontalDividerNode.js";
import { MathNode } from "./nodes/MathNode.js";
import {
  MathHighlightNodeInline,
  MathHighlightNodeBlock,
} from "./nodes/MathHighlightNode.js";
import { ImageNode } from "./nodes/ImageNode.js";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeNode, CodeHighlightNode } from "@lexical/code-core";

const theme = {
  paragraph: "medium-paragraph",
  heading: {
    h1: "medium-h1",
    h2: "medium-h2",
    h3: "medium-h3",
  },
  text: {
    bold: "medium-bold",
    italic: "medium-italic",
    code: "medium-code",
  },
  code: "medium-code-block",
  codeHighlight: "medium-code-highlight",
  quote: "medium-quote",
  link: "medium-link",
  divider: "medium-divider",
  img: "medium-img",
  list: {
    nested: {
      listitem: "medium-nested-listitem",
    },
    ol: "medium-ol",
    ul: "medium-ul",
    listitem: "medium-listitem",
  },
  math: {
    renderedInline: "math-rendered-inline",
    renderedBlock: "math-rendered-block",
    highlightInline: "math-highlight-inline",
    highlightBlock: "math-highlight-block",
  },
};

export const config = {
  namespace: "medium-editor",
  theme,
  onError: console.error,
  nodes: [
    HeadingNode,
    QuoteNode,
    LinkNode,
    HorizontalDividerNode,
    MathNode,
    MathHighlightNodeInline,
    MathHighlightNodeBlock,
    ImageNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
  ],
};
