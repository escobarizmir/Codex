import {
	wrapItem, blockTypeItem, Dropdown, DropdownSubmenu, joinUpItem, liftItem,
	selectParentNodeItem, undoItem, redoItem, icons, MenuItem
} from "prosemirror-menu";
import { NodeSelection } from "prosemirror-state";
import {setBlockType, toggleMark} from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";
import { TextField, openPrompt } from "./prompt";
import { schema } from "./schema";
import { LANGUAGES } from "./languages";

// Helpers to create specific types of items

function canInsert(state, nodeType) {
	const $from = state.selection.$from;
	for (let d = $from.depth; d >= 0; d--) {
		const index = $from.index(d);
		if ($from.node(d).canReplaceWith(index, index, nodeType)) return true;
	}
	return false;
}

function insertImageItem(nodeType) {
	return new MenuItem({
		title: "Insert image",
		label: "Image",
		enable(state) { return canInsert(state, nodeType); },
		run(state, _, view) {
			const { from, to } = state.selection;
			let attrs = null;
			if (state.selection instanceof NodeSelection && state.selection.node.type == nodeType)
				attrs = state.selection.node.attrs;
			openPrompt({
				title: "Insert image",
				fields: {
					src: new TextField({ label: "Location", required: true, value: attrs && attrs.src }),
					title: new TextField({ label: "Title", value: attrs && attrs.title }),
					alt: new TextField({
						label: "Description",
						value: attrs ? attrs.alt : state.doc.textBetween(from, to, " ")
					})
				},
				callback(attrs) {
					view.dispatch(view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs)));
					view.focus();
				}
			});
		}
	});
}

function cmdItem(cmd, options) {
	const passedOptions = {
		label: options.title,
		run: cmd
	};
	for (const prop in options) passedOptions[prop] = options[prop];
	if ((!options.enable || options.enable === true) && !options.select)
		passedOptions[options.enable ? "enable" : "select"] = state => cmd(state);

	return new MenuItem(passedOptions);
}

function markActive(state, type) {
	const { from, $from, to, empty } = state.selection;
	if (empty) return type.isInSet(state.storedMarks || $from.marks());
	else return state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
	const passedOptions = {
		active(state) { return markActive(state, markType); },
		enable: true
	};
	for (const prop in options) passedOptions[prop] = options[prop];
	return cmdItem(toggleMark(markType), passedOptions);
}

function linkItem(markType) {
	return new MenuItem({
		title: "Add or remove link",
		icon: icons.link,
		active(state) { return markActive(state, markType); },
		enable(state) { return !state.selection.empty; },
		run(state, dispatch, view) {
			if (markActive(state, markType)) {
				toggleMark(markType)(state, dispatch);
				return true;
			}
			openPrompt({
				title: "Create a link",
				fields: {
					href: new TextField({
						label: "Link target",
						required: true
					}),
					title: new TextField({ label: "Title" })
				},
				callback(attrs) {
					toggleMark(markType, attrs)(view.state, view.dispatch);
					view.focus();
				}
			});
		}
	});
}

function wrapListItem(nodeType, options) {
	return cmdItem(wrapInList(nodeType, options.attrs), options);
}

/**
 * @param {string} language
 */
function makeCodeBlock(language) {

	return function (state, dispatch) {
		if (state.selection.empty) {
			setBlockType(state.schema.nodes.code_block, { params: language })(state, dispatch);
			return true;
		}
		else {
			const range = state.selection.$from.blockRange(state.selection.$to);
			let content = "";
			state.doc.nodesBetween(state.selection.from, state.selection.to, (node) => {
				if (node.text) {
					content += node.text + "\n";
				}
			});

			if (content !== "") {
				const node = state.schema.node(state.schema.nodes.code_block, { params: language }, [state.schema.text(content)]);

				const tr = state.tr.replaceRangeWith(range.start, range.end, node);

				if (dispatch) {
					dispatch(tr);
					return true;
				}
			}
			return false;
		}
	};
}

export function buildMenuItems() {
	const r = {};
	let type;
	if (type = schema.marks.strong)
		r.toggleStrong = markItem(type, { title: "Toggle strong style", icon: icons.strong });
	if (type = schema.marks.em)
		r.toggleEm = markItem(type, { title: "Toggle emphasis", icon: icons.em });
	if (type = schema.marks.code)
		r.toggleCode = markItem(type, { title: "Toggle code font", icon: icons.code });
	if (type = schema.marks.link)
		r.toggleLink = linkItem(type);

	if (type = schema.nodes.image)
		r.insertImage = insertImageItem(type);
	if (type = schema.nodes.bullet_list)
		r.wrapBulletList = wrapListItem(type, {
			title: "Wrap in bullet list",
			icon: icons.bulletList
		});
	if (type = schema.nodes.ordered_list)
		r.wrapOrderedList = wrapListItem(type, {
			title: "Wrap in ordered list",
			icon: icons.orderedList
		});
	if (type = schema.nodes.blockquote)
		r.wrapBlockQuote = wrapItem(type, {
			title: "Wrap in block quote",
			icon: icons.blockquote
		});
	if (type = schema.nodes.paragraph)
		r.makeParagraph = blockTypeItem(type, {
			title: "Change to paragraph",
			label: "Plain"
		});
	if (type = schema.nodes.code_block)
		r.makeCodeBlock = blockTypeItem(type, {
			title: "Change to code block",
			label: "Code"
		});
	if (type = schema.nodes.heading)
		for (let i = 1; i <= 10; i++)
			r["makeHead" + i] = blockTypeItem(type, {
				title: "Change to heading " + i,
				label: "Level " + i,
				attrs: { level: i }
			});
	if (type = schema.nodes.horizontal_rule) {
		const hr = type;
		r.insertHorizontalRule = new MenuItem({
			title: "Insert horizontal rule",
			label: "Horizontal rule",
			enable(state) { return canInsert(state, hr); },
			run(state, dispatch) { dispatch(state.tr.replaceSelectionWith(hr.create())); }
		});
	}

	const languageMenu1 = [];
	const languageMenu2 = [];
	const languageMenu3 = [];
	
	for (const lang in LANGUAGES) {
		if (LANGUAGES[lang].charAt(0).toLowerCase() <= "g") {
			languageMenu1.push(blockTypeItem(schema.nodes.code_block, {
				title: `Change to ${LANGUAGES[lang]} code block`,
				label: LANGUAGES[lang],
				attrs: { params: lang },
				run: makeCodeBlock(lang)
			}));
		}
		else if (LANGUAGES[lang].charAt(0).toLowerCase() <= "m") {
			languageMenu2.push(blockTypeItem(schema.nodes.code_block, {
				title: `Change to ${LANGUAGES[lang]} code block`,
				label: LANGUAGES[lang],
				attrs: { params: lang },
				run: makeCodeBlock(lang)
			}));
		}
		else {
			languageMenu3.push(blockTypeItem(schema.nodes.code_block, {
				title: `Change to ${LANGUAGES[lang]} code block`,
				label: LANGUAGES[lang],
				attrs: { params: lang },
				run: makeCodeBlock(lang)
			}));
		}
	}

	const cut = arr => arr.filter(x => x);

	const codeMenu1 = new DropdownSubmenu(languageMenu1, { label: "Code (A-G)" });
	const codeMenu2 = new DropdownSubmenu(languageMenu2, { label: "Code (H-M)" });
	const codeMenu3 = new DropdownSubmenu(languageMenu3, { label: "Code (N-Z)" });

	r.insertMenu = new Dropdown(cut([r.insertImage, r.insertHorizontalRule]), { label: "Insert" });
	r.typeMenu = new Dropdown(cut([r.makeParagraph, codeMenu1, codeMenu2, codeMenu3, r.makeHead1 && new DropdownSubmenu(cut([
		r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
	]), { label: "Heading" })]), { label: "Type..." });

	r.inlineMenu = [cut([r.toggleStrong, r.toggleEm, r.toggleCode, r.toggleLink])];
	r.blockMenu = [cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote, joinUpItem,
		liftItem, selectParentNodeItem])];
	r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], [[undoItem, redoItem]], r.blockMenu);

	return r;
}