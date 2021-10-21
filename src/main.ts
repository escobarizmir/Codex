import { app, BrowserWindow, dialog, net, MessageBoxOptions, ipcMain, nativeTheme } from "electron";
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
        useFrame = true;
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
    // send over app.getPath("userData")
    remote.enable(mainWindow.webContents);
    remote.initialize();

    mainWindow.loadFile("html/index.html");

    contextMenu({
        showSearchWithGoogle: false,
        showLookUpSelection: false
    });

    mainWindow.webContents.once("dom-ready", () => {

        mainWindow.show();
        checkForUpdates();

    });

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    //Menu.setApplicationMenu(new Menu());

}

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

function checkForUpdates() {
    try {
        const request = net.request("https://jcv8000.github.io/codex/latestversion.txt");
        request.on("response", (response) => {
            response.on("data", (chunk) => {

                const onlineVersion = validator.escape(chunk.toString());

                if (semver.valid(onlineVersion)) {

                    mainWindow.webContents.send("console.log", `UPDATE CHECK\nCurrent version: ${currentVersion}\nLatest version: ${onlineVersion}`);

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