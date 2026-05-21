import './editor_styles.css'
import './styles.css'
import initializeEditor from './editor.js';

const editorRef = document.getElementById('lexical-editor');

initializeEditor(editorRef)