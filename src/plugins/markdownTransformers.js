import {
  HEADING,
  QUOTE,
  ORDERED_LIST,
  UNORDERED_LIST,
  CODE,
  INLINE_CODE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
} from "@lexical/markdown";
import { $createParagraphNode } from "lexical";
import { $createMathNode, $isMathNode, MathNode } from "../nodes/MathNode.js";
import {
  $createHorizontalDividerNode,
  $isHorizontalDividerNode,
  HorizontalDividerNode,
} from "../nodes/HorizontalDividerNode.js";

// Pull the bare equation out of whatever delimiters a MathNode happens to store
// it with, so export can re-wrap it in the canonical $ / $$ form.
function stripMathDelimiters(equation) {
  if (equation.startsWith("$$") && equation.endsWith("$$")) {
    return equation.slice(2, -2);
  }
  if (equation.startsWith("\\[") && equation.endsWith("\\]")) {
    return equation.slice(2, -2);
  }
  if (equation.startsWith("$") && equation.endsWith("$")) {
    return equation.slice(1, -1);
  }
  if (equation.startsWith("\\(") && equation.endsWith("\\)")) {
    return equation.slice(2, -2);
  }
  return equation;
}

// Export-only transformer for MathNode. Inline math is emitted as $...$ and
// block math as $$\n...\n$$. Import of $...$ / $$...$$ is left to the math
// plugin's node transforms; multiline $$\n...\n$$ blocks are handled by
// MATH_BLOCK below.
export const MATH = {
  dependencies: [MathNode],
  export: (node) => {
    if (!$isMathNode(node)) {
      return null;
    }
    const inner = stripMathDelimiters(node.getEquation());
    return node.isInline() ? `$${inner}$` : `$$\n${inner}\n$$`;
  },
  regExp: /$^/,
  type: "text-match",
};

// Imports a fenced block of the form:
//   $$
//   ...equation...
//   $$
// into a (rendered) block MathNode. Single-line $$...$$ is intentionally not
// matched here so the math plugin's node transform handles it instead.
export const MATH_BLOCK = {
  dependencies: [MathNode],
  export: () => null,
  regExpStart: /^\s*\$\$\s*$/,
  regExpEnd: /^\s*\$\$\s*$/,
  replace: (rootNode, _children, _startMatch, _endMatch, linesInBetween) => {
    const equation = (linesInBetween || []).join("\n").trim();
    if (!equation) {
      return false;
    }
    const paragraph = $createParagraphNode();
    paragraph.append($createMathNode(`$$${equation}$$`, false));
    rootNode.append(paragraph);
  },
  type: "multiline-element",
};

// Imports a standalone single-line block of the form `$$ ...equation... $$`
// into a (rendered) block MathNode. This form can't be left to the math
// plugin: its node transform treats a leading `$$ ` as the "insert empty math
// block" trigger and bails out when there's trailing content, so the equation
// would otherwise stay as plain text. Inner whitespace is trimmed.
export const MATH_BLOCK_SINGLE_LINE = {
  dependencies: [MathNode],
  export: () => null,
  regExp: /^\s*\$\$\s*(.+?)\s*\$\$\s*$/,
  replace: (parentNode, _children, match) => {
    const equation = match[1].trim();
    if (!equation) {
      return false;
    }
    const paragraph = $createParagraphNode();
    paragraph.append($createMathNode(`$$${equation}$$`, false));
    parentNode.replace(paragraph);
  },
  type: "element",
};

export const HORIZONTAL_DIVIDER = {
  dependencies: [HorizontalDividerNode],
  export: (node) => {
    if (!$isHorizontalDividerNode(node)) {
      return null;
    }
    return "---";
  },
  regExp: /^(---|\*\*\*|___)\s*$/,
  replace: (parentNode) => {
    parentNode.replace($createHorizontalDividerNode());
  },
  type: "element",
};

// Order mirrors @lexical/markdown's TRANSFORMERS: multiline elements first,
// then block elements, then inline text formats, then text matches.
export const MEDIUM_TRANSFORMERS = [
  CODE,
  MATH_BLOCK,
  MATH_BLOCK_SINGLE_LINE,
  HEADING,
  QUOTE,
  HORIZONTAL_DIVIDER,
  UNORDERED_LIST,
  ORDERED_LIST,
  INLINE_CODE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  MATH,
  LINK,
];
