import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode } from "@lexical/link";
import { HorizontalDividerNode } from "./nodes/HorizontalDividerNode.js";
import { MathNode } from "./nodes/MathNode.js";
import {
  MathHighlightNodeInline,
  MathHighlightNodeBlock,
} from "./nodes/MathHighlightNode.js";
import { ImageNode } from "./nodes/ImageNode.js";

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
  quote: "medium-quote",
  link: "medium-link",
  divider: "medium-divider",
  img: "medium-img",
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
  ],
};
