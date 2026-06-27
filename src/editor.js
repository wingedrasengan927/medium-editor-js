import {
	buildEditorFromExtensions,
	INSERT_HORIZONTAL_RULE_COMMAND,
	TabIndentationExtension,
} from "@lexical/extension";
import { HistoryExtension } from "@lexical/history";
import { RichTextExtension } from "@lexical/rich-text";
import { HorizontalRuleExtension } from "@lexical/extension";
import ModifyFirstHeadingExtension from "./extensions/ModifyFirstHeadingExtension";
import { MarkdownExtension } from "./extensions/MarkdownExtension";
import { ListExtension } from "@lexical/list";
import { LinkExtension } from "@lexical/link";
import { CodeExtension } from "@lexical/code-core";
import { CodeShikiExtension } from "@lexical/code-shiki";
import { CodeMenuExtension } from "./extensions/CodeMenuExtension";
import { MathExtension } from "./extensions/MathExtension";
import { ImageExtension } from "./extensions/ImageExtension";
import { InlineToolbarExtension } from "./extensions/InlineToolbarExtension";
import { BlockToolbarExtension } from "./extensions/BlockToolbarExtension";
import defaultEditorTheme from "./editorTheme";

import { $getRoot } from "lexical";

export default function initializeEditor(editorRef) {
	const editor = buildEditorFromExtensions({
		name: "[root]",
		namespace: "Medium Editor",
		dependencies: [
			RichTextExtension,
			HistoryExtension,
			ModifyFirstHeadingExtension,
			TabIndentationExtension,
			HorizontalRuleExtension,
			LinkExtension,
			ListExtension,
			CodeExtension,
			CodeShikiExtension,
			CodeMenuExtension,
			MathExtension,
			ImageExtension,
			InlineToolbarExtension,
			BlockToolbarExtension,
			MarkdownExtension,
		],
		theme: defaultEditorTheme,
	});

	editor.setRootElement(editorRef);
	return editor;
}
