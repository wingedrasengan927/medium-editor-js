import {
  createCommand,
  COMMAND_PRIORITY_HIGH,
  $getPreviousSelection,
  $isRangeSelection,
  $createParagraphNode,
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  BLUR_COMMAND,
  $getNodeByKey,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { $createImageNode, $isImageNode, ImageNode } from "../nodes/ImageNode.js";

export const INSERT_IMAGE_COMMAND = createCommand("INSERT_IMAGE_COMMAND");
const SELECTED_CLASS_NAME = "selected";

function registerNodeEvent(editor, klass, eventType, listener) {
  const registeredKeys = new Set();
  return editor.registerMutationListener(
    klass,
    (mutations) => {
      editor.getEditorState().read(() => {
        for (const [key, mutation] of mutations) {
          if (mutation === "destroyed") {
            registeredKeys.delete(key);
            continue;
          }
          const element = editor.getElementByKey(key);
          if (element && !registeredKeys.has(key)) {
            registeredKeys.add(key);
            element.addEventListener(eventType, (event) => {
              editor.update(() => {
                listener(event, editor, key);
              });
            });
          }
        }
      });
    },
    { skipInitialization: false }
  );
}

function isImageFile(file) {
  return file && file.type && file.type.startsWith("image/");
}

function $insertImageNode(src) {
  const prevSelection = $getPreviousSelection() || $getSelection();
  if (!$isRangeSelection(prevSelection)) {
    return null;
  }

  const imageNode = $createImageNode(src);
  prevSelection.insertNodes([imageNode]);

  let nextNode =
    imageNode.getNextSibling() || imageNode.getParent()?.getNextSibling();
  if (!nextNode) {
    nextNode = $createParagraphNode();
    imageNode.insertAfter(nextNode);
  }

  imageNode.select();
  return imageNode.getKey();
}

export function registerImagePlugin(editor) {
  if (!editor.hasNode(ImageNode)) {
    throw new Error("ImagePlugin: ImageNode not registered on editor");
  }

  let selectedImgElem = null;

  const unregister = mergeRegister(
    editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        if (typeof payload === "string") {
          $insertImageNode(payload);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    ),

    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        if (selectedImgElem) {
          selectedImgElem.classList.remove(SELECTED_CLASS_NAME);
          selectedImgElem = null;
        }

        if (!editor.isEditable()) {
          return false;
        }

        const selection = $getSelection();
        if ($isNodeSelection(selection) && selection.getNodes().length === 1) {
          const node = selection.getNodes()[0];
          if ($isImageNode(node)) {
            const DOMElement = editor.getElementByKey(node.getKey());
            if (DOMElement) {
              DOMElement.classList.add(SELECTED_CLASS_NAME);
              selectedImgElem = DOMElement;
            }
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    ),

    editor.registerCommand(
      BLUR_COMMAND,
      () => {
        const selection = $getSelection();
        if (
          $isNodeSelection(selection) &&
          selection.getNodes().length === 1 &&
          $isImageNode(selection.getNodes()[0])
        ) {
          $setSelection(null);
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    ),

    editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const imageFiles = Array.from(clipboardData.files).filter(isImageFile);
        if (imageFiles.length !== 1) return false;

        const selection = $getSelection() || $getPreviousSelection();
        if (!$isRangeSelection(selection)) return false;

        event.preventDefault();

        const imageFile = imageFiles[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target.result === "string") {
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, e.target.result);
          }
        };
        reader.readAsDataURL(imageFile);

        return true;
      },
      COMMAND_PRIORITY_HIGH
    ),

    registerNodeEvent(editor, ImageNode, "click", (event, editor, key) => {
      if (!editor.isEditable()) {
        return;
      }
      const node = $getNodeByKey(key);
      if (node) {
        node.select();
      }
    })
  );

  return unregister;
}
