import { icons } from "./icons.js";
import { OFFSCREEN_POSITION } from "./utils.js";
import { TOGGLE_LINK_COMMAND } from "../../extensions/InlineToolbarExtension.js";

import "./styles/LinkToolbar.css";

export class LinkToolbar {
	constructor(editor, { onClose }) {
		this.editor = editor;
		this.onClose = onClose;
		this.#buildDom();
	}

	show(existingLinkURL, width) {
		this.input.value = existingLinkURL || "";
		this.element.style.width = `${width}px`;
		this.element.style.display = "flex";
		this.input.focus();
		this.input.select();
	}

	hide() {
		this.element.style.display = "none";
	}

	destroy() {
		this.element.remove();
	}

	#submit() {
		const value = this.input.value.trim();
		const url = value === "" ? null : value;
		this.editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
		this.editor.focus();
		this.onClose?.();
	}

	#cancel() {
		this.editor.focus();
		this.onClose?.();
	}

	#buildDom() {
		const toolbar = document.createElement("div");
		toolbar.id = "link-toolbar";
		toolbar.style.top = `${OFFSCREEN_POSITION}px`;
		toolbar.style.left = `${OFFSCREEN_POSITION}px`;
		toolbar.style.display = "none";

		const field = document.createElement("div");
		field.className = "toolbar-textfield";
		const input = document.createElement("input");
		input.type = "text";
		input.className = "toolbar-input";
		input.placeholder = "Enter Link";
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				this.#submit();
			} else if (e.key === "Escape") {
				e.preventDefault();
				this.#cancel();
			}
		});
		field.append(input);
		this.input = input;

		const group = document.createElement("div");
		group.className = "toolbar-group";

		const checkBtn = createBtn(icons.check, () => this.#submit());
		const cancelBtn = createBtn(icons.x, () => this.#cancel());
		group.append(checkBtn, cancelBtn);

		const pointer = document.createElement("div");
		pointer.className = "inline-toolbar-pointer";

		toolbar.append(field, group, pointer);
		document.body.appendChild(toolbar);
		this.element = toolbar;
	}
}

function createBtn(svg, onClick) {
	const b = document.createElement("button");
	b.type = "button";
	b.className = "toolbar-button";
	b.innerHTML = svg;
	b.addEventListener("mousedown", (e) => e.preventDefault());
	b.addEventListener("click", onClick);
	return b;
}
