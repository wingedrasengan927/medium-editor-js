import {
	$getSelection,
	$isRangeSelection,
	$getCharacterOffsets,
	FORMAT_TEXT_COMMAND,
} from "lexical";
import { createDOMRange } from "@lexical/selection";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { $findMatchingParent } from "@lexical/utils";
import {
	computeInlineToolbarPosition,
	getBoundingRectCoords,
	OFFSCREEN_POSITION,
} from "./utils.js";
import { icons } from "./icons.js";
import { LinkToolbar } from "./LinkToolbar.js";
import {
	TOGGLE_HEADING_COMMAND,
	TOGGLE_QUOTE_COMMAND,
	getLinkAtSelection,
} from "../../extensions/InlineToolbarExtension.js";

import "./styles/Toolbar.css";

function fetchTagIfHeadingNode(node) {
	const headingNode = $findMatchingParent(node, $isHeadingNode);
	return headingNode ? headingNode.getTag() : null;
}

function updateToolbarHeadingState(selection) {
	const result = {
		isHeadingOne: false,
		isHeadingTwo: false,
		isHeadingThree: false,
	};

	const nodes = selection.getNodes();
	if (!nodes.length) return result;

	const headingTag = fetchTagIfHeadingNode(nodes[0]);
	if (!headingTag) return result;

	const allMatch = nodes.every(
		(node) => fetchTagIfHeadingNode(node) === headingTag,
	);
	if (!allMatch) return result;

	const key = {
		h1: "isHeadingOne",
		h2: "isHeadingTwo",
		h3: "isHeadingThree",
	}[headingTag];
	if (key) result[key] = true;
	return result;
}

function updateToolbarQuoteState(selection) {
	const nodes = selection.getNodes();
	if (!nodes.length) return false;
	return nodes.every((node) => $findMatchingParent(node, $isQuoteNode));
}

const TOP_OFFSET = 16;

export class InlineToolbar {
	#unregister;

	constructor(editor) {
		this.editor = editor;
		this.state = {
			isBold: false,
			isItalic: false,
			isCode: false,
			isHeadingOne: false,
			isHeadingTwo: false,
			isHeadingThree: false,
			isQuote: false,
		};
		this.existingLinkURL = "";
		this.isLinkMode = false;
		this.isVisible = false;

		this.#buildDom();

		this.linkToolbar = new LinkToolbar(editor, {
			onClose: () => this.hide(),
		});

		this.#unregister = editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				const selection = $getSelection();
				this.#updateStateFromSelection(selection);
			});
		});

		editor.read(() => {
			const selection = $getSelection();
			this.#updateStateFromSelection(selection);
		});
	}

	show() {
		if (this.isLinkMode) this.#exitLinkMode();
		this.element.style.display = "flex";
		this.isVisible = true;
		this.#updatePositionFromSelection();
		setTimeout(() => {
			if (this.isVisible) this.element.classList.add("visible");
		}, 50);
	}

	hide() {
		this.element.style.display = "none";
		this.element.classList.remove("visible");
		this.isVisible = false;
		if (this.isLinkMode) this.#exitLinkMode();
	}

	destroy() {
		this.#unregister?.();
		this.element.remove();
		this.linkToolbar.destroy();
	}

	#buildDom() {
		const toolbar = document.createElement("div");
		toolbar.id = "inline-toolbar";
		toolbar.style.top = `${OFFSCREEN_POSITION}px`;
		toolbar.style.left = `${OFFSCREEN_POSITION}px`;
		toolbar.style.display = "none";

		const styleGroup = createGroup();
		this.boldBtn = createToggleBtn(icons.bold, () =>
			this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold"),
		);
		this.italicBtn = createToggleBtn(icons.italic, () =>
			this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic"),
		);
		this.codeBtn = createToggleBtn(icons.code, () =>
			this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code"),
		);
		styleGroup.append(this.boldBtn, this.italicBtn, this.codeBtn);

		const blockGroup = createGroup();
		this.headingBtn = createToggleBtn(icons.textSize, () =>
			this.editor.dispatchCommand(TOGGLE_HEADING_COMMAND, this.state),
		);
		this.quoteBtn = createToggleBtn(icons.blockquote, () =>
			this.editor.dispatchCommand(TOGGLE_QUOTE_COMMAND, this.state),
		);
		blockGroup.append(this.headingBtn, this.quoteBtn);

		const linkGroup = createGroup();
		this.linkBtn = createBtn(icons.link, () => this.#enterLinkMode());
		linkGroup.append(this.linkBtn);

		const pointer = document.createElement("div");
		pointer.className = "inline-toolbar-pointer";

		toolbar.append(
			styleGroup,
			createSeparator(),
			blockGroup,
			createSeparator(),
			linkGroup,
			pointer,
		);

		document.body.appendChild(toolbar);
		this.element = toolbar;
	}

	#updateStateFromSelection(selection) {
		if (!$isRangeSelection(selection)) return;

		const headingState = updateToolbarHeadingState(selection);
		this.state = {
			isBold: selection.hasFormat("bold"),
			isItalic: selection.hasFormat("italic"),
			isCode: selection.hasFormat("code"),
			isQuote: updateToolbarQuoteState(selection),
			...headingState,
		};
		const linkNode = getLinkAtSelection(selection);
		this.existingLinkURL = linkNode ? linkNode.getURL() : "";

		this.#renderState();

		if (this.isVisible) this.#updatePositionFromSelection();
	}

	#renderState() {
		const {
			isBold,
			isItalic,
			isCode,
			isQuote,
			isHeadingOne,
			isHeadingTwo,
			isHeadingThree,
		} = this.state;
		const isAnyHeading = isHeadingOne || isHeadingTwo || isHeadingThree;

		setAttr(this.boldBtn, "data-selected", isBold);
		setAttr(this.boldBtn, "data-disabled", isCode || isAnyHeading);

		setAttr(this.italicBtn, "data-selected", isItalic);
		setAttr(this.italicBtn, "data-disabled", isCode || isHeadingOne);

		setAttr(this.codeBtn, "data-selected", isCode);
		setAttr(this.codeBtn, "data-disabled", isHeadingOne);

		setAttr(this.headingBtn, "data-selected", isAnyHeading);
		setAttr(this.quoteBtn, "data-selected", isQuote);
		setAttr(this.linkBtn, "data-disabled", isHeadingOne);
	}

	#getSelectionCoords(selection) {
		if (!$isRangeSelection(selection)) return null;

		const [anchorPoint, focusPoint] = selection.getStartEndPoints();
		const anchorNode = anchorPoint.getNode();
		const focusNode = focusPoint.getNode();
		const [anchorOffset, focusOffset] = $getCharacterOffsets(selection);
		const range = createDOMRange(
			this.editor,
			anchorNode,
			anchorOffset,
			focusNode,
			focusOffset,
		);

		return getBoundingRectCoords(range);
	}

	#updatePositionFromSelection() {
		this.editor.read(() => {
			const selection = $getSelection();
			const coords = this.#getSelectionCoords(selection);
			if (!coords) return;

			const target = this.isLinkMode
				? this.linkToolbar.element
				: this.element;
			const pos = computeInlineToolbarPosition(
				coords,
				target,
				TOP_OFFSET,
			);
			target.style.top = `${pos.y}px`;
			target.style.left = `${pos.x}px`;
		});
	}

	#enterLinkMode() {
		this.isLinkMode = true;
		const width = this.element.getBoundingClientRect().width;

		let coords = null;
		this.editor.read(() => {
			const selection = $getSelection();
			coords = this.#getSelectionCoords(selection);
		});

		this.element.style.display = "none";
		this.element.classList.remove("visible");
		this.linkToolbar.show(this.existingLinkURL, width);

		if (coords) {
			const target = this.linkToolbar.element;
			const pos = computeInlineToolbarPosition(
				coords,
				target,
				TOP_OFFSET,
			);
			target.style.top = `${pos.y}px`;
			target.style.left = `${pos.x}px`;
		}
	}

	#exitLinkMode() {
		this.isLinkMode = false;
		this.linkToolbar.hide();
	}
}

function createGroup() {
	const g = document.createElement("div");
	g.className = "toolbar-group";
	return g;
}

function createSeparator() {
	const s = document.createElement("div");
	s.className = "toolbar-separator";
	return s;
}

function createBtn(svg, onClick) {
	const b = document.createElement("button");
	b.type = "button";
	b.className = "toolbar-button";
	b.innerHTML = svg;
	b.addEventListener("mousedown", (e) => e.preventDefault());
	b.addEventListener("click", () => {
		if (b.hasAttribute("data-disabled")) return;
		onClick();
	});
	return b;
}

function createToggleBtn(svg, onClick) {
	const b = document.createElement("button");
	b.type = "button";
	b.className = "toolbar-toggle";
	b.innerHTML = svg;
	b.addEventListener("mousedown", (e) => e.preventDefault());
	b.addEventListener("click", () => {
		if (b.hasAttribute("data-disabled")) return;
		onClick();
	});
	return b;
}

function setAttr(el, attr, present) {
	if (present) el.setAttribute(attr, "true");
	else el.removeAttribute(attr);
}
