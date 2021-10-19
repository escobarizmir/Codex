// Modules to control application life and create native browser window
import { app, BrowserWindow, dialog, net, MessageBoxOptions } from "electron";
import * as path from "path";
import validator from "validator";
import * as semver from "semver";

// This makes sure we get a non-cached verison of the "latestversion.txt" file for the update check
app.commandLine.appendSwitch("disable-http-cache");

const currentVersion = "2.0.0";

let mainWindow: BrowserWindow = null;
const gotTheLock = app.requestSingleInstanceLock();

//FORCE SINGLE INSTANCE
if (!gotTheLock) {
    app.quit();
}
else {
    app.on("second-instance", () => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on("ready", createWindow);

    // Quit when all windows are closed.
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
            nodeIntegration: false,
            contextIsolation: true,
            preload: __dirname + "/preload.js"
        },
        icon: path.join(__dirname, iconPath),
        show: false,
        title: "Codex"
    });

    mainWindow.loadFile("html/index.html");

    mainWindow.webContents.once("dom-ready", () => {

        mainWindow.show();
        checkForUpdates();

    });

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    //Menu.setApplicationMenu(new Menu());

}

function checkForUpdates() {
    try {
        const request = net.request("https://jcv8000.github.io/codex/latestversion.txt");
        request.on("response", (response) => {
            response.on("data", (chunk) => {

                const onlineVersion = validator.escape(chunk.toString());

                if (semver.valid(onlineVersion)) {

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
}