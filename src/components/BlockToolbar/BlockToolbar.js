import plusSvg from "@tabler/icons/outline/plus.svg?raw";
import lineDashedSvg from "@tabler/icons/outline/line-dashed.svg?raw";
import { INSERT_HORIZONTAL_DIVIDER_COMMAND } from "../../plugins/BlockToolbarPlugin.js";
import "./styles/Popover.css";

const OFFSCREEN = -1000;

export class BlockToolbar {
  #outsideClickHandler = null;

  constructor(editor, gap = 8) {
    this.editor = editor;
    this.gap = gap;
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

    const dividerBtn = this.#createButton(
      lineDashedSvg,
      "Insert horizontal divider",
      () => {
        this.editor.dispatchCommand(INSERT_HORIZONTAL_DIVIDER_COMMAND, undefined);
        this.#closePopover();
      }
    );
    popover.appendChild(dividerBtn);

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
