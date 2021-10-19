/* 
    Expose the variables/functions sent through the preload.ts 
*/

type _MainAPI = {
    featherReplace(): void,
    hljs: HLJSApi,
    ipcHandle(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): void,
    initializeTitlebar(): void
}

type BridgedWindow = Window & typeof globalThis & {
    mainAPI: any
}

const mainAPI: _MainAPI = (window as BridgedWindow).mainAPI;



/*
    Type definitions
*/

class Notebook {

}

class Page {

}

class Save {

}



/*
    Global variables
*/

let save: Save;
let currentPage: Page;


/*
    Initialization
*/

function init() {

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

    //TODO: Set up ContextMenu

    mainAPI.featherReplace();

}

init();



/*
    IPC Handlers
*/

mainAPI.ipcHandle("updateAvailable", (event, newVersion) => {
    setTimeout(() => {
        document.getElementById("updateBlockText").textContent = `New update available (${newVersion})`;
        $("#updateBlockLI").fadeIn();
    }, 1000);
});



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