import { app, BrowserWindow, dialog, net, MessageBoxOptions, ipcMain, nativeTheme, Menu, MenuItem, shell } from "electron";
import * as path from "path";
import validator from "validator";
import * as semver from "semver";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const remote = require("@electron/remote/main");

// TODO: This package as of 3.1.1 has a broken type file that won't let me compile with TS.
//       When it gets fixed turn this back into a normal TS import.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contextMenu = require("electron-context-menu");

// This makes sure we get a non-cached verison of the "latestversion.txt" file for the update check
app.commandLine.appendSwitch("disable-http-cache");
app.disableHardwareAcceleration();

const currentVersion = "2.0.0";
let mainWindow: BrowserWindow = null;
const gotTheLock = app.requestSingleInstanceLock();


//FORCE SINGLE INSTANCE
if (!gotTheLock) {
    app.quit();
}
else {
    app.on("second-instance", () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.on("ready", createWindow);

    app.on("window-all-closed", function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== "darwin") {
            app.quit();
        }
    });

    app.on("activate", function () {
        // On OS X it"s common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}

// Disable navigation
// https://www.electronjs.org/docs/latest/tutorial/security#13-disable-or-limit-navigation
app.on("web-contents-created", (event, contents) => {
    contents.on("will-navigate", (event) => {
        event.preventDefault();
    });
});

function createWindow() {

    let useFrame = true;
    let iconPath = "";

    if (process.platform === "win32") {
        useFrame = false;
        iconPath = "../assets/icons/icon.ico";
    }
    else if (process.platform === "linux") {
        iconPath = "../assets/icons/64x64.png";
    }
    else if (process.platform === "darwin") {
        iconPath = "../assets/icons/icon.icns";
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        frame: useFrame,
        minWidth: 920,
        minHeight: 500,
        webPreferences: {
            preload: __dirname + "/preload.js",
        },
        icon: path.join(__dirname, iconPath),
        show: false,
        title: "Codex"
    });

    // Enable @electron/remote in preload so we can
    // use the custom titlebar
    remote.enable(mainWindow.webContents);
    remote.initialize();

    mainWindow.loadFile("html/index.html");

    contextMenu({
        showSearchWithGoogle: false,
        showLookUpSelection: false
    });

    Menu.setApplicationMenu(normalMenu);

    mainWindow.webContents.once("dom-ready", () => {

        mainWindow.show();
        checkForUpdates();

    });

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

}

function checkForUpdates() {
    try {
        const request = net.request("https://jcv8000.github.io/codex/latestversion.txt");
        request.on("response", (response) => {
            response.on("data", (chunk) => {

                const onlineVersion = validator.escape(chunk.toString());

                if (semver.valid(onlineVersion)) {

                    mainWindow.webContents.send("console.log", `Checking for updates\nCurrent version: ${currentVersion}\nLatest version: ${onlineVersion}`);

                    // Check if online version # is greater than current version
                    if (semver.compare(currentVersion, onlineVersion) == -1) {
                        mainWindow.webContents.send("updateAvailable", onlineVersion);
                    }

                }
                else {
                    errorPoup("Failed to check for updates", "Response body was not a valid version number.");
                }

            });
            response.on("aborted", () => {
                errorPoup("Net request aborted while trying to check for updates", "");
            });
            response.on("error", (error: Error) => {
                errorPoup("Failed to check for updates", error.toString());
            });
        });

        request.on("redirect", () => {
            request.abort();
        });

        request.end();

        request.on("error", (err) => {
            errorPoup("Failed to check for updates", err.toString());
        });

    }
    catch (err) {
        errorPoup("Failed to check for updates", err.toString());
    }
}

function errorPoup(mes: string, det: string) {
    const options: MessageBoxOptions = {
        type: "error",
        buttons: ["Ok"],
        defaultId: 0,
        cancelId: 0,
        detail: det,
        title: "Error",
        message: mes
    };
    dialog.showMessageBox(mainWindow, options);

    mainWindow.webContents.send("console.error", `${mes}\n${det}`);
}

function executeJavascriptInRenderer(js: string): void {
    mainWindow.webContents.executeJavaScript(js + ";0").catch((reason) => {
        errorPoup("Error executing javascript in renderer process", reason.toString());
    });
}


const normalMenu = new Menu();
normalMenu.append(new MenuItem({
    label: "File",
    submenu: [
        {
            label: "New Notebook",
            accelerator: "CmdOrCtrl+N",
            click: () => executeJavascriptInRenderer("$('#newNotebookModal').modal('show')")
        },
        {
            type: "separator"
        },
        {
            label: "Exit",
            click: () => app.exit()
        }
    ]
}));

normalMenu.append(new MenuItem({
    label: "View",
    submenu: [
        {
            label: "Toggle Sidebar",
            accelerator: "CmdOrCtrl+D",
            click: () => executeJavascriptInRenderer("toggleSidebar(null)")
        },
        {
            label: "Reset Sidebar Width",
            click: () => executeJavascriptInRenderer("resizeSidebar(275)")
        },
        {
            type: "separator"
        },
        {
            label: "Toggle Developer Tools",
            accelerator: "CmdOrCtrl+Shift+I",
            click: () => mainWindow.webContents.toggleDevTools()
        }
    ]
}));

normalMenu.append(new MenuItem({
    label: "Help",
    submenu: [
        {
            label: "Help",
            accelerator: "F1",
            click: () => executeJavascriptInRenderer("autoOpenHelpTab()")
        },
        {
            label: "Website",
            click: () => shell.openExternal("https://www.codexnotes.com/")
        },
        {
            label: "Update notes",
            click: () => shell.openExternal("https://www.codexnotes.com/updates/")
        },
        {
            label: "Give Feedback (Google Forms)",
            click: () => shell.openExternal("https://forms.gle/uDLJpqLbNLcEx1F8A")
        },
        {
            type: "separator"
        },
        {
            label: "About",
            click: () => executeJavascriptInRenderer("openAboutPage()")
        }
    ]
}));


const editingMenu = new Menu();
editingMenu.append(new MenuItem({
    label: "File",
    submenu: [
        {
            label: "New Notebook",
            accelerator: "CmdOrCtrl+N",
            click: () => executeJavascriptInRenderer("$('#newNotebookModal').modal('show')")
        },
        {
            label: "Save Page",
            accelerator: "CmdOrCtrl+S",
            click: () => executeJavascriptInRenderer("saveSelectedPage(true)")
        },
        {
            type: "separator"
        },
        {
            label: "Export page to PDF...",
            accelerator: "CmdOrCtrl+P",
            click: () => executeJavascriptInRenderer("printCurrentPage()")
        },
        {
            label: "Export page to Markdown...",
            click: () => executeJavascriptInRenderer("exportCurrentPageToMarkdown()")
        },
        {
            type: "separator"
        },
        {
            label: "Exit",
            click: () => app.exit()
        }
    ]
}));

editingMenu.append(new MenuItem({
    label: "Edit",
    submenu: [
        {
            label: "Cut",
            accelerator: "CmdOrCtrl+X",
            ////click: () => document.execCommand("cut")
        },
        {
            label: "Copy",
            accelerator: "CmdOrCtrl+C",
            ////click: () => document.execCommand("copy")
        },
        {
            label: "Paste",
            accelerator: "CmdOrCtrl+V",
            ////click: () => document.execCommand("paste")
        }
    ]
}));

editingMenu.append(new MenuItem({
    label: "View",
    submenu: [
        {
            label: "Zoom In",
            accelerator: "CmdOrCtrl+=",
            click: () => executeJavascriptInRenderer("zoomIn()")
        },
        {
            label: "Zoom Out",
            accelerator: "CmdOrCtrl+-",
            click: () => executeJavascriptInRenderer("zoomOut()")
        },
        {
            label: "Restore Default Zoom",
            accelerator: "CmdOrCtrl+R",
            click: () => executeJavascriptInRenderer("defaultZoom()")
        },
        {
            type: "separator"
        },
        {
            label: "Toggle Sidebar",
            accelerator: "CmdOrCtrl+D",
            click: () => executeJavascriptInRenderer("toggleSidebar(null)")
        },
        {
            label: "Reset Sidebar Width",
            click: () => executeJavascriptInRenderer("resizeSidebar(275)")
        },
        {
            label: "Toggle Editor Toolbar",
            accelerator: "CmdOrCtrl+T",
            click: () => executeJavascriptInRenderer("toggleEditorRibbon()")
        },
        {
            type: "separator"
        },
        {
            label: "Toggle Developer Tools",
            accelerator: "CmdOrCtrl+Shift+I",
            click: () => mainWindow.webContents.toggleDevTools()
        }
    ]
}));

editingMenu.append(new MenuItem({
    label: "Help",
    submenu: [
        {
            label: "Help",
            accelerator: "F1",
            click: () => executeJavascriptInRenderer("autoOpenHelpTab()")
        },
        {
            label: "Website",
            click: () => shell.openExternal("https://www.codexnotes.com/")
        },
        {
            label: "Update notes",
            click: () => shell.openExternal("https://www.codexnotes.com/updates/")
        },
        {
            label: "Give Feedback (Google Forms)",
            click: () => shell.openExternal("https://forms.gle/uDLJpqLbNLcEx1F8A")
        },
        {
            type: "separator"
        },
        {
            label: "About",
            click: () => executeJavascriptInRenderer("openAboutPage()")
        }
    ]
}));

// Add the "Toggle Menu Bar" option for linux users
if (process.platform === "linux") {
    normalMenu.items[1].submenu.append(new MenuItem({
        label: "Toggle Menu Bar",
        click: () => {
            const current = mainWindow.isMenuBarVisible();
            mainWindow.setMenuBarVisibility(!current);
            mainWindow.webContents.send("prefsShowMenuBar", !current);
        },
        accelerator: "Ctrl+M"
    }));
    editingMenu.items[2].submenu.append(new MenuItem({
        label: "Toggle Menu Bar",
        click: () => {
            const current = mainWindow.isMenuBarVisible();
            mainWindow.setMenuBarVisibility(!current);
            mainWindow.webContents.send("prefsShowMenuBar", !current);
        },
        accelerator: "Ctrl+M"
    }));
}

/*
    IPC Events
*/

ipcMain.on("errorPopup", (event, args: string[]) => {
    errorPoup(args[0], args[1]);
});

ipcMain.on("setNativeThemeSource", (event, value: string) => {
    if (value == "system")
        nativeTheme.themeSource = "system";
    else if (value == "light")
        nativeTheme.themeSource = "light";
    else if (value == "dark")
        nativeTheme.themeSource = "dark";
});

ipcMain.on("maximize", (event) => {
    mainWindow.maximize();
});

ipcMain.on("setMenuBarVisibility", (event, value: boolean) => {
    mainWindow.setMenuBarVisibility(value);
});

ipcMain.on("restart", (event) => {
    app.relaunch();
    app.exit();
});

ipcMain.on("exit", (event) => {
    app.exit();
});

ipcMain.on("normalMenu", (event) => {
    Menu.setApplicationMenu(normalMenu);
});

ipcMain.on("editingMenu", (event) => {
    Menu.setApplicationMenu(editingMenu);
});

ipcMain.on("defaultDataDir", (event) => {
    event.returnValue = app.getPath("userData");
});

ipcMain.on("isWindowMaximized", (event) => {
    event.returnValue = mainWindow.isMaximized();
});

ipcMain.on("nativeThemeShouldUseDarkColors", (event) => {
    event.returnValue = nativeTheme.shouldUseDarkColors;
});