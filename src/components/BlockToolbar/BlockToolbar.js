import plusSvg from "@tabler/icons/outline/plus.svg?raw";
import lineDashedSvg from "@tabler/icons/outline/line-dashed.svg?raw";
import photoSvg from "@tabler/icons/outline/photo.svg?raw";
import codeSvg from "@tabler/icons/outline/code.svg?raw";
import { INSERT_HORIZONTAL_DIVIDER_COMMAND } from "../../plugins/BlockToolbarPlugin.js";
import { INSERT_IMAGE_COMMAND } from "../../plugins/ImagePlugin.js";
import { INSERT_CODE_BLOCK_COMMAND } from "../../plugins/CodePlugin.js";
import "./styles/Popover.css";

const OFFSCREEN = -1000;

export class BlockToolbar {
  #outsideClickHandler = null;

  constructor(editor, gap = 8, disableImage = false) {
    this.editor = editor;
    this.gap = gap;
    this.disableImage = disableImage;
    this.isOpen = false;
    this.#buildDom();
  }

  show(x, y) {
    this.triggerElement.style.display = "flex";
    const { width, height } = this.triggerElement.getBoundingClientRect();
    this.triggerElement.style.left = `${x - width - this.gap}px`;
    this.triggerElement.style.top = `${y - height / 2}px`;

    if (this.isOpen) {
      this.#positionPopover();
    }
  }

  hide() {
    this.triggerElement.style.display = "none";
    this.#closePopover();
  }

  destroy() {
    if (this.#outsideClickHandler) {
      document.removeEventListener("mousedown", this.#outsideClickHandler);
    }
    this.triggerElement.remove();
    this.popoverElement.remove();
  }

  #buildDom() {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "block-toolbar-trigger";
    trigger.setAttribute("aria-label", "Block toolbar trigger");
    trigger.innerHTML = plusSvg;
    trigger.style.cssText = `position: absolute; top: ${OFFSCREEN}px; left: ${OFFSCREEN}px; display: none;`;
    trigger.addEventListener("mousedown", (e) => e.preventDefault());
    trigger.addEventListener("click", () => {
      if (this.isOpen) {
        this.#closePopover();
      } else {
        this.#openPopover();
      }
    });

    const popover = document.createElement("div");
    popover.className = "block-toolbar-popover";
    popover.style.cssText = `position: absolute; top: ${OFFSCREEN}px; left: ${OFFSCREEN}px; display: none;`;

    if (!this.disableImage) {
      // File input for image upload
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target.result === "string") {
            this.editor.dispatchCommand(INSERT_IMAGE_COMMAND, event.target.result);
          }
        };
        reader.readAsDataURL(file);
        fileInput.value = ""; // Reset input
      });
      document.body.appendChild(fileInput);

      const imageBtn = this.#createButton(
        photoSvg,
        "Insert image",
        () => {
          this.#closePopover();
          fileInput.click();
        }
      );
      popover.appendChild(imageBtn);
    }

    const dividerBtn = this.#createButton(
      lineDashedSvg,
      "Insert horizontal divider",
      () => {
        this.editor.dispatchCommand(INSERT_HORIZONTAL_DIVIDER_COMMAND, undefined);
        this.#closePopover();
      }
    );
    popover.appendChild(dividerBtn);

    const codeBtn = this.#createButton(
      codeSvg,
      "Insert code block",
      () => {
        this.editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined);
        this.#closePopover();
      }
    );
    popover.appendChild(codeBtn);

    document.body.appendChild(trigger);
    document.body.appendChild(popover);

    this.triggerElement = trigger;
    this.popoverElement = popover;
  }

  #createButton(svg, label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "block-toolbar-button";
    btn.setAttribute("aria-label", label);
    btn.innerHTML = svg;
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", onClick);
    return btn;
  }

  #openPopover() {
    this.isOpen = true;
    this.triggerElement.setAttribute("data-open", "");
    this.popoverElement.style.display = "flex";
    this.#positionPopover();

    requestAnimationFrame(() => {
      this.popoverElement.classList.add("visible");
    });

    this.#outsideClickHandler = (e) => {
      if (
        !this.triggerElement.contains(e.target) &&
        !this.popoverElement.contains(e.target)
      ) {
        this.#closePopover();
      }
    };
    document.addEventListener("mousedown", this.#outsideClickHandler);
  }

  #closePopover() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.triggerElement.removeAttribute("data-open");
    this.popoverElement.classList.remove("visible");

    setTimeout(() => {
      if (!this.isOpen) {
        this.popoverElement.style.display = "none";
      }
    }, 200);

    if (this.#outsideClickHandler) {
      document.removeEventListener("mousedown", this.#outsideClickHandler);
      this.#outsideClickHandler = null;
    }
  }

  #positionPopover() {
    const triggerRect = this.triggerElement.getBoundingClientRect();
    const { height } = this.popoverElement.getBoundingClientRect();

    const popoverX = triggerRect.right + this.gap;
    const popoverY =
      triggerRect.top + window.scrollY + triggerRect.height / 2 - height / 2;

    this.popoverElement.style.left = `${popoverX}px`;
    this.popoverElement.style.top = `${popoverY}px`;
  }
}
