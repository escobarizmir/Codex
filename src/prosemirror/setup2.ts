import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";
import { EditorState, Plugin } from "prosemirror-state";
import { Node as ProsemirrorNode, Schema } from "prosemirror-model";
import { gapCursor } from "prosemirror-gapcursor";
import { menuBar, Dropdown } from "./menu";
import { sinkListItem, liftListItem } from "prosemirror-schema-list";
import { highlightPlugin } from "prosemirror-highlightjs";
import * as hljs from "highlight.js";
import {
	isInTable, tableEditing, goToNextCell} from "prosemirror-tables";
import { mathPlugin } from "@benrbray/prosemirror-math";

function isCursorInCodeBlock(state: EditorState) {
    state.doc.nodesBetween(state.selection.from, state.selection.to, (node, startPos) => {
        if (node.type.name == "code_block") {
            return true;
        }
    });
    return false;
}

// key = shortcut : value = full name
const LANGUAGES = {
	"arduino": "Arduino (C++)",
	"arm": "ARM Assembly",
	"bat": "Batch/DOS",
	"coffeescript": "CoffeeScript",
	"cmake": "CMake",
	"cs": "C#",
	"cpp": "C++",
	"c": "C",
	"css": "CSS",
	"go": "Go",
	"gradle": "Gradle",
	"groovy": "Groovy",
	"html": "HTML",
	"http": "HTTP",
	"java": "Java",
	"js": "JavaScript",
	"json": "JSON",
	"tex": "LaTeX",
	"less": "Less",
	"lisp": "Lisp",
	"lua": "Lua",
	"makefile": "Makefile",
	"markdown": "Markdown",
	"mathematica": "Mathematica",
	"matlab": "Matlab",
	"nim": "Nim",
	"objectivec": "Objective C",
	"ocaml": "OCaml",
	"glsl": "GLSL",
	"perl": "Perl",
	"php": "PHP",
	"ps": "PowerShell",
	"py": "Python",
	"r": "R",
	"ruby": "Ruby",
	"rust": "Rust",
	"sql": "SQL",
	"shell": "Shell",
	"swift": "Swift",
	"ts": "TypeScript",
	"x86asm": "x86 Assembly",
	"yml": "YAML",
};

function buildMenuItems(schema) {
    const r: any = {};
	let type: any;

	/* eslint-disable no-cond-assign */
    if (type = schema.marks.strong) { 
		r.toggleStrong = markItem(type, { title: "Toggle strong style", icon: prosemirrorMenu.icons.strong }); 
	}
    if (type = schema.marks.em) {
		r.toggleEm = markItem(type, { title: "Toggle emphasis", icon: prosemirrorMenu.icons.em }); 
	}
    if (type = schema.marks.code) {
		r.toggleCode = markItem(type, { title: "Toggle inline code", icon: prosemirrorMenu.icons.code });
	}
    if (type = schema.marks.link) { 
		r.toggleLink = linkItem(type);
	}
    if (type = schema.marks.underline) { 
		r.toggleUnderline = markItem(type, { title: "Toggle underline", icon: myIcons.underline }); 
	}

    if (type = schema.nodes.image) { 
		r.insertImage = insertImageItem(type); 
	}
    if (type = schema.nodes.bullet_list) {
        r.wrapBulletList = wrapListItem(type, {
            title: "Wrap in bullet list",
            icon: prosemirrorMenu.icons.bulletList
        });
    }
    if (type = schema.nodes.ordered_list) {
        r.wrapOrderedList = wrapListItem(type, {
            title: "Wrap in ordered list",
            icon: prosemirrorMenu.icons.orderedList
        });
    }
    if (type = schema.nodes.blockquote) {
        r.wrapBlockQuote = prosemirrorMenu.wrapItem(type, {
            title: "Wrap in block quote",
            icon: prosemirrorMenu.icons.blockquote
        });
    }
    if (type = schema.nodes.paragraph) {
        r.makeParagraph = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to paragraph",
            label: "Plain Text"
        });
    }
    if (type = schema.nodes.code_block) {
        r.makeCodeBlock = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to code block",
            label: "Code",
            run: makeCodeBlock("")
        });
        r.makeArduino = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Arduino code block",
            label: "Arduino (C++)",
            attrs: { params: "arduino" },
            run: makeCodeBlock("arduino")
        });
        r.makeARM = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to ARM code block",
            label: "ARM Assembly",
            attrs: { params: "arm" },
            run: makeCodeBlock("arm")
        });
        r.makeBAT = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Batch/DOS code block",
            label: "Batch/DOS",
            attrs: { params: "bat" },
            run: makeCodeBlock("bat")
        });
        r.makeCoffee = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to CoffeeScript code block",
            label: "CoffeeScript",
            attrs: { params: "coffeescript" },
            run: makeCodeBlock("coffeescript")
        });
        r.makeCmake = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to CMake code block",
            label: "CMake",
            attrs: { params: "cmake" },
            run: makeCodeBlock("cmake")
        });
        r.makeCS = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to C# code block",
            label: "C#",
            attrs: { params: "cs" },
            run: makeCodeBlock("cs")
        });
        r.makeCPP = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to C++ code block",
            label: "C++",
            attrs: { params: "cpp" },
            run: makeCodeBlock("cpp")
        });
        r.makeC = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to C code block",
            label: "C",
            attrs: { params: "c" },
            run: makeCodeBlock("c")
        });
        r.makeCSS = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to CSS code block",
            label: "CSS",
            attrs: { params: "css" },
            run: makeCodeBlock("css")
        });
        r.makeGo = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Go code block",
            label: "Go",
            attrs: { params: "go" },
            run: makeCodeBlock("go")
        });
        r.makeGradle = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Gradle code block",
            label: "Gradle",
            attrs: { params: "gradle" },
            run: makeCodeBlock("gradle")
        });
        r.makeGroovy = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Groovy code block",
            label: "Groovy",
            attrs: { params: "groovy" },
            run: makeCodeBlock("groovy")
        });
        r.makeHTML = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to HTML code block",
            label: "HTML",
            attrs: { params: "html" },
            run: makeCodeBlock("html")
        });
        r.makeHTTP = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to HTTP code block",
            label: "HTTP",
            attrs: { params: "http" },
            run: makeCodeBlock("http")
        });
        r.makeJava = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Java code block",
            label: "Java",
            attrs: { params: "java" },
            run: makeCodeBlock("java")
        });
        r.makeJS = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to JavaScript code block",
            label: "JavaScript",
            attrs: { params: "js" },
            run: makeCodeBlock("js")
        });
        r.makeJSON = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to JSON code block",
            label: "JSON",
            attrs: { params: "json" },
            run: makeCodeBlock("json")
        });
        r.makeLatex = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to LaTeX code block",
            label: "LaTeX",
            attrs: { params: "tex" },
            run: makeCodeBlock("tex")
        });
        r.makeLess = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Less code block",
            label: "Less",
            attrs: { params: "less" },
            run: makeCodeBlock("less")
        });
        r.makeLisp = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Lisp code block",
            label: "Lisp",
            attrs: { params: "lisp" },
            run: makeCodeBlock("lisp")
        });
        r.makeLua = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Lua code block",
            label: "Lua",
            attrs: { params: "lua" },
            run: makeCodeBlock("lua")
        });
        r.makeMakefile = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Makefile code block",
            label: "Makefile",
            attrs: { params: "makefile" },
            run: makeCodeBlock("makefile")
        });
        r.makeMarkdown = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Markdown code block",
            label: "Markdown",
            attrs: { params: "markdown" },
            run: makeCodeBlock("markdown")
        });
        r.makeMathematica = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Mathematica code block",
            label: "Mathematica",
            attrs: { params: "mathematica" },
            run: makeCodeBlock("mathematica")
        });
        r.makeMatlab = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Matlab code block",
            label: "Matlab",
            attrs: { params: "matlab" },
            run: makeCodeBlock("matlab")
        });
        r.makeNim = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Nim code block",
            label: "Nim",
            attrs: { params: "nim" },
            run: makeCodeBlock("nim")
        });
        r.makeObjectiveC = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Objective C code block",
            label: "Objective C",
            attrs: { params: "objectivec" },
            run: makeCodeBlock("objectivec")
        });
        r.makeOCaml = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to OCaml code block",
            label: "OCaml",
            attrs: { params: "ocaml" },
            run: makeCodeBlock("ocaml")
        });
        r.makeGLSL = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to GLSL code block",
            label: "GLSL",
            attrs: { params: "glsl" },
            run: makeCodeBlock("glsl")
        });
        r.makePerl = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Perl code block",
            label: "Perl",
            attrs: { params: "perl" },
            run: makeCodeBlock("perl")
        });
        r.makePHP = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to PHP code block",
            label: "PHP",
            attrs: { params: "php" },
            run: makeCodeBlock("php")
        });
        r.makePS = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to PowerShell code block",
            label: "PowerShell",
            attrs: { params: "ps" },
            run: makeCodeBlock("ps")
        });
        r.makePY = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Python code block",
            label: "Python",
            attrs: { params: "py" },
            run: makeCodeBlock("py")
        });
        r.makeR = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to R code block",
            label: "R",
            attrs: { params: "r" },
            run: makeCodeBlock("r")
        });
        r.makeRuby = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Ruby code block",
            label: "Ruby",
            attrs: { params: "ruby" },
            run: makeCodeBlock("ruby")
        });
        r.makeRust = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Rust code block",
            label: "Rust",
            attrs: { params: "rust" },
            run: makeCodeBlock("rust")
        });
        r.makeSQL = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to SQL code block",
            label: "SQL",
            attrs: { params: "sql" },
            run: makeCodeBlock("sql")
        });
        r.makeShell = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Shell code block",
            label: "Shell",
            attrs: { params: "shell" },
            run: makeCodeBlock("shell")
        });
        r.makeSwift = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to Swift code block",
            label: "Swift",
            attrs: { params: "swift" },
            run: makeCodeBlock("swift")
        });
        r.makeTS = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to TypeScript code block",
            label: "TypeScript",
            attrs: { params: "ts" },
            run: makeCodeBlock("ts")
        });
        r.makeX86 = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to x86 Assembly code block",
            label: "x86 Assembly",
            attrs: { params: "x86asm" },
            run: makeCodeBlock("x86asm")
        });
        r.makeYAML = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to YAML code block",
            label: "YAML",
            attrs: { params: "yml" },
            run: makeCodeBlock("yml")
        });
        r.makeOther = prosemirrorMenu.blockTypeItem(type, {
            title: "Change to code block",
            label: "Other",
            run: makeCodeBlock("")
        });
    }
    if (type = schema.nodes.heading) {
        for (var i = 1; i <= 10; i++) {
            r["makeHead" + i] = prosemirrorMenu.blockTypeItem(type, {
                title: "Change to heading " + i,
                label: "Level " + i,
                attrs: { level: i }
            });
        }

    }
    if (type = schema.nodes.horizontal_rule) {
        var hr = type;
        r.insertHorizontalRule = new prosemirrorMenu.MenuItem({
            title: "Insert horizontal rule",
            label: "Horizontal rule",
            enable: function enable(state) { return (canInsert(state, hr) && !isInTable(state) && !isCursorInCodeBlock(state)) },
            run: function run(state, dispatch) {
                if (!isInTable(state) && !isCursorInCodeBlock(state))
                    dispatch(state.tr.replaceSelectionWith(hr.create()));
            }
        });
    }

    if (type = schema.nodes.table) {
        r.insertTable = new prosemirrorMenu.MenuItem({
            label: "Table",
            run: insertTable,
            enable: function enable(state) {
                return !isInTable(state) && !isCursorInCodeBlock(state);
            }
        });
    }

    r.alignLeft = new prosemirrorMenu.MenuItem({
        title: "Align text to left",
        icon: myIcons.leftAlign,
        run: alignSelection("left"),
        enable: function enable(state) {
            return !isCursorInCodeBlock(state);
        }
    });
    r.alignCenter = new prosemirrorMenu.MenuItem({
        title: "Align text to center",
        icon: myIcons.centerAlign,
        run: alignSelection("center"),
        enable: function enable(state) {
            return !isCursorInCodeBlock(state);
        }
    });
    r.alignRight = new prosemirrorMenu.MenuItem({
        title: "Align text to right",
        icon: myIcons.rightAlign,
        run: alignSelection("right"),
        enable: function enable(state) {
            return !isCursorInCodeBlock(state);
        }
    });

    r.InsertBlockEquation = new prosemirrorMenu.MenuItem({
        title: "Insert block KaTeX equation",
        label: "Block KaTeX equation",
        run: insertMathCmd(schema.nodes.math_display),
        enable: function enable(state) {
            return !isCursorInCodeBlock(state);
        }
    });

    r.InsertInlineEquation = new prosemirrorMenu.MenuItem({
        title: "Insert inline KaTeX equation",
        label: "Inline KaTeX equation",
        run: insertMathCmd(schema.nodes.math_inline),
        enable: function enable(state) {
            return !isCursorInCodeBlock(state);
        }
    });

    var cut = function (arr) { return arr.filter(function (x) { return x; }); };
    r.insertMenu = new prosemirrorMenu.Dropdown(cut([r.insertImage, r.insertHorizontalRule, r.insertTable/*, r.InsertInlineEquation, r.InsertBlockEquation*/]), { label: "Insert" });
    r.typeMenu = new prosemirrorMenu.Dropdown(cut([r.makeParagraph,
    r.makeCodeBlock && new prosemirrorMenu.DropdownSubmenu(cut([
        r.makeArduino, r.makeARM, r.makeBAT, r.makeCoffee, r.makeCmake, r.makeCS, r.makeCPP, r.makeC, r.makeCSS, r.makeGo, r.makeGLSL, r.makeGradle, r.makeGroovy, r.makeOther
    ]), { label: "Code (A-G)" }),
    r.makeCodeBlock && new prosemirrorMenu.DropdownSubmenu(cut([
        r.makeHTML, r.makeHTTP, r.makeJava, r.makeJS, r.makeJSON, r.makeLatex, r.makeLess, r.makeLisp, r.makeLua, r.makeMakefile, r.makeMarkdown, r.makeMathematica, r.makeMatlab, r.makeOther
    ]), { label: "Code (H-M)" }),
    r.makeCodeBlock && new prosemirrorMenu.DropdownSubmenu(cut([
        r.makeNim, r.makeObjectiveC, r.makeOCaml, r.makePerl, r.makePHP, r.makePS, r.makePY, r.makeR, r.makeRuby, r.makeRust, r.makeSQL, r.makeShell, r.makeSwift, r.makeTS, r.makeX86, r.makeYAML, r.makeOther
    ]), { label: "Code (N-Z)" })
        , r.makeHead1 && new prosemirrorMenu.DropdownSubmenu(cut([
            r.makeHead1, r.makeHead2, r.makeHead3, r.makeHead4, r.makeHead5, r.makeHead6
        ]), { label: "Heading" })]), { label: "Type..." });

    r.inlineMenu = [cut([prosemirrorMenu.undoItem, prosemirrorMenu.redoItem]), cut([r.toggleStrong, r.toggleEm, r.toggleUnderline, r.toggleCode, r.toggleLink])];
    r.blockMenu = [cut([r.alignLeft, r.alignCenter, r.alignRight]), cut([r.wrapBulletList, r.wrapOrderedList, r.wrapBlockQuote,/*, prosemirrorMenu.joinUpItem,
                      prosemirrorMenu.liftItem,*/ prosemirrorMenu.selectParentNodeItem])];
    r.fullMenu = r.inlineMenu.concat([[r.insertMenu, r.typeMenu]], r.blockMenu);

	/* eslint-disable no-cond-assign */

    return r
}

export function prosemirrorSetup(schema: Schema, tabSize: number) {

	const myMenu = buildMenuItems(schema).fullMenu;
	myMenu.splice(2, 0, [new Dropdown(tableMenu, { label: "Table" })]);

	const plugins = [
		buildInputRules(schema),
		//keymap(buildKeymap(options.schema, options.mapKeys)),
		keymap(baseKeymap),
		gapCursor(),
		highlightPlugin(hljs),
		codeCollapsePlugin,
		tableEditing(),
		keymap({
			Tab: (state, dispatch) => {
				const { $head } = state.selection;

				if (sinkListItem(schema.nodes.list_item)(state, dispatch)) {
					return true;
				}
				else if (isInTable(state)) {
					goToNextCell(1)(state, dispatch);
					return true;
				}
				else {
					if (dispatch) {
						const tr = state.tr;
						for (let i = 0; i < tabSize; i++) {
							tr.insertText(" ").scrollIntoView();
						}
						dispatch(tr);
						return true;
					}
				}
			},
			"Shift-Tab": (state, dispatch) => {
				if (liftListItem(schema.nodes.list_item)(state, dispatch)) {
					return true;
				}
				else if (isInTable(state)) {
					goToNextCell(-1)(state, dispatch);
					return true;
				}
				else {
					if (dispatch) {
						const tr = state.tr;

						if (state.selection.to - state.selection.from === 0) {

							let nodesInSelection = 0;
							let node: ProsemirrorNode<any>;
							state.doc.nodesBetween(state.selection.from, state.selection.to, (_node, startPos) => {

								if (_node.type == state.schema.nodes.code_block) {
									nodesInSelection++;
									node = _node;
								}
							});

							if (nodesInSelection == 1 && node != null && node.type == state.schema.nodes.code_block) {

								let text = node.textBetween(0, state.selection.$head.parentOffset);

								const firstIndexOfLine = text.lastIndexOf("\n") || 0;

								text = node.textBetween(0, state.selection.$head.parentOffset + 1);

								const distToStart = text.length - firstIndexOfLine - 1;

								for (let i = 1; i <= tabSize; i++) {
									if (text.charAt(firstIndexOfLine + 1) == " ") {
										tr.delete(state.selection.from - distToStart + 1, state.selection.from - distToStart + 2).scrollIntoView();
									}
								}
							}
						}

						dispatch(tr);
						return true;
					}
				}
				return false;
			}
		}),
	];


	plugins.push(mathPlugin);

	/*plugins.push(menuBar({
		floating: options.floatingMenu !== false,
		content: myMenu
	}));*/
	plugins.push(menuBar({
		//floating: options.floatingMenu !== false,
		floating: true,
		content: myMenu
	}));
	/*if (options.menuBar !== false)
	  { plugins.push(menuBar({floating: options.floatingMenu !== false,
							content: options.menuContent || buildMenuItems(options.schema).fullMenu.splice(2, 0, [new Dropdown(tableMenu, {label: "Table"})])})); }*/
	//if (options.history !== false) { plugins.push(prosemirrorHistory.history()); }
	plugins.push(history());

	return plugins.concat(new Plugin({
		props: {
			attributes: { class: "ProseMirror-example-setup-style" }
		}
	}));
}