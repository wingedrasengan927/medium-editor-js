import plusSvg from "@tabler/icons/outline/plus.svg?raw";
import lineDashedSvg from "@tabler/icons/outline/line-dashed.svg?raw";
import photoSvg from "@tabler/icons/outline/photo.svg?raw";
import codeSvg from "@tabler/icons/outline/code.svg?raw";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/extension";
import { INSERT_IMAGE_AT_TARGET_COMMAND } from "../../extensions/ImageExtension.js";
import { INSERT_CODE_BLOCK_AT_TARGET_COMMAND } from "../../extensions/BlockToolbarExtension.js";
import "./styles/Popover.css";

const OFFSCREEN = -1000;
const GAP = 8;

export class BlockToolbar {
	#outsideClickHandler = null;

	constructor(editor) {
		this.editor = editor;
		this.gap = GAP;
		this.isOpen = false;
		this.targetNodeKeyTrigger = null; // tracks the position where the  +  trigger button is shown
		this.targetNodeKeyPopover = null; // tracks the node key where the popover was actively opened
		this.#buildDom();
	}

	// open and position the plus button trigger
	show(x, y, targetNodeKey) {
		this.targetNodeKeyTrigger = targetNodeKey;
		this.triggerElement.style.display = "flex";
		const { width, height } = this.triggerElement.getBoundingClientRect();
		this.triggerElement.style.left = `${x - width - this.gap}px`;
		this.triggerElement.style.top = `${y - height / 2}px`;

		// isOpen: controls the popover (entire container with all the buttons) state
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
			document.removeEventListener(
				"mousedown",
				this.#outsideClickHandler,
			);
		}
		this.triggerElement.remove();
		this.popoverElement.remove();
	}

	#buildDom() {
		// Build and attach the trigger element
		const trigger = document.createElement("button");
		trigger.type = "button";
		trigger.className = "block-toolbar-trigger";
		trigger.setAttribute("aria-label", "Block toolbar trigger");
		trigger.innerHTML = plusSvg;
		trigger.style.cssText = `position: absolute; top: ${OFFSCREEN}px; left: ${OFFSCREEN}px; display: none;`;

		// Prevent the trigger button from stealing focus from the editor when clicked
		trigger.addEventListener("mousedown", (e) => e.preventDefault());

		// Toggle the popover visibility when clicking the trigger button
		trigger.addEventListener("click", () => {
			if (this.isOpen) {
				this.#closePopover();
			} else {
				this.#openPopover();
			}
		});

		// create the popover element
		const popover = document.createElement("div");
		popover.className = "block-toolbar-popover";
		popover.style.cssText = `position: absolute; top: ${OFFSCREEN}px; left: ${OFFSCREEN}px; display: none;`;

		// Create hidden file input for image uploads
		const fileInput = this.#createFileInput();
		document.body.appendChild(fileInput);

		const imageBtn = this.#createButton(photoSvg, "Insert image", () => {
			// Persist the popover's target node key for the asynchronous image insertion
			fileInput.dataset.targetNodeKey = this.targetNodeKeyPopover;
			this.#closePopover();
			fileInput.click();
		});
		popover.appendChild(imageBtn);

		const dividerBtn = this.#createButton(
			lineDashedSvg,
			"Insert horizontal divider",
			() => {
				this.editor.dispatchCommand(
					INSERT_HORIZONTAL_RULE_COMMAND,
					undefined,
				);
				this.#closePopover();
			},
		);
		popover.appendChild(dividerBtn);

		const codeBtn = this.#createButton(codeSvg, "Insert code block", () => {
			this.editor.dispatchCommand(
				INSERT_CODE_BLOCK_AT_TARGET_COMMAND,
				{ targetNodeKey: this.targetNodeKeyPopover },
			);
			this.#closePopover();
		});
		popover.appendChild(codeBtn);

		document.body.appendChild(trigger);
		document.body.appendChild(popover);

		// popover: Entire container with all the buttons
		// trigger: '+' Button
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

	#createFileInput() {
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = "image/*";
		fileInput.style.display = "none";
		fileInput.addEventListener("change", (e) => {
			const file = e.target.files[0];
			if (!file) return;
			const targetNodeKey = fileInput.dataset.targetNodeKey;
			const reader = new FileReader();
			reader.onload = (event) => {
				if (typeof event.target.result === "string") {
					this.editor.dispatchCommand(
						INSERT_IMAGE_AT_TARGET_COMMAND,
						{
							src: event.target.result,
							targetNodeKey,
						},
					);
				}
			};
			reader.readAsDataURL(file);
			fileInput.value = ""; // Reset input
		});
		return fileInput;
	}

	#openPopover() {
		this.isOpen = true;
		this.targetNodeKeyPopover = this.targetNodeKeyTrigger;
		this.triggerElement.setAttribute("data-open", "");
		this.popoverElement.style.display = "flex";
		this.#positionPopover();

		requestAnimationFrame(() => {
			this.popoverElement.classList.add("visible");
		});

		// Register an event listener when the popover is opened to close it on outside click. 
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
		this.targetNodeKeyPopover = null;
		this.triggerElement.removeAttribute("data-open");
		this.popoverElement.classList.remove("visible");

		// Add setTimeout for fade-out animation
		setTimeout(() => {
			if (!this.isOpen) {
				this.popoverElement.style.display = "none";
			}
		}, 200);

		// Destroy the listener on close
		if (this.#outsideClickHandler) {
			document.removeEventListener(
				"mousedown",
				this.#outsideClickHandler,
			);
			this.#outsideClickHandler = null;
		}
	}

	#positionPopover() {
		const triggerRect = this.triggerElement.getBoundingClientRect();
		const { height } = this.popoverElement.getBoundingClientRect();

		const popoverX = triggerRect.right + this.gap;
		const popoverY =
			triggerRect.top +
			window.scrollY +
			triggerRect.height / 2 -
			height / 2;

		this.popoverElement.style.left = `${popoverX}px`;
		this.popoverElement.style.top = `${popoverY}px`;
	}
}
