import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import {baseKeymap, setBlockType} from "prosemirror-commands";
import { EditorState, Plugin } from "prosemirror-state";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { menuBar } from "./menubar";
import { buildMenuItems } from "./menu";
import { buildInputRules } from "./inputrules";
import { LANGUAGES } from "./languages";
import { schema } from "./schema";
import { highlightPlugin } from "prosemirror-highlightjs";
import hljs from "highlight.js";

/**
 * @param {EditorState} state
 */
function isCursorInCodeBlock(state) {
    state.doc.nodesBetween(state.selection.from, state.selection.to, (node) => {
        if (node.type === schema.nodes["code_block"]) {
            return true;
        }
    });
    return false;
}

/**
 * @param {number} tabSize
 */
export function prosemirrorSetup(tabSize) {

	const plugins = [
		buildInputRules(schema),
		keymap(baseKeymap),
		dropCursor(),
		gapCursor(),
		highlightPlugin(hljs)
	];

	plugins.push(menuBar({
		floating: true,
		content: buildMenuItems().fullMenu
	}));
	plugins.push(history());

	return plugins.concat(new Plugin({
		props: {
			attributes: { class: "ProseMirror-example-setup-style" }
		}
	}));
}

export { schema };