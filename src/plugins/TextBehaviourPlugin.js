import { $getRoot } from "lexical";
import { $createHeadingNode, HeadingNode } from "@lexical/rich-text";

function registerHeadingOneFirstPlugin(editor) {
  return editor.registerNodeTransform(HeadingNode, (node) => {
    if (node.getTag() !== "h2") {
      return;
    }

    const root = $getRoot();
    const firstChild = root.getFirstChild();

    if (firstChild !== null && node.is(firstChild)) {
      const children = node.getChildren();
      const h1Node = $createHeadingNode("h1");
      h1Node.append(...children);
      node.replace(h1Node);
    }
  });
}

export function registerTextBehaviourPlugin(editor, { isHeadingOneFirst = false } = {}) {
  if (isHeadingOneFirst) {
    return registerHeadingOneFirstPlugin(editor);
  }
  return () => {};
}
