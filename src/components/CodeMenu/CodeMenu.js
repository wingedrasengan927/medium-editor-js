import "./CodeMenu.css";
import { $getNodeByKey } from "lexical";

const DEFAULT_LANGUAGES = [
	"javascript",
	"typescript",
	"html",
	"css",
	"json",
	"markdown",
	"python",
	"java",
	"c",
	"cpp",
	"rust",
	"go",
	"sql",
	"latex",
	"bash",
	"plaintext",
];

const DEFAULT_THEMES = [
	"github-dark",
	"github-light",
	"poimandres",
	"dracula",
	"one-light",
	"one-dark-pro",
	"nord",
	"min-light",
	"min-dark",
];

const caretDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;

export class CodeMenu {
	constructor(editor, config = {}) {
		this.editor = editor;
		this.languages = config.languages || DEFAULT_LANGUAGES;
		this.themes = config.themes || DEFAULT_THEMES;
		this.codeNodeKey = null;
		this.isVisible = false;

		this.languageCommand = config.setLanguageCommand;
		this.themeCommand = config.setThemeCommand;

		this.#buildDom();
	}

	show(x, y, nodeKey) {
		const wasVisible = this.isVisible;
		this.codeNodeKey = nodeKey;
		this.isVisible = true;

		if (!wasVisible) {
			this.element.style.display = "flex";
		}

		this.editor.read(() => {
			const node = $getNodeByKey(nodeKey);
			if (node) {
				const lang = node.getLanguage() || "plaintext";
				const theme = node.getTheme() || "github-dark";
				this.langBtnText.textContent = lang;
				this.themeBtnText.textContent = theme;
			}
		});

		const applyPosition = () => {
			const HORIZONTAL_OFFSET = 16;
			const VERTICAL_OFFSET = 12;
			const width = this.element.offsetWidth;

			const finalX = x - width - HORIZONTAL_OFFSET;
			const finalY = y + VERTICAL_OFFSET;

			this.element.style.left = `${finalX}px`;
			this.element.style.top = `${finalY}px`;

			if (this.isVisible && !this.element.classList.contains("visible")) {
				this.element.classList.add("visible");
			}
		};

		if (!wasVisible) {
			// Wait a tick for DOM to measure width accurately when first appearing
			setTimeout(applyPosition, 0);
		} else {
			// Apply synchronously to prevent flickering while typing
			applyPosition();
		}
	}

	hide() {
		this.element.style.display = "none";
		this.element.classList.remove("visible");
		this.isVisible = false;
		this.codeNodeKey = null;
		this.#closePopovers();
	}

	destroy() {
		this.element.remove();
		document.removeEventListener("mousedown", this.outsideClickHandler);
	}

	#buildDom() {
		this.element = document.createElement("div");
		this.element.className = "code-menu-container";
		this.element.id = "code-highlight-menu";

		// Language Dropdown
		const langDropdown = this.#createDropdown(
			this.languages,
			"Language",
			(val) => {
				this.editor.dispatchCommand(this.languageCommand, [
					this.codeNodeKey,
					val,
				]);
				this.langBtnText.textContent = val;

				// Take the focus from the dropdown, and put it back into the editor
				setTimeout(() => this.editor.focus(), 10);
			},
		);
		this.langBtnText = langDropdown.btnText;

		// Theme Dropdown
		const themeDropdown = this.#createDropdown(
			this.themes,
			"Theme",
			(val) => {
				this.editor.dispatchCommand(this.themeCommand, [
					this.codeNodeKey,
					val,
				]);
				this.themeBtnText.textContent = val;
				setTimeout(() => this.editor.focus(), 10);
			},
		);
		this.themeBtnText = themeDropdown.btnText;

		this.element.appendChild(langDropdown.container);
		this.element.appendChild(themeDropdown.container);

		document.body.appendChild(this.element);

		this.outsideClickHandler = (e) => {
			if (!this.element.contains(e.target)) {
				this.#closePopovers();
			}
		};
		document.addEventListener("mousedown", this.outsideClickHandler);
	}

	#createDropdown(options, placeholder, onSelect) {
		const container = document.createElement("div");
		container.className = "code-menu-dropdown";

		const button = document.createElement("button");
		button.type = "button";
		button.className = "code-menu-button";

		const btnText = document.createElement("span");
		btnText.textContent = placeholder;
		button.appendChild(btnText);

		button.addEventListener("mousedown", (e) => {
			e.preventDefault(); // Prevent focus loss
		});

		const icon = document.createElement("div");
		icon.innerHTML = caretDownSvg;
		button.appendChild(icon);

		const popover = document.createElement("div");
		popover.className = "code-menu-popover";

		const searchContainer = document.createElement("div");
		searchContainer.className = "code-menu-search";
		const searchInput = document.createElement("input");
		searchInput.type = "text";
		searchInput.placeholder = `Search ${placeholder.toLowerCase()}...`;
		searchContainer.appendChild(searchInput);

		const optionsContainer = document.createElement("div");
		optionsContainer.className = "code-menu-options";

		const renderOptions = (filter = "") => {
			optionsContainer.innerHTML = "";
			const filtered = options.filter((opt) =>
				opt.toLowerCase().includes(filter.toLowerCase()),
			);
			filtered.forEach((opt) => {
				const item = document.createElement("div");
				item.className = "code-menu-option";
				item.textContent = opt;
				item.addEventListener("mousedown", (e) => {
					e.preventDefault(); // Prevent focus loss
				});
				item.addEventListener("click", () => {
					onSelect(opt);
					popover.classList.remove("open");
				});
				optionsContainer.appendChild(item);
			});
		};

		renderOptions();

		searchInput.addEventListener("input", (e) => {
			renderOptions(e.target.value);
		});

		button.addEventListener("click", (e) => {
			e.stopPropagation();
			const isOpen = popover.classList.contains("open");
			this.#closePopovers();
			if (!isOpen) {
				popover.classList.add("open");
				searchInput.value = "";
				renderOptions();
				setTimeout(() => searchInput.focus(), 10);
			}
		});

		popover.appendChild(searchContainer);
		popover.appendChild(optionsContainer);
		container.appendChild(button);
		container.appendChild(popover);

		return { container, btnText, popover };
	}

	#closePopovers() {
		const popovers = this.element.querySelectorAll(
			".code-menu-popover.open",
		);
		popovers.forEach((p) => p.classList.remove("open"));
	}
}
