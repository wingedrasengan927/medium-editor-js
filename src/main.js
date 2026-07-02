import "./editor_style.css";
import "./style.css";
import initializeEditor from "./editor.js";
import { setupNavbar } from "./navbar.js";

const editorRef = document.getElementById("lexical-editor");
const editor = initializeEditor(editorRef);

setupNavbar(editor);
