/* 
    Expose the variables/functions sent through the preload.ts
*/

type _MainAPI = {
    featherReplace(): void,
    hljsHighlightCpp(text: string): string,
    ipcHandle(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): void,
    ipcSend(channel: string, ...args: any[]): void,
    defaultDataDir: string,
    fsExistsSync(path: string): boolean,
    fsReadFileSync(path: string): string,
    jsonParse(text: string): any
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

let prefs: UserPrefs;
let save: Save;
let currentPage: Page;
let canSaveData = false;
let canSavePrefs = false;


/*
    Initialization
*/

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


    // TODO: Set up titlebars

    // Set up example code block in Settings page and highlight it
    document.getElementById("exampleCode").innerHTML = "//EXAMPLE CODE BLOCK\n#include &lt;iostream&gt;\n\nint main(int argc, char *argv[]) {\n\tfor (auto i = 0; i &lt; 0xFFFF; i++)\n\t\tcout &lt;&lt; \"Hello, World!\" &lt;&lt; endl;\n\treturn -2e3 + 12l;\n}";
    document.getElementById("exampleCode").innerHTML = api.hljsHighlightCpp(document.getElementById("exampleCode").innerText);


    // Get user preferences

    if (api.fsExistsSync(api.defaultDataDir + "/prefs.json")) {
        try {
            const json = api.fsReadFileSync(api.defaultDataDir + "/prefs.json");
            prefs = JSON.parse(json);

            // fixPrefs();
            // applyPrefsRuntime();
            // canSavePrefs = true;
        }
        catch (ex) {
            console.error(ex);
            errorPopup("Your prefs.json file could not be parsed.", "Check the developer console for more information");
        }
    }



    // Feather icons
    api.featherReplace();
}

init();



/*
    IPC Handlers
*/

api.ipcHandle("updateAvailable", (event, newVersion) => {
    setTimeout(() => {
        document.getElementById("updateBlockText").textContent = `New update available (${newVersion})`;
        $("#updateBlockLI").fadeIn();
    }, 1000);
});

function errorPopup(message: string, detail: string) {
    api.ipcSend("errorPopup", message, detail);
}


/*
    UI Event Handlers
*/

function showUIPage(id: string): void {
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