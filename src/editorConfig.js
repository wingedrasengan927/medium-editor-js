import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode } from "@lexical/link";
import { HorizontalDividerNode } from "./nodes/HorizontalDividerNode.js";

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
};

export const config = {
  namespace: "medium-editor",
  theme,
  onError: console.error,
  nodes: [HeadingNode, QuoteNode, LinkNode, HorizontalDividerNode],
};
