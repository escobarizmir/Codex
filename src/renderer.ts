/* 
    Expose the variables/functions sent through the preload.ts
*/

type _MainAPI = {
    featherReplace(): void,
    hljsHighlightCpp(text: string): string,
    ipcHandle(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): void,
    ipcSend(channel: string, ...args: any[]): void,
    defaultDataDir: string,
    isWindowMaximized(): boolean,
    fsExistsSync(path: string): boolean,
    fsReadFileSync(path: string): string,
    fsWriteFileSync(path: string, data: string): void,
    nativeThemeShouldUseDarkColors: boolean
}

type BridgedWindow = Window & typeof globalThis & {
    mainAPI: any
}

const api: _MainAPI = (window as BridgedWindow).mainAPI;



/*
    Type definitions
*/

class UserPrefs {
    theme = 0;
    codeStyle = "atom-one-dark";
    accentColor = "#FF7A27";
    defaultZoom = 1.0;
    defaultMaximized = false;
    dataDir = api.defaultDataDir;
    pdfBreakOnH1 = false;
    pdfDarkMode = false;
    openPDFonExport = true;
    openedNotebooks: Notebook[] = [];
    tabSize = 4;
    sidebarWidth = 275;
    showCodeOverlay = true;
    codeWordWrap = false;
    firstUse = true;
    showMenuBar = true;
}

class Save {
    nextPageIndex = 0;
    notebooks: Notebook[] = [];
}

class Notebook {
    name: string;
    color: string;
    icon = "book";
    pages: Page[] = [];
    constructor(name: string, color: string) {
        this.name = name;
        this.color = color;
        this.pages = [];
    }
}

class Page {
    title: string;
    fileName: string;
    favorite = false;
    constructor(title: string) {
        this.title = title;
        this.fileName = "";
    }
}



/*
    Global variables
*/


// TODO remove this decorator later
/* eslint-disable prefer-const */
let darkStyleLink: HTMLLinkElement;

let save: Save;
let prefs: UserPrefs;
let selectedPage: Page;
let selectedPageContent: string;

let rightClickedNotebookIndex: number;
// PAGE INDEX IS LOCAL TO THE NOTEBOOK
let rightClickedPageIndex: number;

let expandedNotebooks: Notebook[] = [];
let activePage: Page;

let draggedNotebookIndex: number;
let draggedPageIndex: number;
let draggedPagesNotebookIndex: number;
let draggingNotebook = false;
let draggingPage = false;

let fadeInSaveIndicator: NodeJS.Timeout;

let canSaveData = false;
let canSavePrefs = false;
let zoomLevel = 1.000;

let sidebarWidth = 275;

let favoritePages: Page[] = [];

let destroyOpenedNotebooks = false;

const lightThemes = [ "a11y-light", "arduino-light", "ascetic", "atelier-cave-light", "atelier-dune-light", "atelier-estuary-light", "atelier-forest-light", "atelier-heath-light", "atelier-lakeside-light", "atelier-plateau-light", "atelier-savanna-light", "atelier-seaside-light", "atelier-sulphurpool-light", "atom-one-light", "color-brewer", "default", "docco", "foundation", "github-gist", "github", "font-weight: bold;", "googlecode", "grayscale", "gruvbox-light", "idea", "isbl-editor-light", "kimbie.light", "lightfair", "magula", "mono-blue", "nnfx", "paraiso-light", "purebasic", "qtcreator_light", "routeros", "solarized-light", "tomorrow", "vs", "xcode" ];
const darkThemes = [ "a11y-dark", "agate", "androidstudio", "an-old-hope", "arta", "atelier-cave-dark", "atelier-dune-dark", "atelier-estuary-dark", "atelier-forest-dark", "atelier-heath-dark", "atelier-lakeside-dark", "atelier-plateau-dark", "atelier-savanna-dark", "atelier-seaside-dark", "atelier-sulphurpool-dark", "atom-one-dark-reasonable", "atom-one-dark", "font-weight: bold;", "codepen-embed", "darcula", "dark", "dracula", "far", "gml", "gradient-dark", "gruvbox-dark", "hopscotch", "hybrid", "ir-black", "isbl-editor-dark", "kimbie.dark", "lioshi", "monokai-sublime", "monokai", "night-owl", "nnfx-dark", "nord", "ocean", "obsidian", "paraiso-dark", "pojoaque", "qtcreator_dark", "railscasts", "rainbow", "shades-of-purple", "solarized-dark", "srcery", "sunburst", "tomorrow-night-blue", "tomorrow-night-bright", "tomorrow-night-eighties", "tomorrow-night", "vs2015", "xt256", "zenburn" ];
/* eslint-enable prefer-const */

/*
    Initialization
*/

window.onbeforeunload = (e) => {


    //cache which notebooks are opened
    //TODO
    /*prefs.openedNotebooks = [];


    if (destroyOpenedNotebooks == false) {
        for (let i = 0; i < save.notebooks.length; i++) {

            let nbList = document.getElementById(`nb-${i}-list`);
            if (nbList.classList.contains('show')) {
                prefs.openedNotebooks[prefs.openedNotebooks.length] = i;
            }
        }
    }


    saveData();*/
    savePrefs();
};

function init() {

    // These prevent ctrl or middle-clicking on <a>'s causing
    // a new window to pop up
    window.addEventListener("auxclick", (event) => {
        if (event.button === 1) {
            event.preventDefault();
        }
    });
    window.addEventListener("click", (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    });

    // Set up example code block in Settings page and highlight it
    document.getElementById("exampleCode").innerHTML = "//EXAMPLE CODE BLOCK\n#include &lt;iostream&gt;\n\nint main(int argc, char *argv[]) {\n\tfor (auto i = 0; i &lt; 0xFFFF; i++)\n\t\tcout &lt;&lt; \"Hello, World!\" &lt;&lt; endl;\n\treturn -2e3 + 12l;\n}";
    document.getElementById("exampleCode").innerHTML = api.hljsHighlightCpp(document.getElementById("exampleCode").innerText);


    // Get user preferences

    if (api.fsExistsSync(api.defaultDataDir + "/prefs.json")) {
        try {
            const json = api.fsReadFileSync(api.defaultDataDir + "/prefs.json");
            prefs = JSON.parse(json);

            fixPrefs();
            applyPrefsAtStart();
            canSavePrefs = true;
        }
        catch (ex) {
            console.error(ex);
            errorPopup("Your prefs.json file could not be parsed.", "Check the developer console for more information");
        }
    }
    else {
        prefs = new UserPrefs();
        canSavePrefs = true;
        savePrefs();
        applyPrefsAtStart();
    }



    // Feather icons
    api.featherReplace();
}

init();

/*
    Functions
*/

function fixPrefs(): void {

    if (prefs.theme === undefined)
        prefs.theme = 0;

    if (prefs.codeStyle === undefined)
        prefs.codeStyle = "atom-one-dark";

    if (prefs.accentColor === undefined)
        prefs.accentColor = "#FF7A27";

    if (prefs.defaultZoom === undefined)
        prefs.defaultZoom = 1.0;

    if (prefs.defaultMaximized === undefined)
        prefs.defaultMaximized = false;

    if (prefs.dataDir === undefined)
        prefs.dataDir = api.defaultDataDir;

    if (prefs.pdfBreakOnH1 === undefined)
        prefs.pdfBreakOnH1 = false;

    if (prefs.pdfDarkMode === undefined)
        prefs.pdfDarkMode = false;

    if (prefs.openPDFonExport === undefined)
        prefs.openPDFonExport = true;

    if (prefs.openedNotebooks === undefined)
        prefs.openedNotebooks = [];

    if (prefs.tabSize === undefined)
        prefs.tabSize = 4;

    if (prefs.sidebarWidth === undefined)
        prefs.sidebarWidth = 275;

    if (prefs.showCodeOverlay === undefined)
        prefs.showCodeOverlay = true;

    if (prefs.codeWordWrap === undefined)
        prefs.codeWordWrap = false;

    if (prefs.firstUse === undefined)
        prefs.firstUse = true;

    if (prefs.showMenuBar === undefined)
        prefs.showMenuBar = true;

}

function savePrefs(): void {
    if (canSavePrefs) {
        prefs.defaultMaximized = api.isWindowMaximized();

        if (destroyOpenedNotebooks) {
            prefs.openedNotebooks = [];
        }

        try {
            api.fsWriteFileSync(api.defaultDataDir + "/prefs.json", JSON.stringify(prefs, null, 2));
        }
        catch (err) {
            console.error(err);
            errorPopup("Couldn't save preferences file.", "Check the developer console for more information.");
        }
    }
}

function applyPrefsAtStart(): void {
    (document.getElementById("themeSelect") as HTMLSelectElement).value = prefs.theme.toString();
    const header = document.getElementsByTagName("head")[0];
    if (prefs.theme == 1) {
        darkStyleLink = document.createElement("link");
        darkStyleLink.rel = "stylesheet";
        darkStyleLink.type = "text/css";
        darkStyleLink.href = "../css/dark.css";
        darkStyleLink.media = "all";
        header.appendChild(darkStyleLink);
        api.ipcSend("setNativeThemeSource", "dark");
    }
    else if (prefs.theme == 0) {
        api.ipcSend("setNativeThemeSource", "light");
        if (darkStyleLink != null) {
            header.removeChild(darkStyleLink);
            darkStyleLink = null;
        }
    }
    else if (prefs.theme == 2) {
        api.ipcSend("setNativeThemeSource", "system");
        if (api.nativeThemeShouldUseDarkColors) {
            darkStyleLink = document.createElement("link");
            darkStyleLink.rel = "stylesheet";
            darkStyleLink.type = "text/css";
            darkStyleLink.href = "../css/dark.css";
            darkStyleLink.media = "all";
            header.appendChild(darkStyleLink);
        }
    }
    else {
        prefs.theme = 0;
        api.ipcSend("setNativeThemeSource", "light");
    }

    (document.getElementById("codeStyleSelect") as HTMLSelectElement).value = prefs.codeStyle;
    (document.getElementById("codeStyleLink") as HTMLLinkElement).href = `../node_modules/highlight.js/styles/${prefs.codeStyle}.css`;

    if (lightThemes.includes(prefs.codeStyle)) {
        document.documentElement.style.setProperty("--code-overlay-bg-brightness", "0.95");
        document.documentElement.style.setProperty("--code-scrollbar-color", "0");
        document.documentElement.style.setProperty("--code-scrollbar-opacity", "0.07");
    }
    else {
        document.documentElement.style.setProperty("--code-overlay-bg-brightness", "1.25");
        document.documentElement.style.setProperty("--code-scrollbar-color", "255");
        document.documentElement.style.setProperty("--code-scrollbar-opacity", "0.3");
    }

    (document.getElementById("accentColorPicker") as HTMLInputElement).value = prefs.accentColor;
    document.documentElement.style.setProperty("--accent-color", prefs.accentColor);

    (document.getElementById("tabSizeSelect") as HTMLSelectElement).value = prefs.tabSize.toString();

    if (prefs.defaultMaximized) {
        api.ipcSend("maximize");
    }

    zoomLevel = prefs.defaultZoom;
    updateZoom();

    $("#exportBreakPageOnH1Check").prop("checked", prefs.pdfBreakOnH1);
    $("#darkmodePDFCheck").prop("checked", prefs.pdfDarkMode);
    $("#openPDFonExportCheck").prop("checked", prefs.openPDFonExport);

    if (api.fsExistsSync(prefs.dataDir)) {
        document.getElementById("dataDirInput").innerText = prefs.dataDir;

        if (prefs.dataDir == api.defaultDataDir) {
            (document.getElementById("revertToDefaultDataDirBtn") as HTMLButtonElement).disabled = true;
            document.getElementById("revertToDefaultDataDirBtn").style.pointerEvents = "none";
            document.getElementById("revertToDefaultDataDirBtnTooltip").title = "You're already in the default location.";
            $("#revertToDefaultDataDirBtnTooltip").tooltip("dispose");
            $("#revertToDefaultDataDirBtnTooltip").tooltip();
        }
        else {
            (document.getElementById("revertToDefaultDataDirBtn") as HTMLButtonElement).disabled = false;
            document.getElementById("revertToDefaultDataDirBtn").style.pointerEvents = "auto";
            document.getElementById("revertToDefaultDataDirBtnTooltip").title = "Revert to " + api.defaultDataDir;
            $("#revertToDefaultDataDirBtnTooltip").tooltip("dispose");
            $("#revertToDefaultDataDirBtnTooltip").tooltip();
        }
    }
    else {
        alert("Your Save location (" + prefs.dataDir + ") could not be accessed. Reverting to the default (" + api.defaultDataDir + ")");
        prefs.dataDir = api.defaultDataDir;
        document.getElementById("dataDirInput").innerText = prefs.dataDir;
    }

    resizeSidebar(prefs.sidebarWidth);

    $("#showLanguageOverlayCheck").prop("checked", prefs.showCodeOverlay);
    if (prefs.showCodeOverlay === true) {
        (document.getElementById("codeOverlayLink") as HTMLLinkElement).href = "../css/codeoverlay.css";
    }

    $("#codeWordWrapCheck").prop("checked", prefs.codeWordWrap);
    if (prefs.codeWordWrap === true) {
        document.documentElement.style.setProperty("--code-white-space", "pre-wrap");
    }
    else {
        document.documentElement.style.setProperty("--code-white-space", "pre");
    }

    api.ipcSend("setMenuBarVisibility", prefs.showMenuBar);
}

function applyPrefsRuntime(needsRestart = false): void {

    prefs.codeStyle = (document.getElementById("codeStyleSelect") as HTMLSelectElement).value;
    (document.getElementById("codeStyleLink") as HTMLLinkElement).href = `../node_modules/highlight.js/styles/${prefs.codeStyle}.css`;

    if (lightThemes.includes(prefs.codeStyle)) {
        document.documentElement.style.setProperty("--code-overlay-bg-brightness", "0.95");
        document.documentElement.style.setProperty("--code-scrollbar-color", "0");
        document.documentElement.style.setProperty("--code-scrollbar-opacity", "0.07");
    }
    else {
        document.documentElement.style.setProperty("--code-overlay-bg-brightness", "1.25");
        document.documentElement.style.setProperty("--code-scrollbar-color", "255");
        document.documentElement.style.setProperty("--code-scrollbar-opacity", "0.3");
    }

    prefs.theme = parseInt((document.getElementById("themeSelect") as HTMLSelectElement).value);
    const header = document.getElementsByTagName("head")[0];
    if (prefs.theme == 1) {
        if (darkStyleLink == null) {
            darkStyleLink = document.createElement("link");
            darkStyleLink.rel = "stylesheet";
            darkStyleLink.type = "text/css";
            darkStyleLink.href = "../css/dark.css";
            darkStyleLink.media = "all";
            header.appendChild(darkStyleLink);
            api.ipcSend("setNativeThemeSource", "dark");
        }
    }
    else if (prefs.theme == 0) {
        api.ipcSend("setNativeThemeSource", "light");
        if (darkStyleLink != null) {
            header.removeChild(darkStyleLink);
            darkStyleLink = null;
        }
    }
    else if (prefs.theme == 2) {
        api.ipcSend("setNativeThemeSource", "system");
        if (api.nativeThemeShouldUseDarkColors) {
            darkStyleLink = document.createElement("link");
            darkStyleLink.rel = "stylesheet";
            darkStyleLink.type = "text/css";
            darkStyleLink.href = "../css/dark.css";
            darkStyleLink.media = "all";
            header.appendChild(darkStyleLink);
        }
        else {
            if (darkStyleLink != null) {
                header.removeChild(darkStyleLink);
                darkStyleLink = null;
            }
        }
    }
    else {
        prefs.theme = 0;
    }

    prefs.accentColor = (document.getElementById("accentColorPicker") as HTMLInputElement).value;
    document.documentElement.style.setProperty("--accent-color", prefs.accentColor);

    prefs.tabSize = parseInt((document.getElementById("tabSizeSelect") as HTMLSelectElement).value);

    prefs.pdfBreakOnH1 = $("#exportBreakPageOnH1Check").is(":checked");
    prefs.pdfDarkMode = $("#darkmodePDFCheck").is(":checked");
    prefs.openPDFonExport = $("#openPDFonExportCheck").is(":checked");

    //check to make sure this path is valid
    prefs.dataDir = document.getElementById("dataDirInput").innerText;

    if (api.fsExistsSync(prefs.dataDir)) {
        document.getElementById("dataDirInput").innerText = prefs.dataDir;

        if (prefs.dataDir == api.defaultDataDir) {
            (document.getElementById("revertToDefaultDataDirBtn") as HTMLButtonElement).disabled = true;
            document.getElementById("revertToDefaultDataDirBtn").style.pointerEvents = "none";
            document.getElementById("revertToDefaultDataDirBtnTooltip").title = "You're already in the default location.";
            $("#revertToDefaultDataDirBtnTooltip").tooltip("dispose");
            $("#revertToDefaultDataDirBtnTooltip").tooltip();
        }
        else {
            (document.getElementById("revertToDefaultDataDirBtn") as HTMLButtonElement).disabled = false;
            document.getElementById("revertToDefaultDataDirBtn").style.pointerEvents = "auto";
            document.getElementById("revertToDefaultDataDirBtnTooltip").title = "Revert to " + api.defaultDataDir;
            $("#revertToDefaultDataDirBtnTooltip").tooltip("dispose");
            $("#revertToDefaultDataDirBtnTooltip").tooltip();
        }
    }
    else {
        prefs.dataDir = api.defaultDataDir;
        document.getElementById("dataDirInput").innerText = prefs.dataDir;
        alert("The specified save directory could not be accessed. Reverting to default.");
    }

    savePrefs();

    if (needsRestart) {
        api.ipcSend("restart");
    }

    prefs.sidebarWidth = sidebarWidth;

    prefs.showCodeOverlay = $("#showLanguageOverlayCheck").is(":checked");
    if (prefs.showCodeOverlay === true) {
        (document.getElementById("codeOverlayLink") as HTMLLinkElement).href = "../css/codeoverlay.css";
    }
    else {
        (document.getElementById("codeOverlayLink") as HTMLLinkElement).href = "";
    }

    prefs.codeWordWrap = $("#codeWordWrapCheck").is(":checked");
    if (prefs.codeWordWrap === true) {
        document.documentElement.style.setProperty("--code-white-space", "pre-wrap");
    }
    else {
        document.documentElement.style.setProperty("--code-white-space", "pre");
    }

}

function errorPopup(message: string, detail: string) {
    api.ipcSend("errorPopup", message, detail);
}

function showUIPage(id: "homePage" | "settingsPage" | "helpPage" | "editorPage"): void {
    const ids = ["homePage", "settingsPage", "helpPage", "editorPage"];

    if (ids.indexOf(id) != -1) {
        ids.splice(ids.indexOf(id), 1);

        ids.forEach(element => {
            document.getElementById(element).style.display = "none";
        });

        document.getElementById(id).style.display = "block";

        document.getElementById("mainContainer").scrollTo(0, 0);
    }
}

function updateZoom(): void {
    prefs.defaultZoom = zoomLevel;

    const ec = document.getElementById("editorContent");
    const mainContainer = document.getElementById("mainContainer");

    const oldScrollTop = mainContainer.scrollTop;
    const oldScrollHeight = mainContainer.scrollHeight;

    // The zoom variable is not part of any standard but seems to work how
    // how I want it to for now
    // @ts-ignore
    ec.style.zoom = `${zoomLevel}`;

    mainContainer.scrollTop = (oldScrollTop / oldScrollHeight) * mainContainer.scrollHeight;
}

function resizeSidebar(width: number): void {
    if (width >= 200 && width <= 600) {
        sidebarWidth = width;
        prefs.sidebarWidth = sidebarWidth;

        if (document.documentElement.style.getPropertyValue("--sidebar-width") != "0px") {
            document.documentElement.style.setProperty("--sidebar-width", `${sidebarWidth}px`);   
        }
    }
}

/*
    IPC Handlers
*/

api.ipcHandle("updateAvailable", (event, newVersion) => {
    setTimeout(() => {
        document.getElementById("updateBlockText").textContent = `New update available (${newVersion})`;
        $("#updateBlockLI").fadeIn();
    }, 1000);
});

api.ipcHandle("console.log", (event, text) => {
    console.log(text);
});

api.ipcHandle("console.error", (event, text) => {
    console.error(text);
});